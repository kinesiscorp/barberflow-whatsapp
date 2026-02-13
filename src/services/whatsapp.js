const wppconnect = require('@wppconnect-team/wppconnect');
const logger = require('../utils/logger');
const { config } = require('../config');
const webhookService = require('./webhook');

/**
 * Serviço WhatsApp
 * Gerencia a conexão e eventos do WPPConnect
 */
class WhatsAppService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;
    }

    /**
     * Inicializa o cliente WhatsApp
     */
    async initialize() {
        logger.info('Inicializando cliente WhatsApp...');

        try {
            this.client = await wppconnect.create({
                session: config.sessionName,
                whatsappVersion: '2.3000.1032900857-alpha',
                catchQR: (base64Qr, asciiQR) => {
                    console.log('\n' + asciiQR + '\n');
                    logger.info('QR Code gerado. Escaneie com o WhatsApp.');
                },
                statusFind: (statusSession, session) => {
                    this.handleStatusChange(statusSession, session);
                },
                headless: 'new',
                devtools: false,
                useChrome: true,
                debug: false,
                logQR: true,
                browserWS: '',
                browserArgs: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                ],
                puppeteerOptions: {
                    headless: 'new',
                },
                autoClose: 0,
                tokenStore: 'file',
                folderNameToken: config.tokensPath,
            });

            this.setupEventListeners();
            logger.info('Cliente WhatsApp inicializado com sucesso!');

            return this.client;
        } catch (error) {
            logger.error('Erro ao inicializar cliente WhatsApp', { error: error.message });
            await this.handleReconnect();
            throw error;
        }
    }

    /**
     * Configura os listeners de eventos
     */
    setupEventListeners() {
        if (!this.client) return;

        this.client.onMessage(async (message) => {
            await this.handleIncomingMessage(message);
        });

        this.client.onIncomingCall(async (call) => {
            await this.handleIncomingCall(call);
        });

        this.client.onStateChange((state) => {
            logger.info('Estado da conexão alterado', { state });

            if (state === 'CONNECTED' || state === 'CONFLICT') {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                logger.info('✅ WhatsApp conectado (state: ' + state + ')');
            }

            if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
                this.client.useHere();
            }

            if (state === 'UNPAIRED' || state === 'UNPAIRED_IDLE') {
                this.isConnected = false;
                logger.warn('Dispositivo desconectado, tentando reconectar...');
                this.handleReconnect();
            }
        });

        this.client.onStreamChange((state) => {
            logger.debug('Stream state changed', { state });
        });

        logger.info('Event listeners configurados');
    }

    /**
     * Trata mudanças de status da sessão
     */
    handleStatusChange(status, session) {
        logger.info('Status da sessão', { status, session });

        switch (status) {
            case 'isLogged':
                this.isConnected = true;
                this.reconnectAttempts = 0;
                logger.info('✅ WhatsApp conectado com sucesso!');
                break;

            case 'notLogged':
                this.isConnected = false;
                logger.warn('WhatsApp não está logado. Escaneie o QR Code.');
                break;

            case 'browserClose':
                this.isConnected = false;
                logger.error('Navegador fechado inesperadamente');
                this.handleReconnect();
                break;

            case 'desconnectedMobile':
                this.isConnected = false;
                logger.error('Celular desconectado');
                this.handleReconnect();
                break;

            case 'qrReadSuccess':
                logger.info('QR Code lido com sucesso!');
                break;

            case 'qrReadFail':
                logger.error('Falha ao ler QR Code');
                break;

            case 'serverClose':
                this.isConnected = false;
                logger.error('Servidor fechado');
                this.handleReconnect();
                break;

            default:
                logger.debug('Status não tratado', { status });
        }
    }

    /**
     * Processa mensagens recebidas
     */
    async handleIncomingMessage(message) {
        try {
            if (message.fromMe) return;
            if (message.isStatus || message.from === 'status@broadcast') return;
            if (message.isGroupMsg || message.from.includes('@g.us')) return;

            logger.info('Mensagem recebida', {
                from: message.from,
                type: message.type,
                hasBody: !!message.body,
                body: message.body || null,
                caption: message.caption || null,
            });
            await webhookService.forwardMessage(message);
        } catch (error) {
            logger.error('Erro ao processar mensagem', { error: error.message });
        }
    }

    /**
     * Rejeita chamadas recebidas
     */
    async handleIncomingCall(call) {
        try {
            logger.info('Chamada recebida - rejeitando', { from: call.peerJid, isVideo: call.isVideo });
            await new Promise((resolve) => setTimeout(resolve, 1000));
            if (this.client && typeof this.client.rejectCall === 'function') {
                await this.client.rejectCall(call.id);
                logger.info('Chamada rejeitada com sucesso');
            } else {
                logger.warn('Método rejectCall não disponível');
            }
        } catch (error) {
            logger.error('Erro ao rejeitar chamada', { error: error.message });
        }
    }

    /**
     * Tenta reconectar após falha
     */
    async handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('Número máximo de tentativas de reconexão atingido');
            process.exit(1);
        }

        this.reconnectAttempts++;
        logger.warn(`Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        if (this.client) {
            try {
                await this.client.close();
            } catch (e) {
                logger.debug('Erro ao fechar cliente anterior', { error: e?.message });
            }
            this.client = null;
        }
        this.isConnected = false;

        await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay));

        try {
            await this.initialize();
        } catch (error) {
            logger.error('Falha na reconexão', { error: error.message });
        }
    }

    /**
     * Envia mensagem de texto
     */
    async sendMessage(number, message) {
        if (!this.client) {
            throw new Error('Cliente WhatsApp não inicializado');
        }
        if (!this.isConnected) {
            throw new Error('WhatsApp não está conectado');
        }

        const formattedNumber = this.formatNumber(number);
        logger.info('Enviando mensagem', { to: formattedNumber });

        try {
            const result = await this.client.sendText(formattedNumber, message);
            logger.info('Mensagem enviada com sucesso', { messageId: result.id });
            return result;
        } catch (error) {
            logger.error('Erro ao enviar mensagem', { error: error.message });
            throw error;
        }
    }

    formatNumber(number) {
        let cleaned = number.replace(/\D/g, '');
        if (cleaned.length <= 11) {
            cleaned = '55' + cleaned;
        }
        return `${cleaned}@c.us`;
    }

    getStatus() {
        return {
            connected: this.isConnected,
            sessionName: config.sessionName,
            reconnectAttempts: this.reconnectAttempts,
        };
    }
}

module.exports = new WhatsAppService();
