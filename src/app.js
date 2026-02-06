const express = require('express');
const messageRoutes = require('./routes/message');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

/**
 * Cria e configura a aplicação Express
 */
function createApp() {
    const app = express();

    // Middlewares de parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Middleware de logging de requisições
    app.use((req, res, next) => {
        logger.debug(`${req.method} ${req.path}`, {
            body: req.body,
            query: req.query,
        });
        next();
    });

    // Health check
    app.get('/health', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
        });
    });

    // Rotas da API
    app.use('/api', messageRoutes);

    // Handlers de erro
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

module.exports = createApp;
