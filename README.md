<div align="center">

[![Demo](https://img.shields.io/badge/🌐_Demo-GitHub_Pages-orange)](https://robsonviieira.github.io/Logistica/) [![Releases](https://img.shields.io/github/v/release/RobsonViieira/Logistica)](https://github.com/RobsonViieira/Logistica/releases)

# 📦 SLR — Software de Logística Rovie

### *O almoxarifado do futuro, no celular que você já tem*

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)](https://docker.com)
[![License](https://img.shields.io/badge/Licença-MIT-green)](LICENSE)

[🇧🇷 Português](#-português) · [🇺🇸 English](#-english) · [🇪🇸 Español](#-español)

![SLR Demo](https://via.placeholder.com/800x400/1d4ed8/ffffff?text=SLR+%E2%80%94+Software+de+Log%C3%ADstica+Rovie+v2.0)

</div>

---

## 🇧🇷 Português

### O que é o SLR?

Imagine que você trabalha num galpão cheio de peças, cabos, ferramentas e equipamentos. Antes, você precisava de um aparelho caro (chamado "coletor de dados") para registrar o que entrava e saía. Com o SLR, **qualquer celular vira um coletor** — até aquele mais simples na gaveta!

É como ter um **assistente superesperto** que:
- 📱 Deixa você escanear produtos com a câmera do celular
- 📊 Mostra em tempo real o que tem (e o que está acabando) no estoque
- 🤖 Usa Inteligência Artificial (ARIA) para te avisar o que precisa ser reposto
- 🏷️ Gera etiquetas com QR Code para colar nas prateleiras
- 👷 Sabe quem fez cada movimentação (login com PIN)

### ✨ Funcionalidades

| O que faz | Como funciona |
|-----------|---------------|
| 📱 **Coletor no celular** | Abre no navegador, escaneia QR com a câmera, registra entrada/saída |
| 🔐 **Login com PIN** | Cada operador tem um PIN de 4 dígitos. Toda movimentação fica rastreada |
| 📷 **Leitor QR nativo** | Usa a câmera do próprio celular — sem app extra para instalar |
| 🏷️ **Gera etiquetas** | Cria etiqueta com QR Code para imprimir e colar na prateleira |
| 📊 **Gráficos em tempo real** | Mostra entradas vs saídas dos últimos 7 dias |
| 🤖 **IA (ARIA)** | Analisa o estoque e sugere o que pedir, quando pedir e quanto |
| 📋 **Ordens de Serviço** | Cria e acompanha separações, recebimentos e expedições |
| ⚠️ **Alertas automáticos** | Avisa quando algum produto está abaixo do mínimo |

### 🚀 Como instalar (jeito fácil com Docker)

```bash
# 1. Baixe o projeto
git clone https://github.com/RobsonViieira/Logistica.git
cd Logistica

# 2. Configure suas chaves (opcional — funciona sem)
cp backend/.env.example backend/.env
# Edite o .env e coloque sua ANTHROPIC_API_KEY se tiver

# 3. Suba tudo com um comando
docker compose up -d

# 4. Acesse no navegador
# 🌐 Frontend: http://localhost:3000
# 📖 API Docs: http://localhost:8000/docs
```

### 📱 Como usar no celular

1. Conecte o celular na mesma rede Wi-Fi do servidor
2. Abra o navegador e acesse `http://IP-DO-SERVIDOR:3000`
3. No Android: toque em **"Adicionar à tela inicial"** — vira um app!
4. Escolha seu nome → digite o PIN → comece a usar

> 💡 **PINs de demonstração:** João P. = `1234` · Maria S. = `5678` · Carlos M. = `9012`

### 🏗️ Estrutura do projeto

```
SLR/
├── backend/           ← Servidor Python (FastAPI)
│   ├── app/
│   │   ├── main.py        ← Rotas da API
│   │   ├── models.py      ← Estrutura do banco
│   │   ├── crud.py        ← Operações de dados
│   │   └── ai_assistant.py ← ARIA (Inteligência Artificial)
│   └── seed.py        ← Dados de demonstração
├── frontend/          ← Interface React (o que aparece na tela)
│   └── src/App.jsx    ← Todo o visual do app
├── docker-compose.yml ← Sobe tudo com um comando
├── nginx.conf         ← Configuração do servidor web
└── deploy.sh          ← Script de deploy automático
```

### 🤖 Sobre a ARIA

A ARIA (Assistente de Inteligência em Almoxarifado) é a IA do sistema. Ela:
- Lê o estoque em tempo real
- Analisa quais produtos estão acabando
- Sugere quantidades para repor
- Responde suas perguntas em linguagem natural

Usa o **Claude Haiku** (Anthropic) — um dos modelos mais rápidos e baratos do mundo (~R$0,005 por consulta). Sem chave de API, funciona no modo demonstração com respostas automáticas.

---

## 🇺🇸 English

### What is SLR?

Imagine you work in a warehouse full of parts, cables, tools and equipment. Before, you needed an expensive device (called a "data collector") to track what came in and went out. With SLR, **any smartphone becomes a collector** — even the simplest one in your drawer!

It's like having a **super-smart assistant** that:
- 📱 Lets you scan products with your phone's camera
- 📊 Shows in real-time what's in stock (and what's running low)
- 🤖 Uses AI (ARIA) to alert you what needs to be restocked
- 🏷️ Generates QR Code labels to print and stick on shelves
- 👷 Tracks who did each operation (PIN login)

### ✨ Features

| Feature | How it works |
|---------|--------------|
| 📱 **Mobile collector** | Opens in browser, scans QR with camera, records in/out |
| 🔐 **PIN login** | Each operator has a 4-digit PIN. Every move is tracked |
| 📷 **Native QR reader** | Uses the phone's own camera — no extra app needed |
| 🏷️ **Label generator** | Creates QR Code label to print and stick on shelf |
| 📊 **Real-time charts** | Shows entries vs exits for the last 7 days |
| 🤖 **AI (ARIA)** | Analyzes stock and suggests what to order, when and how much |
| 📋 **Work Orders** | Create and track picks, receipts and shipments |
| ⚠️ **Auto alerts** | Notifies when any product is below minimum stock |

### 🚀 Quick install (Docker)

```bash
git clone https://github.com/RobsonViieira/Logistica.git
cd Logistica
cp backend/.env.example backend/.env
docker compose up -d
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### 📱 Mobile usage

1. Connect your phone to the same Wi-Fi as the server
2. Open browser and go to `http://SERVER-IP:3000`
3. On Android: tap **"Add to home screen"** — it becomes an app!
4. Pick your name → enter PIN → start using

> 💡 **Demo PINs:** João P. = `1234` · Maria S. = `5678` · Carlos M. = `9012`

### 🛠️ Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Python 3.11 + FastAPI | Fast, modern, auto-generates API docs |
| Database | SQLite → MySQL | SQLite for demo, MySQL for production |
| Frontend | React 18 + Tailwind CSS | PWA that runs on any phone |
| AI | Anthropic Claude Haiku | Cheapest smart AI (~$0.001/query) |
| Deploy | Docker + Nginx | One command to launch everything |

### 🔌 API Endpoints

Full interactive docs at `http://localhost:8000/docs`

```
GET  /health                  # System status
GET  /dashboard/              # KPIs and summary
POST /produtos/               # Create product
GET  /produtos/{codigo}       # Find by code (used by mobile collector)
GET  /estoque/                # Current stock position
GET  /estoque/alertas         # Items below minimum
POST /movimentacoes/          # Record entry/exit
POST /ordens/                 # Create work order
POST /ia/consulta             # Chat with ARIA
POST /ia/sugerir-reposicao    # AI restock analysis
```

---

## 🇪🇸 Español

### ¿Qué es el SLR?

Imagina que trabajas en un almacén lleno de piezas, cables, herramientas y equipos. Antes, necesitabas un aparato caro (llamado "colector de datos") para registrar lo que entraba y salía. Con SLR, **cualquier celular se convierte en un colector** — ¡incluso el más sencillo que tengas!

Es como tener un **asistente superinteligente** que:
- 📱 Te permite escanear productos con la cámara del celular
- 📊 Muestra en tiempo real lo que hay en stock (y lo que se está agotando)
- 🤖 Usa Inteligencia Artificial (ARIA) para avisarte qué hay que reponer
- 🏷️ Genera etiquetas con código QR para imprimir y pegar en estanterías
- 👷 Sabe quién hizo cada movimiento (inicio de sesión con PIN)

### ✨ Funcionalidades

| ¿Qué hace? | ¿Cómo funciona? |
|-----------|-----------------|
| 📱 **Colector en el celular** | Se abre en el navegador, escanea QR con la cámara |
| 🔐 **Inicio de sesión con PIN** | Cada operador tiene un PIN de 4 dígitos |
| 📷 **Lector QR nativo** | Usa la cámara del propio teléfono — sin app extra |
| 🏷️ **Generador de etiquetas** | Crea etiquetas QR para imprimir y pegar |
| 📊 **Gráficos en tiempo real** | Muestra entradas vs salidas de los últimos 7 días |
| 🤖 **IA (ARIA)** | Analiza el stock y sugiere qué pedir, cuándo y cuánto |
| 📋 **Órdenes de trabajo** | Crea y hace seguimiento de separaciones y despachos |
| ⚠️ **Alertas automáticas** | Avisa cuando algún producto está bajo el mínimo |

### 🚀 Instalación rápida (Docker)

```bash
git clone https://github.com/RobsonViieira/Logistica.git
cd Logistica
cp backend/.env.example backend/.env
docker compose up -d
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### 📱 Uso en el celular

1. Conecta el celular a la misma red Wi-Fi del servidor
2. Abre el navegador y accede a `http://IP-DEL-SERVIDOR:3000`
3. En Android: toca **"Agregar a pantalla de inicio"** — ¡se convierte en app!
4. Elige tu nombre → ingresa el PIN → ¡empieza a usar!

> 💡 **PINs de demo:** João P. = `1234` · Maria S. = `5678` · Carlos M. = `9012`

### 🤖 Sobre ARIA

ARIA (Asistente de Inteligencia en Almacén) es la IA del sistema. Ella:
- Lee el inventario en tiempo real
- Analiza qué productos se están agotando
- Sugiere cantidades para reponer
- Responde tus preguntas en lenguaje natural

Usa **Claude Haiku** (Anthropic) — uno de los modelos más rápidos y económicos del mundo. Sin clave de API, funciona en modo demo con respuestas automáticas.

---

## 📄 Licença / License / Licencia

MIT © 2026 Robson Vieira — [RobsonViieira](https://github.com/RobsonViieira)

---

<div align="center">
Feito com ❤️ em Itatiba, SP — Brasil 🇧🇷
</div>
