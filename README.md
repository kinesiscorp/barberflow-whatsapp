# WhatsApp Webhook Gateway

Gateway de WhatsApp para receber e enviar mensagens via API/Webhook utilizando Node.js, Express e WPPConnect.

## ✨ Funcionalidades

- 📱 Conexão com WhatsApp via WPPConnect
- 🔄 Auto-reconexão e persistência de sessão
- 📨 API para enviar mensagens
- 🔔 Webhook para receber mensagens
- 🚫 Ignora mensagens de status e grupos
- 📵 Rejeita ligações automaticamente

## 📁 Estrutura do Projeto

```
├── src/
│   ├── config/          # Configurações centralizadas
│   ├── services/        # Serviços (WhatsApp, Webhook)
│   ├── routes/          # Rotas da API
│   ├── middlewares/     # Middlewares Express
│   ├── utils/           # Utilitários (Logger)
│   └── app.js           # Configuração Express
├── tokens/              # Sessões (auto-gerado)
├── .env                 # Variáveis de ambiente
└── index.js             # Entry point
```

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Iniciar
npm start
```

## ⚙️ Configuração (.env)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | 3000 |
| `WEBHOOK_URL` | URL para enviar mensagens recebidas | - |
| `SESSION_NAME` | Nome da sessão WhatsApp | whatsapp-gateway |
| `LOG_LEVEL` | Nível de log (debug, info, warn, error) | info |

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Status da Conexão
```
GET /api/status
```

### Enviar Mensagem
```
POST /api/send-message
Content-Type: application/json

{
  "number": "5511999999999",
  "message": "Sua mensagem aqui"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso",
  "data": {
    "messageId": "...",
    "to": "5511999999999"
  }
}
```

## 🔔 Webhook

Quando uma mensagem é recebida, ela é enviada via POST para o `WEBHOOK_URL` configurado:

```json
{
  "name": "Nome do Contato",
  "number": "5511999999999",
  "messageType": "text",
  "message": "Conteúdo da mensagem",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

**Tipos de mensagem:** `text`, `image`, `video`, `audio`, `document`, `sticker`

## 📝 Primeira Execução

1. Execute `npm start`
2. Escaneie o QR Code exibido no terminal com seu WhatsApp
3. Após conectar, a sessão será salva automaticamente
4. Nas próximas execuções, a conexão será restaurada sem QR Code

## 📄 Licença

MIT