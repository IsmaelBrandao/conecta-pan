# Deploy do Conecta Pan (gratuito)

Arquitetura: **frontend no Vercel** + **backend no Render** + **banco/storage no Supabase**.

---

## 0. Pré-requisitos
- Conta no GitHub, Vercel, Render e Supabase (todas grátis)
- Repositório no GitHub com este projeto

```bash
cd C:/Users/ismae/conecta-pan
git init
git add .
git commit -m "Conecta Pan: chat realtime com Socket.IO + Supabase"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/conecta-pan.git
git push -u origin main
```

---

## 1. Supabase (banco + storage)
1. https://supabase.com → **New project** (guarde a senha do banco).
2. Menu **SQL Editor** → **New query** → cole TODO o conteúdo de `supabase/schema.sql` → **Run**.
   - Isso cria tabelas, a sala global e o bucket público `chat-images`.
3. Menu **Settings → API**, anote:
   - `Project URL`  → vai em `SUPABASE_URL`
   - `service_role` (em *Project API keys*, revele o secret) → vai em `SUPABASE_SERVICE_ROLE_KEY`

> A `service_role` key é secreta e fica **só no backend**. Nunca coloque no frontend.

---

## 2. Backend no Render
1. https://render.com → **New → Web Service** → conecte o repo do GitHub.
2. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
   - **Instance Type:** Free
3. Em **Environment**, adicione as variáveis:
   - `SUPABASE_URL` = (URL do Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` = (service_role key)
   - `CLIENT_ORIGIN` = (deixe `http://localhost:5173` por enquanto; ajuste no passo 4)
4. **Create Web Service**. Quando subir, copie a URL pública (ex: `https://conecta-pan.onrender.com`).

> Alternativa: o arquivo `server/render.yaml` já está pronto — dá pra usar **New → Blueprint** apontando para o repo.
>
> Atenção: no plano Free o serviço hiberna após ~15 min sem uso; a primeira conexão depois disso leva alguns segundos para "acordar".

---

## 3. Frontend no Vercel
1. https://vercel.com → **Add New → Project** → importe o repo do GitHub.
2. Na tela de configuração:
   - **Root Directory:** clique em *Edit* e selecione **`client`** (importante — o `vercel.json` está dentro dessa pasta)
   - **Framework Preset:** Vite (detecta sozinho)
   - **Build Command / Output Directory / Install Command:** deixe automático (o `client/vercel.json` já define).
3. Em **Environment Variables**, adicione:
   - `VITE_SERVER_URL` = URL pública do backend no Render (ex: `https://conecta-pan.onrender.com`)
4. Clique **Deploy**. Copie a URL final (ex: `https://conecta-pan.vercel.app`).

> Cada `git push` para a `main` dispara redeploy automático no Vercel.

---

## 4. Fechar o CORS (importante)
Volte ao Render → seu serviço → **Environment** → edite:
- `CLIENT_ORIGIN` = a URL do Vercel (ex: `https://conecta-pan.vercel.app`)

Salve. O Render reinicia sozinho. Pronto: abra a URL do Vercel no PC e no celular.

> Pode pôr várias origens separadas por vírgula, ex:
> `CLIENT_ORIGIN=https://conecta-pan.vercel.app,http://localhost:5173`

---

## Checklist rápido de teste
- [ ] Abrir a URL do Vercel, entrar com um @usuario
- [ ] Abrir em outra aba/celular com outro @usuario
- [ ] Mandar mensagem na sala "Conecta Pan - Geral" → aparece nos dois
- [ ] Ver o "digitando..." animado
- [ ] Criar um grupo e uma DM
- [ ] Enviar uma foto
- [ ] Confirmar o tique azul (lida) ao abrir a conversa no outro lado
