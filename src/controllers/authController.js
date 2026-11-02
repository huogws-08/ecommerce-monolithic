const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Đăng ký tài khoản
const register = async (req, res) => {
    try {
        const { username, fullname, password, roleid, mid } = req.body;

        if (!username || !fullname || !password || !roleid || !mid) {
            return res.status(400).json({
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }

        // Kiểm tra username đã tồn tại
        // Dùng findFirst vì username hiện chưa có @unique trong Prisma schema
        const existingUser = await prisma.user.findFirst({
            where: { username }
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Tên đăng nhập đã tồn tại'
            });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo tài khoản
        const user = await prisma.user.create({
            data: {
                username,
                fullname,
                password: hashedPassword,
                roleid: Number(roleid),
                mid: Number(mid)
            },
            select: {
                uid: true,
                username: true,
                fullname: true,
                roleid: true,
                mid: true
            }
        });

        return res.status(201).json({
            message: 'Đăng ký thành công',
            data: user
        });

    } catch (error) {
        console.error('Register error:', error);

        return res.status(500).json({
            message: 'Lỗi máy chủ'
        });
    }
};

// Đăng nhập
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: 'Vui lòng nhập username và password'
            });
        }

        // Dùng findFirst vì username chưa có @unique
        const user = await prisma.user.findFirst({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({
                message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
            });
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
            });
        }

        // Tạo JWT
        const token = jwt.sign(
            {
                uid: user.uid,
                username: user.username,
                roleid: user.roleid
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1d'
            }
        );

        return res.status(200).json({
            message: 'Đăng nhập thành công',
            token
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            message: 'Lỗi máy chủ'
        });
    }
};

module.exports = {
    register,
    login
};