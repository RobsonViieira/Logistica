# ── Assistente de IA via Anthropic Claude API ────────────────
# Usa claude-haiku (mais barato) para consultas logísticas

import os
import logging
import httpx
from typing import List
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("GLM.AI")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"

SYSTEM_PROMPT = """Você é ARIA (Assistente de Inteligência em Almoxarifado), 
especialista em logística industrial. Você ajuda operadores de almoxarifado 
e galpão com consultas sobre estoque, movimentações, ordens de serviço e 
reposição de materiais.

Responda sempre em português brasileiro, de forma clara e objetiva.
Seja direto e prático — os usuários são operadores que precisam de respostas rápidas.
Se não tiver dados suficientes, peça mais informações."""


class AIAssistant:
    """Wrapper para a API Anthropic com fallback inteligente"""

    def __init__(self):
        self.enabled = bool(ANTHROPIC_API_KEY)
        if not self.enabled:
            logger.warning("ANTHROPIC_API_KEY não configurada — IA em modo fallback")

    async def _chamar_api(self, mensagens: list, max_tokens: int = 500) -> str:
        """Faz chamada à API Anthropic"""
        if not self.enabled:
            return self._fallback_resposta(mensagens[-1]["content"])
        
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    ANTHROPIC_URL,
                    headers={
                        "x-api-key": ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-haiku-4-5-20251001",  # Mais barato e rápido
                        "max_tokens": max_tokens,
                        "system": SYSTEM_PROMPT,
                        "messages": mensagens
                    }
                )
                data = response.json()
                if response.status_code == 200:
                    return data["content"][0]["text"]
                else:
                    logger.error(f"Erro API Anthropic: {data}")
                    return self._fallback_resposta(mensagens[-1]["content"])
        except Exception as e:
            logger.error(f"Falha na chamada IA: {e}")
            return self._fallback_resposta(mensagens[-1]["content"])

    def _fallback_resposta(self, pergunta: str) -> str:
        """
        Respostas heurísticas quando a API não está disponível.
        Garante que o demo funcione mesmo sem chave de API.
        """
        pergunta_lower = pergunta.lower()
        
        if any(p in pergunta_lower for p in ["repor", "reposi", "pedir", "comprar"]):
            return (
                "🔄 **Sugestão de Reposição**: Com base nos alertas de estoque, "
                "recomendo verificar os itens marcados com ⚠️ no painel. "
                "Itens abaixo do mínimo devem ser solicitados com antecedência mínima de 3 dias úteis. "
                "Configure o ANTHROPIC_API_KEY para análises mais detalhadas com IA."
            )
        elif any(p in pergunta_lower for p in ["onde", "localiz", "endereç", "prateleira"]):
            return (
                "📍 **Localização**: Consulte o mapa de endereçamento do galpão. "
                "Cada produto tem um endereço no formato R(Rua)-P(Prateleira)-N(Nível). "
                "Use o campo de busca para localizar rapidamente pelo código do produto."
            )
        elif any(p in pergunta_lower for p in ["entrada", "receb", "chegou"]):
            return (
                "📥 **Recebimento**: Para registrar uma entrada, acesse Movimentações > Nova Entrada. "
                "Escaneie o QR Code do produto com a câmera do celular ou digite o código manualmente."
            )
        elif any(p in pergunta_lower for p in ["saída", "saida", "expedir", "separar"]):
            return (
                "📤 **Expedição/Separação**: Para registrar uma saída, acesse Movimentações > Nova Saída. "
                "Certifique-se de ter estoque disponível antes de confirmar."
            )
        else:
            return (
                "🤖 **ARIA (Modo Demo)**: Estou operando sem conexão com IA avançada. "
                "Posso ajudar com: reposição de estoque, localização de produtos, "
                "registros de entrada/saída e consulta de ordens. "
                "Configure a ANTHROPIC_API_KEY para respostas inteligentes completas."
            )

    async def consultar(self, pergunta: str, contexto: str) -> str:
        """Responde perguntas sobre o estoque com contexto real"""
        mensagem_completa = f"{contexto}\n\nPergunta do operador: {pergunta}"
        return await self._chamar_api([
            {"role": "user", "content": mensagem_completa}
        ])

    async def sugerir_reposicao(self, estoque: List[dict], contexto: str) -> str:
        """Analisa estoque e sugere ordens de reposição"""
        prompt = f"""
{contexto}

Analise o estoque acima e:
1. Liste os itens que precisam de reposição URGENTE (abaixo de 20% do mínimo)
2. Liste os itens que precisam de reposição nos próximos 7 dias
3. Sugira quantidades a pedir baseado no histórico (estimativa conservadora)
4. Priorize os itens por criticidade para a operação

Responda de forma estruturada e objetiva.
"""
        return await self._chamar_api([
            {"role": "user", "content": prompt}
        ], max_tokens=800)
