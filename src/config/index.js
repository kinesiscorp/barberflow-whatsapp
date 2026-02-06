/**
 * Configurações centralizadas da aplicação
 */
const config = {
  // Servidor
  port: parseInt(process.env.PORT, 10) || 3000,

  // Webhook
  webhookUrl: process.env.WEBHOOK_URL || '',

  // WhatsApp
  sessionName: process.env.SESSION_NAME || 'whatsapp-gateway',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Diretório de tokens
  tokensPath: './tokens',
};

/**
 * Valida configurações obrigatórias
 * WEBHOOK_URL é opcional: quando não configurado, o gateway pode rodar só para envio (ex.: notificações).
 */
function validateConfig() {
  const errors = [];
  if (errors.length > 0) {
    console.error('❌ Erros de configuração:');
    errors.forEach((err) => console.error(`   - ${err}`));
    process.exit(1);
  }
}

module.exports = { config, validateConfig };
