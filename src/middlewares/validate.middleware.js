// Validation middleware factory
function validateMiddleware(rules) {
    return (req, res, next) => {
        const errors = [];

        Object.keys(rules).forEach(field => {
            const rule = rules[field];
            const value = req.body[field];

            if (rule.required && (!value || value === '')) {
                errors.push(`${field} is required`);
                return;
            }

            if (rule.type === 'number' && typeof value !== 'number') {
                errors.push(`${field} must be a number`);
            }

            if (rule.type === 'string' && typeof value !== 'string') {
                errors.push(`${field} must be a string`);
            }

            if (rule.minLength && value?.length < rule.minLength) {
                errors.push(`${field} must be at least ${rule.minLength} characters`);
            }

            if (rule.maxLength && value?.length > rule.maxLength) {
                errors.push(`${field} must be at most ${rule.maxLength} characters`);
            }

            if (rule.min !== undefined && value < rule.min) {
                errors.push(`${field} must be at least ${rule.min}`);
            }

            if (rule.max !== undefined && value > rule.max) {
                errors.push(`${field} must be at most ${rule.max}`);
            }
        });

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors,
            });
        }

        next();
    };
}

module.exports = validateMiddleware;
