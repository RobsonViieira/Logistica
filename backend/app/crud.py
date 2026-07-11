# ── CRUD: todas as operações de banco de dados ───────────────

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional, List
from . import models, schemas


# ══════════════════════════════════════════════════════════════
# PRODUTOS
# ══════════════════════════════════════════════════════════════

def criar_produto(db: Session, produto: schemas.ProdutoCreate):
    db_produto = models.Produto(**produto.model_dump())
    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    # Cria registro de estoque zerado
    db_estoque = models.Estoque(produto_id=db_produto.id, quantidade=0)
    db.add(db_estoque)
    db.commit()
    return db_produto

def listar_produtos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Produto).offset(skip).limit(limit).all()

def buscar_produto_por_codigo(db: Session, codigo: str):
    return db.query(models.Produto).filter(models.Produto.codigo == codigo.upper()).first()

def buscar_produto_por_id(db: Session, produto_id: int):
    return db.query(models.Produto).filter(models.Produto.id == produto_id).first()

def atualizar_produto(db: Session, produto_id: int, dados: schemas.ProdutoUpdate):
    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()
    if not produto:
        return None
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(produto, campo, valor)
    db.commit()
    db.refresh(produto)
    return produto


# ══════════════════════════════════════════════════════════════
# ESTOQUE
# ══════════════════════════════════════════════════════════════

def get_estoque_produto(db: Session, produto_id: int) -> float:
    """Retorna quantidade atual em estoque"""
    est = db.query(models.Estoque).filter(models.Estoque.produto_id == produto_id).first()
    return est.quantidade if est else 0.0

def listar_estoque(db: Session) -> List[dict]:
    """Retorna posição completa do estoque com alertas"""
    produtos = db.query(models.Produto).all()
    resultado = []
    for p in produtos:
        qtd = get_estoque_produto(db, p.id)
        loc = db.query(models.Localizacao).filter(models.Localizacao.produto_id == p.id).first()
        resultado.append({
            "produto_id": p.id,
            "produto_codigo": p.codigo,
            "produto_nome": p.nome,
            "quantidade": qtd,
            "estoque_minimo": p.estoque_minimo,
            "unidade": p.unidade,
            "alerta": qtd <= p.estoque_minimo and p.estoque_minimo > 0,
            "localizacao": loc.endereco if loc else None,
            "categoria": p.categoria,
        })
    return resultado

def itens_abaixo_minimo(db: Session):
    """Retorna apenas itens críticos (abaixo do mínimo)"""
    todos = listar_estoque(db)
    return [item for item in todos if item["alerta"]]

def _atualizar_qtd_estoque(db: Session, produto_id: int, delta: float):
    """Incrementa ou decrementa estoque (delta positivo = entrada, negativo = saída)"""
    est = db.query(models.Estoque).filter(models.Estoque.produto_id == produto_id).first()
    if not est:
        est = models.Estoque(produto_id=produto_id, quantidade=0)
        db.add(est)
    est.quantidade = max(0, est.quantidade + delta)
    est.atualizado_em = datetime.utcnow()
    db.commit()

def ajustar_estoque(db: Session, ajuste: schemas.AjusteEstoque):
    """Ajuste direto de inventário (seta a quantidade exata)"""
    est = db.query(models.Estoque).filter(models.Estoque.produto_id == ajuste.produto_id).first()
    quantidade_anterior = est.quantidade if est else 0
    if not est:
        est = models.Estoque(produto_id=ajuste.produto_id, quantidade=ajuste.quantidade)
        db.add(est)
    else:
        est.quantidade = ajuste.quantidade
    db.commit()
    # Registra a movimentação de ajuste
    mov = models.Movimentacao(
        produto_id=ajuste.produto_id,
        tipo="ajuste",
        quantidade=ajuste.quantidade - quantidade_anterior,
        referencia="AJUSTE-INVENTARIO",
        operador=ajuste.operador,
        observacao=ajuste.motivo
    )
    db.add(mov)
    db.commit()
    return {"mensagem": "Estoque ajustado", "novo_estoque": ajuste.quantidade}


# ══════════════════════════════════════════════════════════════
# MOVIMENTAÇÕES
# ══════════════════════════════════════════════════════════════

def criar_movimentacao(db: Session, mov: schemas.MovimentacaoCreate):
    db_mov = models.Movimentacao(**mov.model_dump())
    db.add(db_mov)
    
    # Atualiza estoque automaticamente
    delta = mov.quantidade if mov.tipo == "entrada" else -mov.quantidade
    if mov.tipo != "ajuste":
        _atualizar_qtd_estoque(db, mov.produto_id, delta)
    
    db.commit()
    db.refresh(db_mov)
    return db_mov

