const express = require('express');
const whatsappService = require('../services/whatsapp');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/send-message
 * Envia uma mensagem de texto para um número
 * 
 * Body:
 * - number: string (número do destinatário com DDD)
 * - message: string (texto da mensagem)
 */
router.post('/send-message', async (req, res) => {
    try {
        const { number, message } = req.body;

        // Validação de parâmetros
        if (!number) {
            return res.status(400).json({
                success: false,
                error: 'O parâmetro "number" é obrigatório',
            });
        }

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'O parâmetro "message" é obrigatório',
            });
        }

        // Remove espaços e caracteres especiais
        const cleanNumber = number.toString().trim();
        const cleanMessage = message.toString().trim();

        if (cleanMessage.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'A mensagem não pode estar vazia',
            });
        }

        // Envia a mensagem
        const result = await whatsappService.sendMessage(cleanNumber, cleanMessage);

        return res.status(200).json({
            success: true,
            message: 'Mensagem enviada com sucesso',
            data: {
                messageId: result.id,
                to: cleanNumber,
            },
        });
    } catch (error) {
        logger.error('Erro na rota send-message', { error: error.message });

        return res.status(500).json({
            success: false,
            error: error.message || 'Erro interno ao enviar mensagem',
        });
    }
});

/**
 * GET /api/status
 * Retorna o status da conexão do WhatsApp
 */
router.get('/status', (req, res) => {
    const status = whatsappService.getStatus();

    return res.status(200).json({
        success: true,
        data: status,
    });
});

module.exports = router;
