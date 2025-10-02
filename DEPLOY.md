# 🚀 Guia de Deploy

## Opções de Hospedagem

### 1. Vercel (Recomendado) ⭐

A Vercel é a plataforma criada pelos desenvolvedores do Next.js e oferece deploy gratuito.

#### Passo a Passo:

1. **Criar conta na Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com GitHub, GitLab ou Bitbucket

2. **Push do código para Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - LoL Ranking"
   git branch -M main
   git remote add origin seu-repositorio.git
   git push -u origin main
   ```

3. **Importar projeto na Vercel**
   - Na dashboard da Vercel, clique em "Import Project"
   - Selecione seu repositório
   - O Next.js será detectado automaticamente

4. **Configurar Variáveis de Ambiente**
   - Na tela de configuração, adicione:
     ```
     RIOT_API_KEY=sua-api-key
     RIOT_REGION=br1
     RIOT_ROUTING=americas
     ```

5. **Deploy**
   - Clique em "Deploy"
   - Aguarde ~2 minutos
   - Seu site estará no ar!

#### Atualizações Automáticas:
- Cada push no Git dispara um novo deploy automaticamente
- Visualize previews de PRs antes de mergear

---

### 2. Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Conecte seu repositório Git
3. Configure build:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Adicione as variáveis de ambiente
5. Deploy!

---

### 3. Railway

1. Acesse [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Selecione seu repositório
4. Adicione variáveis de ambiente
5. Railway detecta Next.js automaticamente

---

### 4. VPS/Cloud (AWS, DigitalOcean, etc.)

Para servidores próprios:

```bash
# 1. Clonar repositório
git clone seu-repositorio.git
cd ranking

# 2. Instalar dependências
npm install

# 3. Criar .env.local
echo "RIOT_API_KEY=sua-key" > .env.local
echo "RIOT_REGION=br1" >> .env.local
echo "RIOT_ROUTING=americas" >> .env.local

# 4. Build de produção
npm run build

# 5. Iniciar com PM2 (recomendado)
npm install -g pm2
pm2 start npm --name "lol-ranking" -- start
pm2 save
pm2 startup
```

#### Nginx Config (opcional):
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ⚙️ Configurações de Produção

### Variáveis de Ambiente Obrigatórias:
```env
RIOT_API_KEY=sua-production-key
RIOT_REGION=br1
RIOT_ROUTING=americas
```

### Otimizações:

1. **Production API Key**
   - Solicite uma chave de produção da Riot
   - Ela não expira e tem rate limits maiores
   - [Solicitar aqui](https://developer.riotgames.com/)

2. **Caching** (Opcional)
   - Considere usar Redis ou similar para cachear resultados
   - Reduz chamadas à API da Riot
   - Melhora performance

3. **Analytics** (Opcional)
   - Google Analytics
   - Vercel Analytics
   - Plausible

---

## 🔒 Segurança

### ✅ Checklist:

- [ ] API Key está em variável de ambiente (nunca no código)
- [ ] `.env.local` está no `.gitignore`
- [ ] Rate limiting implementado (já incluído)
- [ ] HTTPS ativado (automático na Vercel/Netlify)

---

## 📊 Monitoramento

### Logs:
- **Vercel**: Dashboard → Seu Projeto → Functions
- **Netlify**: Dashboard → Functions → Logs
- **VPS**: `pm2 logs lol-ranking`

### Métricas Importantes:
- Taxa de erro da API Riot
- Tempo de resposta
- Uso de rate limits

---

## 🐛 Troubleshooting em Produção

### API Key Não Funciona:
- Verifique se é uma chave de produção
- Confirme as variáveis de ambiente
- Veja os logs do servidor

### Site Lento:
- Verifique rate limits da Riot API
- Considere reduzir número de partidas analisadas
- Implemente caching

### Dados Não Atualizam:
- Verifique se o servidor está rodando
- Veja logs de erros
- Confirme que a API key é válida

---

## 💡 Dicas de Deploy

1. **Teste localmente antes**
   ```bash
   npm run build
   npm start
   ```

2. **Use domínio personalizado**
   - Na Vercel: Settings → Domains
   - Na Netlify: Domain Settings → Custom Domain

3. **Configure SSL**
   - Automático na maioria das plataformas
   - Para VPS, use Let's Encrypt

4. **Monitoramento de Uptime**
   - [UptimeRobot](https://uptimerobot.com) (gratuito)
   - [Pingdom](https://pingdom.com)

---

## 🎯 Próximos Passos

Após o deploy:

1. ✅ Teste todas as funcionalidades
2. ✅ Verifique atualização automática
3. ✅ Configure monitoramento
4. ✅ Compartilhe com sua comunidade!

---

## 📞 Suporte

Problemas no deploy? Verifique:
1. Documentação da plataforma escolhida
2. Logs de erro
3. Variáveis de ambiente

Bom deploy! 🚀

