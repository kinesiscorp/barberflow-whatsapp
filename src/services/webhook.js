const axios = require('axios');
const logger = require('../utils/logger');
const { config } = require('../config');

/**
 * Serviço de Webhook
 * Responsável por enviar dados das mensagens recebidas para o webhook configurado
 */
class WebhookService {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 segundo
    }

    /**
     * Aguarda um tempo antes de tentar novamente
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Envia dados para o webhook com retry logic
     * @param {Object} payload - Dados a serem enviados
     * @returns {Promise<boolean>} - Sucesso ou falha
     */
    async send(payload) {
        if (!config.webhookUrl) {
            logger.warn('Webhook URL não configurada, ignorando envio');
            return false;
        }

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                logger.debug(`Enviando para webhook (tentativa ${attempt}/${this.maxRetries})`, {
                    url: config.webhookUrl,
                });

                const response = await axios.post(config.webhookUrl, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000, // 10 segundos
                });

                logger.info('Webhook enviado com sucesso', {
                    status: response.status,
                    number: payload.number,
                });

                return true;
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message;

                logger.error(`Falha ao enviar webhook (tentativa ${attempt}/${this.maxRetries})`, {
                    error: errorMessage,
                    status: error.response?.status,
                });

                if (attempt < this.maxRetries) {
                    await this.sleep(this.retryDelay * attempt);
                }
            }
        }

        logger.error('Todas as tentativas de envio para webhook falharam');
        return false;
    }

    /**
     * Formata e envia uma mensagem recebida para o webhook
     * @param {Object} message - Mensagem do WhatsApp
     */
    async forwardMessage(message) {
        const payload = {
            name: message.sender?.pushname || message.sender?.name || 'Desconhecido',
            number: message.from.replace('@c.us', ''),
            messageType: this.getMessageType(message),
            message: this.getMessageContent(message),
            timestamp: new Date().toISOString(),
        };

        logger.debug('Preparando payload para webhook', payload);

        return this.send(payload);
    }

    /**
     * Identifica o tipo da mensagem
     */
    getMessageType(message) {
        if (message.isMedia || message.isMMS) {
            if (message.type === 'image') return 'image';
            if (message.type === 'video') return 'video';
            if (message.type === 'audio' || message.type === 'ptt') return 'audio';
            if (message.type === 'document') return 'document';
            if (message.type === 'sticker') return 'sticker';
            return 'media';
        }
        return 'text';
    }

    /**
     * Extrai o conteúdo da mensagem
     */
    getMessageContent(message) {
        // Para mensagens de texto, retorna o corpo
        if (message.body) {
            return message.body;
        }

        // Para mídia, retorna a caption ou tipo
        if (message.caption) {
            return message.caption;
        }

        return `[${this.getMessageType(message)}]`;
    }
}

module.exports = new WebhookService();
