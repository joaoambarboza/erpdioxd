#!/bin/sh
set -e

echo "Aplicando migrações do banco de dados..."
npx prisma migrate deploy

echo "Iniciando a aplicação..."
exec npm start
