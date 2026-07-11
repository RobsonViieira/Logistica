# ── Schemas Pydantic: validação de entrada e saída da API ────

from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ── Enums ─────────────────────────────────────────────────────
class TipoMovimentacao(str, Enum):
    entrada = "entrada"
    saida = "saida"
    ajuste = "ajuste"

class TipoOrdem(str, Enum):
    separacao = "separacao"
    expedicao = "expedicao"
    recebimento = "recebimento"

class StatusOrdem(str, Enum):
    pendente = "pendente"
    em_andamento = "em_andamento"
    concluida = "concluida"
    cancelada = "cancelada"

class PrioridadeOrdem(str, Enum):
    baixa = "baixa"
    normal = "normal"
    alta = "alta"
    urgente = "urgente"


# ══════════════════════════════════════════════════════════════
# PRODUTO
# ══════════════════════════════════════════════════════════════
class ProdutoBase(BaseModel):
    codigo: str
    nome: str
    descricao: Optional[str] = None
    unidade: str = "UN"
    estoque_minimo: float = 0
    categoria: Optional[str] = None
    fornecedor: Optional[str] = None

    @field_validator("codigo")
    @classmethod
    def codigo_nao_vazio(cls, v):
        if not v.strip():
            raise ValueError("Código não pode ser vazio")
        return v.strip().upper()

class ProdutoCreate(ProdutoBase):
    pass

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    unidade: Optional[str] = None
    estoque_minimo: Optional[float] = None
    categoria: Optional[str] = None
    fornecedor: Optional[str] = None

class Produto(ProdutoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None


# ══════════════════════════════════════════════════════════════
# ESTOQUE
# ══════════════════════════════════════════════════════════════
class EstoqueItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    produto_id: int
    produto_codigo: str
    produto_nome: str
    quantidade: float
    estoque_minimo: float
    unidade: str
    alerta: bool  # True se abaixo do mínimo
    localizacao: Optional[str] = None

class AjusteEstoque(BaseModel):
    produto_id: int
    quantidade: float
    motivo: str
    operador: Optional[str] = "sistema"


# ══════════════════════════════════════════════════════════════
# MOVIMENTAÇÃO
# ══════════════════════════════════════════════════════════════
class MovimentacaoCreate(BaseModel):
    produto_id: int
    tipo: TipoMovimentacao
    quantidade: float
    referencia: Optional[str] = None
    operador: Optional[str] = None
    observacao: Optional[str] = None

    @field_validator("quantidade")
    @classmethod
    def quantidade_positiva(cls, v):
        if v <= 0:
            raise ValueError("Quantidade deve ser maior que zero")
        return v

class Movimentacao(MovimentacaoCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    criado_em: datetime


# ══════════════════════════════════════════════════════════════
# ORDEM DE SERVIÇO
# ══════════════════════════════════════════════════════════════
class ItemOrdemCreate(BaseModel):
    produto_id: int
    quantidade_solicitada: float

class ItemOrdem(ItemOrdemCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    quantidade_atendida: float
    status: str

class OrdemServicoCreate(BaseModel):
    tipo: TipoOrdem
    prioridade: PrioridadeOrdem = PrioridadeOrdem.normal
    cliente_fornecedor: Optional[str] = None
    observacao: Optional[str] = None
    operador: Optional[str] = None
    itens: List[ItemOrdemCreate] = []

class OrdemServico(OrdemServicoCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: StatusOrdem
    criado_em: datetime
    concluido_em: Optional[datetime] = None
    itens: List[ItemOrdem] = []


# ══════════════════════════════════════════════════════════════
# LOCALIZAÇÃO
# ══════════════════════════════════════════════════════════════
class LocalizacaoCreate(BaseModel):
    rua: str
    prateleira: str
    nivel: str
    produto_id: Optional[int] = None
    descricao: Optional[str] = None


# ══════════════════════════════════════════════════════════════
# IA
# ══════════════════════════════════════════════════════════════
class PerguntaIA(BaseModel):
    pergunta: str

    @field_validator("pergunta")
    @classmethod
    def pergunta_nao_vazia(cls, v):
        if not v.strip():
            raise ValueError("Pergunta não pode ser vazia")
        return v.strip()
