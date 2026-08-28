# Deploy em produção (Hetzner + Docker)

Guia para colocar o sistema no ar numa VPS Hetzner (~US$5/mês), com Postgres,
armazenamento de anexos e HTTPS automático, tudo rodando na mesma máquina via
Docker Compose.

## 1. Criar a VPS

1. Crie uma conta em https://www.hetzner.com/cloud (isso exige cartão de
   pagamento seu — não posso fazer essa etapa por você).
2. Crie um servidor **CX22** (2 vCPU, 4GB RAM, 40GB NVMe), imagem **Ubuntu
   24.04**, na região mais próxima (ex: Nuremberg ou Ashburn, o que tiver
   menor latência para o Brasil).
3. Adicione sua chave SSH pública na criação do servidor (ou defina uma senha
   root, se preferir).
4. Anote o IP público do servidor.

## 2. Domínio (opcional)

Se já tem um domínio, crie um registro DNS tipo `A` apontando (ex:
`erp.dioxd.com.br`) para o IP da VPS.

Se ainda não tem domínio, pode usar `SEU-IP.nip.io` (troque os pontos do IP
por hífen não é necessário, é literal: `203.0.113.10.nip.io`) — o Caddy
consegue emitir certificado HTTPS válido automaticamente para esse endereço
também, sem custo.

## 3. Instalar Docker na VPS

Conecte via SSH (`ssh root@SEU-IP`) e rode:

```bash
curl -fsSL https://get.docker.com | sh
```

## 4. Levar o código para a VPS

**Opção recomendada — via GitHub** (facilita atualizar depois com `git pull`):

1. Suba este projeto para um repositório privado no GitHub.
2. Na VPS: `git clone <url-do-repo> dioxd-erp && cd dioxd-erp`

**Opção rápida — copiar direto do seu Mac** (sem precisar de GitHub agora):

```bash
rsync -av --exclude node_modules --exclude .next --exclude storage --exclude .git --exclude .env \
  "/Users/joaob/Desktop/ERP IA/" root@SEU-IP:/root/dioxd-erp/
```

> **Atenção:** o `--exclude .env` é essencial. Sem ele, esse comando
> sobrescreve o `.env` de produção na VPS com o `.env` local de
> desenvolvimento (senha do Postgres, `AUTH_SECRET` e `DOMAIN` errados),
> deixando os containers incapazes de reiniciar corretamente até o
> arquivo ser corrigido manualmente na VPS.

## 5. Configurar variáveis de ambiente

Na VPS, dentro da pasta do projeto:

```bash
cp .env.production.example .env
nano .env
```

Preencha:
- `POSTGRES_PASSWORD`: gere com `openssl rand -base64 24`
- `AUTH_SECRET`: gere com `openssl rand -base64 32`
- `DOMAIN`: seu domínio ou `SEU-IP.nip.io`

## 6. Subir os containers

```bash
docker compose up -d --build
```

Isso builda a imagem da aplicação, sobe o Postgres, aplica as migrações do
Prisma automaticamente (via `docker-entrypoint.sh`) e sobe o Caddy, que emite
o certificado HTTPS na primeira requisição.

Acompanhe os logs até tudo ficar saudável:

```bash
docker compose logs -f
```

## 7. Criar o usuário administrador

O banco sobe vazio (só com as tabelas). Rode uma vez para criar o login
inicial e uma conta bancária provisória (obrigatória para lançamentos — edite
o nome/banco/saldo real depois pela tela **Cadastros → Contas Bancárias**).
A senha é sempre passada na hora, nunca fica gravada em nenhum arquivo:

```bash
docker compose exec -e ADMIN_EMAIL=joaobarboza@dioxd.com -e ADMIN_PASSWORD='SUA_SENHA_AQUI' \
  app npx tsx prisma/seed-production.ts
```

`ADMIN_EMAIL` é opcional (usa `joaobarboza@dioxd.com` por padrão se
omitido); `ADMIN_PASSWORD` é obrigatório — o script recusa rodar sem ele.

## 8. Acessar

Abra `https://SEU_DOMINIO` no navegador e faça login com o admin criado no
passo 7. Ajuste a conta bancária real em **Cadastros → Contas Bancárias** e
crie o segundo usuário pela própria tela de **Usuários**.

## Atualizando depois de uma mudança no código

```bash
git pull            # se estiver usando a opção GitHub
docker compose up -d --build
```

As migrações do Prisma rodam automaticamente a cada subida do container
(`prisma migrate deploy` é seguro rodar repetidamente).

## Backup do banco

Com os dados rodando em disco da VPS (não em serviço gerenciado), vale
programar um backup periódico. O mais simples:

```bash
docker compose exec postgres pg_dump -U dioxd dioxd_erp > backup-$(date +%F).sql
```

Rode isso via `cron` e copie o arquivo para fora da VPS (ex: envie para um
bucket S3/R2 barato, ou baixe manualmente de vez em quando).
