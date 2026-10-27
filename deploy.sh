#!/usr/bin/env bash
# Atualiza o sistema em produção: envia o código desta pasta para a VPS e reconstrói os containers.
# Uso: ./deploy.sh
#
# Não mexe no .env de produção, nos anexos (storage) nem no banco de dados.
# As migrações do Prisma rodam sozinhas na subida do container.
set -euo pipefail

SERVER="root@135.181.80.30"
REMOTE_DIR="/root/dioxd-erp"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$LOCAL_DIR"

if [ -n "$(git status --porcelain)" ]; then
  echo "Atenção: há alterações não commitadas nesta pasta. Elas também serão enviadas ao servidor:"
  git status --short
  echo
fi

read -r -p "Enviar para PRODUÇÃO ($SERVER)? [s/N] " resposta
if [ "$resposta" != "s" ] && [ "$resposta" != "S" ]; then
  echo "Cancelado."
  exit 0
fi

rsync -av \
  --exclude node_modules --exclude .next --exclude storage --exclude .git --exclude .env \
  --exclude .DS_Store --exclude '*.tsbuildinfo' \
  "$LOCAL_DIR/" "$SERVER:$REMOTE_DIR/"

ssh "$SERVER" "cd $REMOTE_DIR && docker compose up -d --build && docker compose ps"

echo
echo "Pronto. Confira o site e, se quiser, os logs:"
echo "  ssh $SERVER \"cd $REMOTE_DIR && docker compose logs --tail 20 app\""
