// Rate limiting middleware
const rateLimitMap = new Map();

function rateLimitMiddleware(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();

        if (!rateLimitMap.has(key)) {
            rateLimitMap.set(key, []);
        }

        const requests = rateLimitMap.get(key);
        const recentRequests = requests.filter(time => now - time < windowMs);

        if (recentRequests.length >= maxRequests) {
            return res.status(429).json({
                error: 'Too many requests. Please try again later.',
            });
        }

        recentRequests.push(now);
        rateLimitMap.set(key, recentRequests);

        next();
    };
}

module.exports = rateLimitMiddleware;
