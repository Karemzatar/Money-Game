// Error handling middleware
function errorMiddleware(err, req, res, next) {
    console.error('[ERROR]', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        error: message,
        errorId: `ERR_${Date.now()}`,
    });
}

module.exports = errorMiddleware;
