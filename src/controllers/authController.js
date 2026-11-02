
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Đăng ký tài khoản
// Tự động gán Role NORMAL và Membership có score = 10
const register = async (req, res) => {
    try {
        const { username, fullname, password } = req.body;

        if (!username || !fullname || !password) {
            return res.status(400).json({
                message: 'Vui lòng nhập username, fullname và password'
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'JWT_SECRET chưa được cấu hình'
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Kiểm tra username đã tồn tại
            const existingUser = await tx.user.findFirst({
                where: { username }
            });

            if (existingUser) {
                const error = new Error('Tên đăng nhập đã tồn tại');
                error.statusCode = 409;
                throw error;
            }

            // Tìm hoặc tạo Role NORMAL
            let normalRole = await tx.role.findFirst({
                where: { rolename: 'NORMAL' }
            });

            if (!normalRole) {
                normalRole = await tx.role.create({
                    data: {
                        rolename: 'NORMAL'
                    }
                });
            }

            // Tìm hoặc tạo Membership có score = 10
            let defaultMembership = await tx.membership.findFirst({
                where: { score: 10 }
            });

            if (!defaultMembership) {
                defaultMembership = await tx.membership.create({
                    data: {
                        mname: 'NORMAL',
                        score: 10
                    }
                });
            }

            // Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo tài khoản
            const user = await tx.user.create({
                data: {
                    username,
                    fullname,
                    password: hashedPassword,
                    roleid: normalRole.roleid,
                    mid: defaultMembership.mid
                },
                select: {
                    uid: true,
                    username: true,
                    fullname: true,
                    roleid: true,
                    mid: true
                }
            });

            return {
                user,
                role: normalRole.rolename,
                membership: {
                    name: defaultMembership.mname,
                    score: defaultMembership.score
                }
            };
        });

        return res.status(201).json({
            message: 'Đăng ký thành công',
            data: result
        });

    } catch (error) {
        console.error('Register error:', error);

        return res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : 'Lỗi máy chủ'
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

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'JWT_SECRET chưa được cấu hình'
            });
        }

        const user = await prisma.user.findFirst({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({
                message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
            });
        }

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
