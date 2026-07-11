# ── Modelos do banco de dados (tabelas) ──────────────────────

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Produto(Base):
    """Cadastro de produtos/SKUs"""
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, index=True, nullable=False)  # Código do QR
    nome = Column(String(200), nullable=False)
    descricao = Column(Text, nullable=True)
    unidade = Column(String(20), default="UN")  # UN, KG, M, CX, etc.
    estoque_minimo = Column(Float, default=0)
    categoria = Column(String(100), nullable=True)
    fornecedor = Column(String(200), nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    movimentacoes = relationship("Movimentacao", back_populates="produto")
    estoque = relationship("Estoque", back_populates="produto", uselist=False)
    localizacao = relationship("Localizacao", back_populates="produto", uselist=False)


class Estoque(Base):
    """Posição atual do estoque por produto"""
    __tablename__ = "estoque"

    id = Column(Integer, primary_key=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), unique=True)
    quantidade = Column(Float, default=0)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    produto = relationship("Produto", back_populates="estoque")


class Movimentacao(Base):
    """Log de todas as entradas e saídas"""
    __tablename__ = "movimentacoes"

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    tipo = Column(Enum("entrada", "saida", "ajuste", name="tipo_mov"), nullable=False)
    quantidade = Column(Float, nullable=False)
    referencia = Column(String(100), nullable=True)   # NF, OS, pedido, etc.
    operador = Column(String(100), nullable=True)      # Quem fez a movimentação
    observacao = Column(Text, nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    produto = relationship("Produto", back_populates="movimentacoes")


class OrdemServico(Base):
    """Ordens de separação, expedição ou recebimento"""
    __tablename__ = "ordens_servico"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(Enum("separacao", "expedicao", "recebimento", name="tipo_os"), nullable=False)
    status = Column(
        Enum("pendente", "em_andamento", "concluida", "cancelada", name="status_os"),
        default="pendente"
    )
    prioridade = Column(Enum("baixa", "normal", "alta", "urgente", name="prioridade_os"), default="normal")
    cliente_fornecedor = Column(String(200), nullable=True)
    observacao = Column(Text, nullable=True)
    operador = Column(String(100), nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
    concluido_em = Column(DateTime, nullable=True)

    itens = relationship("ItemOrdem", back_populates="ordem")


class ItemOrdem(Base):
    """Itens de uma ordem de serviço"""
    __tablename__ = "itens_ordem"

    id = Column(Integer, primary_key=True)
    ordem_id = Column(Integer, ForeignKey("ordens_servico.id"))
    produto_id = Column(Integer, ForeignKey("produtos.id"))
    quantidade_solicitada = Column(Float, nullable=False)
    quantidade_atendida = Column(Float, default=0)
    status = Column(String(50), default="pendente")

    ordem = relationship("OrdemServico", back_populates="itens")
    produto = relationship("Produto")


class Localizacao(Base):
    """Endereçamento físico do galpão (rua, prateleira, nível)"""
    __tablename__ = "localizacoes"

    id = Column(Integer, primary_key=True)
    rua = Column(String(10), nullable=False)
    prateleira = Column(String(10), nullable=False)
    nivel = Column(String(10), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=True)
    descricao = Column(String(200), nullable=True)

    produto = relationship("Produto", back_populates="localizacao")

    @property
    def endereco(self):
        return f"R{self.rua}-P{self.prateleira}-N{self.nivel}"
