const express = require('express');
const router = express.Router();

const {
    register,
    login
} = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);

// API kiểm tra JWT
router.get('/profile', authMiddleware, (req, res) => {
    return res.status(200).json({
        message: 'Xác thực JWT thành công',
        user: req.user
    });
});

module.exports = router;