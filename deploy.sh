#!/bin/bash
# ── Deploy GLM no EC2 Rovieso ─────────────────────────────────
# Execute: bash deploy.sh

set -e  # Para em caso de erro

echo "🚀 GLM Deploy - EC2 Rovieso"
echo "══════════════════════════════"

# ── 1. Atualiza repositório ───────────────────────────────────
echo "📥 Atualizando código..."
git pull origin main 2>/dev/null || echo "  (sem git, usando arquivos locais)"

# ── 2. Configura .env ─────────────────────────────────────────
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "⚠️  Arquivo .env criado. Edite com sua ANTHROPIC_API_KEY:"
    echo "    nano backend/.env"
fi

# ── 3. Opção A: Docker Compose (recomendado) ──────────────────
if command -v docker &> /dev/null; then
    echo "🐳 Subindo com Docker Compose..."
    
    # Carrega variáveis do .env
    export $(cat backend/.env | grep -v '#' | xargs)
    
    docker compose down 2>/dev/null || true
    docker compose build --no-cache
    docker compose up -d
    
    echo "✅ Containers rodando!"
    docker compose ps
    
else
    # ── 3B. Sem Docker: PM2 + venv ───────────────────────────
    echo "⚡ Docker não encontrado — usando PM2 direto..."
    
    # Backend
    echo "  [1/3] Configurando backend Python..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt --quiet
    python seed.py
    
    # Inicia backend com PM2
    pm2 delete glm-backend 2>/dev/null || true
    pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" \
        --name glm-backend \
        --interpreter venv/bin/python
    cd ..
    
    # Frontend
    echo "  [2/3] Build do frontend..."
    cd frontend
    npm install --silent
    VITE_API_URL="http://$(curl -s ifconfig.me):8000" npm run build
    
    # Serve com PM2 serve ou copia para /var/www
    pm2 delete glm-frontend 2>/dev/null || true
    pm2 serve dist 3000 --name glm-frontend --spa
    cd ..
    
    # Salva PM2 para reiniciar no boot
    pm2 save
    pm2 startup 2>/dev/null || true
    
    echo "  [3/3] Configurando Nginx..."
fi

# ── 4. Nginx ──────────────────────────────────────────────────
if command -v nginx &> /dev/null; then
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
    sed "s/guiorobson.mooo.com/$PUBLIC_IP/g" nginx.conf > /tmp/glm_nginx.conf
    
    sudo cp /tmp/glm_nginx.conf /etc/nginx/sites-available/glm
    sudo ln -sf /etc/nginx/sites-available/glm /etc/nginx/sites-enabled/glm
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx configurado!"
fi

# ── 5. Resumo ─────────────────────────────────────────────────
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
echo ""
echo "══════════════════════════════════════"
echo "🎉 GLM ONLINE!"
echo "══════════════════════════════════════"
echo "  Frontend:  http://$PUBLIC_IP"
echo "  API:       http://$PUBLIC_IP:8000"
echo "  API Docs:  http://$PUBLIC_IP:8000/docs"
echo "  Health:    http://$PUBLIC_IP:8000/health"
echo ""
echo "📱 No celular: acesse http://$PUBLIC_IP pelo navegador"
echo "   e adicione à tela inicial (PWA)"
echo ""
echo "🤖 ARIA (IA): configure ANTHROPIC_API_KEY no .env"
echo "══════════════════════════════════════"
