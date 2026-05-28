# Conecta Pan

Chat online em tempo real com tema de padaria, no estilo WhatsApp. Web e mobile (responsivo), com salas globais, grupos e conversas privadas (DMs).

- **Frontend:** React + Vite, `lucide-react` (icones), Socket.IO client. Deploy no **Vercel**.
- **Backend:** Node + Express + Socket.IO. Deploy no **Render**.
- **Banco:** Supabase (PostgreSQL) para persistir perfis, salas e mensagens.

## Estrutura

```
conecta-pan/
├─ client/                 # React + Vite (frontend)
│  └─ src/
│     ├─ components/        # chat, layout, profile, ui
│     ├─ context/           # AuthContext, ChatContext
│     ├─ hooks/  lib/  pages/  styles/
├─ server/                 # Node + Express + Socket.IO (backend)
│  └─ src/
│     ├─ config/  services/  socket/
├─ supabase/
│  └─ schema.sql           # rode no SQL Editor do Supabase
```

## Funcionalidades

- Login leve por `@usuario` (sem senha, ideal para MVP/demo)
- Sala global, grupos e DMs 1-a-1
- Mensagens em tempo real (Socket.IO) e persistidas (Supabase)
- Indicador de "digitando..." animado
- Presenca online/offline em tempo real
- Secao de perfil editavel (nome, recado, cor do avatar)
- Layout responsivo (desliza entre lista e conversa no celular)

## Como rodar localmente

### 1. Supabase
1. Crie um projeto em https://supabase.com
2. Em **SQL Editor**, cole e rode o conteudo de `supabase/schema.sql`
3. Em **Settings > API**, copie a `Project URL` e a `service_role key`

### 2. Backend
```bash
cd server
cp .env.example .env      # preencha SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CLIENT_ORIGIN
npm install
npm run dev               # sobe em http://localhost:3001
```

### 3. Frontend
```bash
cd client
cp .env.example .env      # VITE_SERVER_URL=http://localhost:3001
npm install
npm run dev               # abre em http://localhost:5173
```

Abra duas abas (ou o celular na mesma rede via IP) com usuarios diferentes para testar o chat ao vivo.

## Deploy gratuito

### Backend no Render
1. Suba o repo no GitHub
2. Render > **New > Blueprint** apontando para o repo (usa `server/render.yaml`)
3. Defina as variaveis: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_ORIGIN` (a URL do front no Vercel)

> Obs: o plano free do Render hiberna apos inatividade; a primeira conexao pode demorar alguns segundos.

### Frontend no Vercel
1. Vercel > **Add New > Project**, selecione a pasta `client` como root
2. Variavel de ambiente: `VITE_SERVER_URL` = URL publica do backend no Render
3. Deploy

## Notas de seguranca
O login e propositalmente simples (sem senha) para um MVP de sala de aula. A `service_role key` do Supabase fica **apenas no backend**. Para producao, troque por Supabase Auth e habilite policies de RLS adequadas.
