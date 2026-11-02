const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Không có Authorization header
        if (!authHeader) {
            return res.status(401).json({
                message: 'Không có token xác thực'
            });
        }

        // Kiểm tra format: Bearer <token>
        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                message: 'Token không đúng định dạng'
            });
        }

        const token = parts[1];

        // Xác thực JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Lưu thông tin user vào request
        req.user = decoded;

        next();

    } catch (error) {
        console.error('Auth error:', error.message);

        return res.status(401).json({
            message: 'Token không hợp lệ hoặc đã hết hạn'
        });
    }
};

module.exports = authMiddleware;