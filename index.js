/**
 * WhatsApp Webhook Gateway
 * Entry point da aplicação
 */

// Carrega variáveis de ambiente
require('dotenv').config();

const createApp = require('./src/app');
const { config, validateConfig } = require('./src/config');
const whatsappService = require('./src/services/whatsapp');
const logger = require('./src/utils/logger');

/**
 * Inicialização da aplicação
 */
async function bootstrap() {
    try {
        // Valida configurações
        validateConfig();

        logger.info('🚀 Iniciando WhatsApp Webhook Gateway...');
        logger.info('Configurações carregadas', {
            port: config.port,
            sessionName: config.sessionName,
            webhookUrl: config.webhookUrl ? '✓ Configurado' : '✗ Não configurado',
        });

        // Inicializa o cliente WhatsApp
        await whatsappService.initialize();

        // Cria e inicia o servidor Express
        const app = createApp();

        app.listen(config.port, () => {
            logger.info(`✅ Servidor HTTP rodando na porta ${config.port}`);
            logger.info('Endpoints disponíveis:');
            logger.info(`   GET  http://localhost:${config.port}/health`);
            logger.info(`   GET  http://localhost:${config.port}/api/status`);
            logger.info(`   POST http://localhost:${config.port}/api/send-message`);
        });

        // Tratamento de encerramento gracioso
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    } catch (error) {
        logger.error('Falha ao iniciar aplicação', { error: error.message });
        process.exit(1);
    }
}

/**
 * Encerramento gracioso
 */
async function gracefulShutdown(signal) {
    logger.warn(`Recebido ${signal}, encerrando...`);

    try {
        if (whatsappService.client) {
            logger.info('Fechando conexão do WhatsApp...');
            await whatsappService.client.close();
        }
    } catch (error) {
        logger.error('Erro ao fechar WhatsApp', { error: error.message });
    }

    logger.info('Aplicação encerrada');
    process.exit(0);
}

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    logger.error('Exceção não capturada', { error: error.message, stack: error.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promise não tratada', { reason });
});

// Inicia a aplicação
bootstrap();
