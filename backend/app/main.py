# ============================================================
# GLM - Gerenciador de Logística Modular
# Backend: FastAPI + SQLite (migra para MySQL facilmente)
# ============================================================

import logging
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from .database import engine, get_db
from . import models, schemas, crud
from .ai_assistant import AIAssistant

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("GLM")

# ── Criar tabelas no banco ────────────────────────────────────
models.Base.metadata.create_all(bind=engine)

# ── App ───────────────────────────────────────────────────────
app = FastAPI(
    title="GLM - Gerenciador de Logística Modular",
    description="Sistema de logística industrial com IA integrada",
    version="1.0.0"
)

# ── CORS (permite frontend React e celulares na rede local) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai = AIAssistant()

# ── Handler global de erros ───────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Erro não tratado: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Erro interno no servidor"})

# ── Health Check ─────────────────────────────────────────────
@app.get("/health", tags=["Sistema"])
def health_check():
    return {"status": "ok", "sistema": "GLM v1.0"}

# ══════════════════════════════════════════════════════════════
# PRODUTOS / SKUs
# ══════════════════════════════════════════════════════════════

@app.post("/produtos/", response_model=schemas.Produto, tags=["Produtos"])
def criar_produto(produto: schemas.ProdutoCreate, db: Session = Depends(get_db)):
    """Cadastra um novo produto/SKU no sistema"""
    if crud.buscar_produto_por_codigo(db, produto.codigo):
        raise HTTPException(status_code=400, detail="Código já cadastrado")
    result = crud.criar_produto(db, produto)
    logger.info(f"Produto criado: {produto.codigo}")
    return result

@app.get("/produtos/", response_model=List[schemas.Produto], tags=["Produtos"])
def listar_produtos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todos os produtos cadastrados"""
    return crud.listar_produtos(db, skip=skip, limit=limit)

@app.get("/produtos/{codigo}", response_model=schemas.Produto, tags=["Produtos"])
def buscar_produto(codigo: str, db: Session = Depends(get_db)):
    """Busca produto por código (usado pelo coletor/celular ao escanear QR)"""
    produto = crud.buscar_produto_por_codigo(db, codigo)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto

@app.put("/produtos/{produto_id}", response_model=schemas.Produto, tags=["Produtos"])
def atualizar_produto(produto_id: int, dados: schemas.ProdutoUpdate, db: Session = Depends(get_db)):
    """Atualiza dados de um produto"""
    produto = crud.atualizar_produto(db, produto_id, dados)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto

# ══════════════════════════════════════════════════════════════
# ESTOQUE
# ══════════════════════════════════════════════════════════════

@app.get("/estoque/", response_model=List[schemas.EstoqueItem], tags=["Estoque"])
def listar_estoque(db: Session = Depends(get_db)):
    """Lista posição atual do estoque com alertas de mínimo"""
    return crud.listar_estoque(db)

@app.get("/estoque/alertas", tags=["Estoque"])
def alertas_estoque(db: Session = Depends(get_db)):
    """Retorna itens abaixo do estoque mínimo"""
    alertas = crud.itens_abaixo_minimo(db)
    return {"alertas": alertas, "total": len(alertas)}

@app.post("/estoque/ajuste", tags=["Estoque"])
def ajustar_estoque(ajuste: schemas.AjusteEstoque, db: Session = Depends(get_db)):
    """Ajuste manual de estoque (inventário)"""
    result = crud.ajustar_estoque(db, ajuste)
    logger.info(f"Ajuste estoque: produto {ajuste.produto_id}, qtd {ajuste.quantidade}")
    return result

# ══════════════════════════════════════════════════════════════
# MOVIMENTAÇÕES (Entrada / Saída)
# ══════════════════════════════════════════════════════════════

@app.post("/movimentacoes/", response_model=schemas.Movimentacao, tags=["Movimentações"])
def criar_movimentacao(mov: schemas.MovimentacaoCreate, db: Session = Depends(get_db)):
    """
    Registra entrada ou saída de material.
    Usado pelo coletor (celular) ao escanear QR Code.
    """
    # Valida produto existente
    produto = crud.buscar_produto_por_id(db, mov.produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Valida estoque para saídas
    if mov.tipo == "saida":
        estoque_atual = crud.get_estoque_produto(db, mov.produto_id)
        if estoque_atual < mov.quantidade:
            raise HTTPException(
                status_code=400,
                detail=f"Estoque insuficiente. Disponível: {estoque_atual}"
            )
    
    result = crud.criar_movimentacao(db, mov)
    logger.info(f"Movimentação: {mov.tipo} | Produto {mov.produto_id} | Qtd {mov.quantidade}")
    return result

@app.get("/movimentacoes/", response_model=List[schemas.Movimentacao], tags=["Movimentações"])
def listar_movimentacoes(
    produto_id: Optional[int] = None,
    tipo: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Lista movimentações com filtros opcionais"""
    return crud.listar_movimentacoes(db, produto_id=produto_id, tipo=tipo, limit=limit)

