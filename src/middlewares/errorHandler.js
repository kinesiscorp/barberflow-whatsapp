const logger = require('../utils/logger');

/**
 * Middleware de tratamento global de erros
 */
function errorHandler(err, req, res, next) {
    // Log do erro
    logger.error('Erro não tratado', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Resposta de erro
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Erro interno do servidor';

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

/**
 * Middleware para rotas não encontradas
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: `Rota não encontrada: ${req.method} ${req.path}`,
    });
}

module.exports = { errorHandler, notFoundHandler };
