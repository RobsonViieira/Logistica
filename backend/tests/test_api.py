# ── Testes básicos da API ─────────────────────────────────────

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.database import get_db, Base

# Banco de testes em memória
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

# ── Testes ────────────────────────────────────────────────────

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_criar_produto():
    response = client.post("/produtos/", json={
        "codigo": "TEST001",
        "nome": "Produto de Teste",
        "unidade": "UN",
        "estoque_minimo": 10
    })
    assert response.status_code == 200
    data = response.json()
    assert data["codigo"] == "TEST001"
    assert data["id"] is not None

def test_produto_duplicado():
    client.post("/produtos/", json={"codigo": "DUP001", "nome": "Produto Duplicado", "unidade": "UN"})
    response = client.post("/produtos/", json={"codigo": "DUP001", "nome": "Produto Duplicado 2", "unidade": "UN"})
    assert response.status_code == 400

def test_buscar_produto_por_codigo():
    client.post("/produtos/", json={"codigo": "FIND001", "nome": "Produto Busca", "unidade": "KG"})
    response = client.get("/produtos/FIND001")
    assert response.status_code == 200
    assert response.json()["nome"] == "Produto Busca"

def test_produto_nao_encontrado():
    response = client.get("/produtos/INEXISTENTE")
    assert response.status_code == 404

def test_criar_movimentacao_entrada():
    # Cria produto primeiro
    p = client.post("/produtos/", json={"codigo": "MOV001", "nome": "Produto Mov", "unidade": "UN"}).json()
    response = client.post("/movimentacoes/", json={
        "produto_id": p["id"],
        "tipo": "entrada",
        "quantidade": 50,
        "operador": "teste"
    })
    assert response.status_code == 200

def test_saida_sem_estoque():
    p = client.post("/produtos/", json={"codigo": "SEMEST001", "nome": "Sem Estoque", "unidade": "UN"}).json()
    response = client.post("/movimentacoes/", json={
        "produto_id": p["id"],
        "tipo": "saida",
        "quantidade": 10,
    })
    assert response.status_code == 400  # Deve barrar saída sem estoque

def test_dashboard():
    response = client.get("/dashboard/")
    assert response.status_code == 200
    data = response.json()
    assert "total_produtos" in data
    assert "alertas_estoque" in data

def test_criar_ordem():
    p = client.post("/produtos/", json={"codigo": "OS001", "nome": "Produto OS", "unidade": "UN"}).json()
    response = client.post("/ordens/", json={
        "tipo": "separacao",
        "prioridade": "normal",
        "itens": [{"produto_id": p["id"], "quantidade_solicitada": 5}]
    })
    assert response.status_code == 200
    assert response.json()["status"] == "pendente"

def test_listar_estoque():
    response = client.get("/estoque/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
