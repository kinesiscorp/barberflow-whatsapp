/**
 * Logger customizado com níveis e cores
 */
const LEVELS = {
    debug: { priority: 0, color: '\x1b[36m', label: 'DEBUG' },
    info: { priority: 1, color: '\x1b[32m', label: 'INFO' },
    warn: { priority: 2, color: '\x1b[33m', label: 'WARN' },
    error: { priority: 3, color: '\x1b[31m', label: 'ERROR' },
};

const RESET = '\x1b[0m';

class Logger {
    constructor() {
        this.level = process.env.LOG_LEVEL || 'info';
    }

    /**
     * Formata timestamp para log
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Verifica se o nível deve ser logado
     */
    shouldLog(level) {
        const currentPriority = LEVELS[this.level]?.priority ?? 1;
        const messagePriority = LEVELS[level]?.priority ?? 1;
        return messagePriority >= currentPriority;
    }

    /**
     * Log genérico
     */
    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) return;

        const { color, label } = LEVELS[level] || LEVELS.info;
        const timestamp = this.getTimestamp();
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

        console.log(`${color}[${timestamp}] [${label}]${RESET} ${message}${metaStr}`);
    }

    debug(message, meta) {
        this.log('debug', message, meta);
    }

    info(message, meta) {
        this.log('info', message, meta);
    }

    warn(message, meta) {
        this.log('warn', message, meta);
    }

    error(message, meta) {
        this.log('error', message, meta);
    }
}

module.exports = new Logger();
