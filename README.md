# 📦 GLM — Gerenciador de Logística Modular

> Sistema de logística industrial com IA integrada. Substitui scanners de código de barras caros por **qualquer celular** como coletor. Compatível com Android básico, iOS e web.

---

## 🎯 O que é o GLM?

Sistema completo de almoxarifado/logística industrial que roda no navegador do celular, funciona como PWA (Progressive Web App — instala como app sem loja), e usa IA (Claude/Anthropic) para auxiliar nas decisões de reposição e consultas.

**Substitui**: SAP WM, sistemas legados de 10+ anos, coletores de dados caros.  
**Usa**: Celular barato como coletor (câmera + QR nativo do Android/iOS).

---

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.11 + FastAPI |
| Banco | SQLite (demo) → MySQL (produção) |
| Frontend | React 18 + Tailwind CSS (PWA) |
| IA | Anthropic Claude Haiku (barato) + fallback heurístico |
| Deploy | Docker + Nginx ou PM2 direto no EC2 |

---

## 📁 Estrutura

```
glm/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes
│   │   ├── database.py      # Configuração SQLAlchemy
│   │   ├── models.py        # Tabelas (Produto, Estoque, Movimentação...)
│   │   ├── schemas.py       # Validação Pydantic
│   │   ├── crud.py          # Operações de banco
│   │   └── ai_assistant.py  # ARIA - IA via Anthropic
│   ├── seed.py              # Dados de demonstração
│   ├── tests/test_api.py    # Testes pytest
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # App React completo (PWA)
│   │   └── main.jsx
│   ├── public/manifest.json # Config PWA
│   ├── package.json
│   └── Dockerfile
├── nginx.conf               # Reverse proxy para EC2
├── docker-compose.yml
├── deploy.sh                # Script de deploy automatizado
└── README.md
```

---

## 🚀 Deploy Rápido

### Opção 1: Docker (recomendado)

```bash
# Clone ou copie os arquivos para o EC2
cd glm

# Configure a IA (opcional — sem chave funciona em modo demo)
cp backend/.env.example backend/.env
nano backend/.env   # adicione sua ANTHROPIC_API_KEY

# Sobe tudo
docker compose up -d

# Acesse:
# Frontend: http://SEU-IP:3000
# API Docs: http://SEU-IP:8000/docs
```

### Opção 2: PM2 direto no EC2 Rovieso

```bash
chmod +x deploy.sh
bash deploy.sh
```

### Opção 3: Desenvolvimento local

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed.py             # Popula dados demo
uvicorn app.main:app --reload --port 8000

# Frontend (outro terminal)
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
# Acesse: http://localhost:3000
```

---

## 📱 Como usar como coletor no celular

1. Abra o browser do celular e acesse `http://IP-DO-EC2`
2. Toque em **"Adicionar à tela inicial"** (instala como PWA)
3. Abra o app GLM → aba **📱 Coletor**
4. Selecione **Entrada** ou **Saída**
5. No Android: use o leitor QR nativo (swipe down → câmera → QR) e cole o código
6. Digite a quantidade e confirme

---

## 🤖 IA (ARIA — Assistente de Inteligência em Almoxarifado)

A ARIA usa o **Claude Haiku** (modelo mais barato da Anthropic — ~$0.001 por consulta).

**Sem ANTHROPIC_API_KEY**: sistema usa respostas heurísticas (modo demo, funciona offline).

**Com ANTHROPIC_API_KEY**:
- Consultas em linguagem natural ("Quais itens precisam de reposição?")
- Análise automática do estoque com sugestões de compra
- Contexto real do banco de dados em tempo real

Configure em `backend/.env`:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📋 Funcionalidades

| Módulo | Funcionalidade |
|--------|---------------|
| Dashboard | KPIs, alertas de estoque mínimo, últimas movimentações |
| Coletor | Registro de entrada/saída via celular (busca por código) |
| Estoque | Posição em tempo real, filtro por alertas, localização no galpão |
| Ordens | Criação e gestão de OS (separação, expedição, recebimento) |
| ARIA | Chat com IA sobre o estoque, sugestão de reposição |
| Cadastro | Cadastro de novos produtos |

---

## 🔌 API Endpoints

Acesse a documentação interativa em: `http://SEU-IP:8000/docs`

```
GET    /health                    # Status
GET    /dashboard/                # KPIs
POST   /produtos/                 # Criar produto
GET    /produtos/{codigo}         # Buscar por código (coletor)
GET    /estoque/                  # Posição estoque
GET    /estoque/alertas           # Itens críticos
POST   /movimentacoes/            # Registrar entrada/saída
GET    /movimentacoes/            # Histórico
POST   /ordens/                   # Criar ordem
PATCH  /ordens/{id}/status        # Atualizar status OS
POST   /ia/consulta               # Chat com ARIA
POST   /ia/sugerir-reposicao      # Análise IA de reposição
```

---

## 🧪 Testes

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

---

## 🔒 Segurança (produção)

```bash
# HTTPS com Certbot (gratuito)
sudo certbot --nginx -d guiorobson.mooo.com

# Descomente o bloco HTTPS no nginx.conf
# Configure DATABASE_URL para MySQL em produção
# Adicione autenticação JWT (próxima versão)
```

---

## 🗺️ Roadmap

- [ ] Autenticação JWT por operador
- [ ] Geração de QR Codes para produtos
- [ ] Relatórios PDF (entradas/saídas por período)
- [ ] Notificações push (alertas de estoque)
- [ ] Integração MySQL para produção
- [ ] Módulo de fornecedores e cotações
- [ ] Câmera integrada no coletor (leitor QR nativo)

---

**Desenvolvido por Robson · GLM v1.0 · 2026**
