#!/usr/bin/env python3
"""
Script para popular o banco com dados de demonstração.
Execute: python seed.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app import models, crud, schemas

# Cria todas as tabelas
models.Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    print("🌱 Populando banco com dados de demonstração...")

    # ── Produtos ─────────────────────────────────────────────
    produtos_demo = [
        {"codigo": "CAB001", "nome": "Cabo Elétrico 1.5mm", "unidade": "M", "estoque_minimo": 100, "categoria": "Elétrico", "fornecedor": "WEG"},
        {"codigo": "CAB002", "nome": "Cabo Elétrico 2.5mm", "unidade": "M", "estoque_minimo": 80, "categoria": "Elétrico", "fornecedor": "WEG"},
        {"codigo": "CON001", "nome": "Conector RJ45", "unidade": "UN", "estoque_minimo": 50, "categoria": "Rede", "fornecedor": "Furukawa"},
        {"codigo": "PAR001", "nome": "Parafuso M6x20", "unidade": "CX", "estoque_minimo": 10, "categoria": "Fixação", "fornecedor": "Ciser"},
        {"codigo": "PAR002", "nome": "Parafuso M8x30", "unidade": "CX", "estoque_minimo": 10, "categoria": "Fixação", "fornecedor": "Ciser"},
        {"codigo": "OLE001", "nome": "Óleo Lubrificante ISO 46", "unidade": "L", "estoque_minimo": 20, "categoria": "Manutenção", "fornecedor": "Mobil"},
        {"codigo": "EPI001", "nome": "Luva Nitrílica M", "unidade": "PAR", "estoque_minimo": 30, "categoria": "EPI", "fornecedor": "Danny"},
        {"codigo": "EPI002", "nome": "Óculos de Segurança", "unidade": "UN", "estoque_minimo": 15, "categoria": "EPI", "fornecedor": "3M"},
        {"codigo": "ROL001", "nome": "Rolamento 6205", "unidade": "UN", "estoque_minimo": 5, "categoria": "Mecânico", "fornecedor": "SKF"},
        {"codigo": "VED001", "nome": "Veda Rosca PTFE 25m", "unidade": "RL", "estoque_minimo": 20, "categoria": "Hidráulico", "fornecedor": "Coflex"},
        {"codigo": "FUS001", "nome": "Fusível 16A", "unidade": "UN", "estoque_minimo": 25, "categoria": "Elétrico", "fornecedor": "Schneider"},
        {"codigo": "COR001", "nome": "Correia V A42", "unidade": "UN", "estoque_minimo": 3, "categoria": "Mecânico", "fornecedor": "Gates"},
    ]

    criados = []
    for p_data in produtos_demo:
        existente = crud.buscar_produto_por_codigo(db, p_data["codigo"])
        if not existente:
            produto = crud.criar_produto(db, schemas.ProdutoCreate(**p_data))
            criados.append(produto)
            print(f"  ✓ Produto: {produto.codigo} - {produto.nome}")
        else:
            criados.append(existente)

    # ── Estoque inicial ───────────────────────────────────────
    estoques_iniciais = [
        (criados[0].id, 250),  # Cabo 1.5mm: 250m (ok)
        (criados[1].id, 60),   # Cabo 2.5mm: 60m (ok)
        (criados[2].id, 15),   # Conector RJ45: 15 (ABAIXO do mínimo 50!)
        (criados[3].id, 25),   # Parafuso M6: 25 cx (ok)
        (criados[4].id, 8),    # Parafuso M8: 8 cx (ok)
        (criados[5].id, 5),    # Óleo: 5L (ABAIXO do mínimo 20!)
        (criados[6].id, 12),   # Luva: 12 pares (ABAIXO do mínimo 30!)
        (criados[7].id, 20),   # Óculos: 20 un (ok)
        (criados[8].id, 2),    # Rolamento: 2 un (ABAIXO do mínimo 5!)
        (criados[9].id, 45),   # Veda Rosca: 45 rl (ok)
        (criados[10].id, 30),  # Fusível: 30 un (ok)
        (criados[11].id, 1),   # Correia: 1 un (ABAIXO do mínimo 3!)
    ]

    for produto_id, quantidade in estoques_iniciais:
        crud.ajustar_estoque(db, schemas.AjusteEstoque(
            produto_id=produto_id,
            quantidade=quantidade,
            motivo="Estoque inicial (seed)",
            operador="sistema"
        ))

    # ── Localizações no galpão ────────────────────────────────
    localizacoes = [
        {"rua": "A", "prateleira": "1", "nivel": "1", "produto_id": criados[0].id},
        {"rua": "A", "prateleira": "1", "nivel": "2", "produto_id": criados[1].id},
        {"rua": "A", "prateleira": "2", "nivel": "1", "produto_id": criados[2].id},
        {"rua": "B", "prateleira": "1", "nivel": "1", "produto_id": criados[3].id},
        {"rua": "B", "prateleira": "1", "nivel": "2", "produto_id": criados[4].id},
        {"rua": "B", "prateleira": "2", "nivel": "1", "produto_id": criados[5].id},
        {"rua": "C", "prateleira": "1", "nivel": "1", "produto_id": criados[6].id},
        {"rua": "C", "prateleira": "1", "nivel": "2", "produto_id": criados[7].id},
    ]

    for loc_data in localizacoes:
        crud.criar_localizacao(db, schemas.LocalizacaoCreate(**loc_data))

    # ── Ordens de serviço demo ────────────────────────────────
    crud.criar_ordem(db, schemas.OrdemServicoCreate(
        tipo="separacao",
        prioridade="alta",
        cliente_fornecedor="Linha de Produção A",
        observacao="Separação urgente para manutenção preventiva",
        operador="joao.silva",
        itens=[
            schemas.ItemOrdemCreate(produto_id=criados[8].id, quantidade_solicitada=2),
            schemas.ItemOrdemCreate(produto_id=criados[11].id, quantidade_solicitada=1),
        ]
    ))

    crud.criar_ordem(db, schemas.OrdemServicoCreate(
        tipo="recebimento",
        prioridade="normal",
        cliente_fornecedor="WEG Equipamentos",
        observacao="NF 12345 - Recebimento de cabos",
        operador="maria.santos",
        itens=[
            schemas.ItemOrdemCreate(produto_id=criados[0].id, quantidade_solicitada=500),
            schemas.ItemOrdemCreate(produto_id=criados[1].id, quantidade_solicitada=300),
        ]
    ))

    db.close()
    print("\n✅ Seed concluído! Banco populado com dados de demonstração.")
    print("   5 itens estão ABAIXO do estoque mínimo — verifique os alertas no dashboard.")

if __name__ == "__main__":
    seed()