def listar_movimentacoes(db: Session, produto_id=None, tipo=None, limit=50):
    query = db.query(models.Movimentacao)
    if produto_id:
        query = query.filter(models.Movimentacao.produto_id == produto_id)
    if tipo:
        query = query.filter(models.Movimentacao.tipo == tipo)
    return query.order_by(models.Movimentacao.criado_em.desc()).limit(limit).all()


# ══════════════════════════════════════════════════════════════
# ORDENS DE SERVIÇO
# ══════════════════════════════════════════════════════════════

def criar_ordem(db: Session, ordem: schemas.OrdemServicoCreate):
    itens_data = ordem.itens
    ordem_data = ordem.model_dump(exclude={"itens"})
    db_ordem = models.OrdemServico(**ordem_data)
    db.add(db_ordem)
    db.flush()  # Gera o ID sem commitar

    for item in itens_data:
        db_item = models.ItemOrdem(ordem_id=db_ordem.id, **item.model_dump())
        db.add(db_item)

    db.commit()
    db.refresh(db_ordem)
    return db_ordem

def listar_ordens(db: Session, status=None):
    query = db.query(models.OrdemServico)
    if status:
        query = query.filter(models.OrdemServico.status == status)
    return query.order_by(models.OrdemServico.criado_em.desc()).all()

def atualizar_status_ordem(db: Session, ordem_id: int, status: str):
    ordem = db.query(models.OrdemServico).filter(models.OrdemServico.id == ordem_id).first()
    if not ordem:
        return None
    ordem.status = status
    if status == "concluida":
        ordem.concluido_em = datetime.utcnow()
    db.commit()
    return ordem


# ══════════════════════════════════════════════════════════════
# LOCALIZAÇÃO
# ══════════════════════════════════════════════════════════════

def criar_localizacao(db: Session, loc: schemas.LocalizacaoCreate):
    db_loc = models.Localizacao(**loc.model_dump())
    db.add(db_loc)
    db.commit()
    db.refresh(db_loc)
    return db_loc

def listar_localizacoes(db: Session):
    return db.query(models.Localizacao).all()

def alocar_produto(db: Session, produto_id: int, localizacao_id: int):
    loc = db.query(models.Localizacao).filter(models.Localizacao.id == localizacao_id).first()
    if not loc:
        return {"erro": "Localização não encontrada"}
    loc.produto_id = produto_id
    db.commit()
    return {"mensagem": f"Produto {produto_id} alocado em {loc.endereco}"}


# ══════════════════════════════════════════════════════════════
# DASHBOARD
# ══════════════════════════════════════════════════════════════

def get_dashboard_data(db: Session):
    total_produtos = db.query(func.count(models.Produto.id)).scalar()
    total_movimentacoes = db.query(func.count(models.Movimentacao.id)).scalar()
    ordens_pendentes = db.query(func.count(models.OrdemServico.id)).filter(
        models.OrdemServico.status == "pendente"
    ).scalar()
    alertas = itens_abaixo_minimo(db)
    
    # Últimas 5 movimentações
    ultimas_mov = db.query(models.Movimentacao).order_by(
        models.Movimentacao.criado_em.desc()
    ).limit(5).all()

    return {
        "total_produtos": total_produtos,
        "total_movimentacoes": total_movimentacoes,
        "ordens_pendentes": ordens_pendentes,
        "alertas_estoque": len(alertas),
        "itens_criticos": alertas[:5],  # Top 5 críticos
        "ultimas_movimentacoes": [
            {
                "id": m.id,
                "tipo": m.tipo,
                "produto_id": m.produto_id,
                "quantidade": m.quantidade,
                "criado_em": m.criado_em.isoformat()
            } for m in ultimas_mov
        ]
    }

def get_contexto_ia(db: Session) -> str:
    """Gera contexto textual do estoque para a IA"""
    alertas = itens_abaixo_minimo(db)
    estoque = listar_estoque(db)
    ordens = listar_ordens(db, status="pendente")
    
    ctx = f"""
CONTEXTO ATUAL DO ESTOQUE (GLM - Gerenciador de Logística):
- Total de produtos cadastrados: {len(estoque)}
- Itens com alerta de estoque baixo: {len(alertas)}
- Ordens pendentes: {len(ordens)}

ITENS CRÍTICOS (abaixo do mínimo):
"""
    for a in alertas[:10]:
        ctx += f"  • {a['produto_nome']} (Cód: {a['produto_codigo']}): {a['quantidade']} {a['unidade']} (mínimo: {a['estoque_minimo']})\n"
    
    ctx += "\nPOSIÇÃO DO ESTOQUE:\n"
    for e in estoque[:20]:
        ctx += f"  • {e['produto_nome']}: {e['quantidade']} {e['unidade']}\n"
    
    return ctx