# ══════════════════════════════════════════════════════════════
# ORDENS DE SERVIÇO
# ══════════════════════════════════════════════════════════════

@app.post("/ordens/", response_model=schemas.OrdemServico, tags=["Ordens"])
def criar_ordem(ordem: schemas.OrdemServicoCreate, db: Session = Depends(get_db)):
    """Cria uma nova ordem de separação/expedição"""
    result = crud.criar_ordem(db, ordem)
    logger.info(f"Ordem criada: #{result.id} | {ordem.tipo}")
    return result

@app.get("/ordens/", response_model=List[schemas.OrdemServico], tags=["Ordens"])
def listar_ordens(status: Optional[str] = None, db: Session = Depends(get_db)):
    """Lista ordens de serviço, filtráveis por status"""
    return crud.listar_ordens(db, status=status)

@app.patch("/ordens/{ordem_id}/status", tags=["Ordens"])
def atualizar_status_ordem(ordem_id: int, status: str, db: Session = Depends(get_db)):
    """Atualiza status de uma ordem (pendente → em_andamento → concluida)"""
    ordem = crud.atualizar_status_ordem(db, ordem_id, status)
    if not ordem:
        raise HTTPException(status_code=404, detail="Ordem não encontrada")
    return {"mensagem": f"Status atualizado para: {status}", "ordem_id": ordem_id}

# ══════════════════════════════════════════════════════════════
# LOCALIZAÇÃO (Endereçamento de galpão)
# ══════════════════════════════════════════════════════════════

@app.post("/localizacoes/", tags=["Localização"])
def criar_localizacao(loc: schemas.LocalizacaoCreate, db: Session = Depends(get_db)):
    """Cria endereço no galpão (ex: Rua A, Prateleira 3, Nível 2)"""
    return crud.criar_localizacao(db, loc)

@app.get("/localizacoes/", tags=["Localização"])
def listar_localizacoes(db: Session = Depends(get_db)):
    return crud.listar_localizacoes(db)

@app.put("/localizacoes/{produto_id}/alocar", tags=["Localização"])
def alocar_produto(produto_id: int, localizacao_id: int, db: Session = Depends(get_db)):
    """Aloca produto a uma posição física no galpão"""
    return crud.alocar_produto(db, produto_id, localizacao_id)

# ══════════════════════════════════════════════════════════════
# DASHBOARD / KPIs
# ══════════════════════════════════════════════════════════════

@app.get("/dashboard/", tags=["Dashboard"])
def dashboard(db: Session = Depends(get_db)):
    """Dados consolidados para o painel principal"""
    return crud.get_dashboard_data(db)

# ══════════════════════════════════════════════════════════════
# IA ASSISTANT
# ══════════════════════════════════════════════════════════════

@app.post("/ia/consulta", tags=["IA"])
async def consultar_ia(pergunta: schemas.PerguntaIA, db: Session = Depends(get_db)):
    """
    Assistente IA para consultas logísticas.
    Usa Claude API (Anthropic) com contexto real do banco.
    """
    # Busca contexto atual do estoque para a IA
    contexto = crud.get_contexto_ia(db)
    resposta = await ai.consultar(pergunta.pergunta, contexto)
    return {"resposta": resposta, "pergunta": pergunta.pergunta}

@app.post("/ia/sugerir-reposicao", tags=["IA"])
async def sugerir_reposicao(db: Session = Depends(get_db)):
    """IA analisa estoque e sugere ordens de reposição"""
    estoque = crud.listar_estoque(db)
    contexto = crud.get_contexto_ia(db)
    sugestoes = await ai.sugerir_reposicao(estoque, contexto)
    return {"sugestoes": sugestoes}
