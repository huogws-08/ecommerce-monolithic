const prisma = require('../config/prisma');

const getProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { pid: 'asc' }
        });
        return res.json({ data: products });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi lấy danh sách sản phẩm' });
    }
};

const getProduct = async (req, res) => {
    try {
        const pid = Number(req.params.id);
        if (!Number.isInteger(pid) || pid <= 0) {
            return res.status(400).json({ message: 'ID không hợp lệ' });
        }

        const product = await prisma.product.findUnique({ where: { pid } });
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        return res.json({ data: product });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi lấy sản phẩm' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { pname, price, quantity } = req.body;
        const numericPrice = Number(price);
        const numericQuantity = Number(quantity);

        if (!pname || !Number.isFinite(numericPrice) || numericPrice <= 0 ||
            !Number.isInteger(numericQuantity) || numericQuantity < 0) {
            return res.status(400).json({
                message: 'Cần nhập pname, price > 0 và quantity là số nguyên không âm'
            });
        }

        const product = await prisma.product.create({
            data: { pname, price: numericPrice, quantity: numericQuantity }
        });

        return res.status(201).json({ message: 'Tạo sản phẩm thành công', data: product });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi tạo sản phẩm' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const pid = Number(req.params.id);
        const { pname, price, quantity } = req.body;

        if (!Number.isInteger(pid) || pid <= 0) {
            return res.status(400).json({ message: 'ID không hợp lệ' });
        }

        const data = {};
        if (pname !== undefined) {
            if (typeof pname !== 'string' || !pname.trim()) {
                return res.status(400).json({ message: 'Tên sản phẩm không hợp lệ' });
            }
            data.pname = pname.trim();
        }
        if (price !== undefined) {
            if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
                return res.status(400).json({ message: 'Giá sản phẩm không hợp lệ' });
            }
            data.price = Number(price);
        }
        if (quantity !== undefined) {
            if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
                return res.status(400).json({ message: 'Số lượng không hợp lệ' });
            }
            data.quantity = Number(quantity);
        }

        const product = await prisma.product.update({ where: { pid }, data });
        return res.json({ message: 'Cập nhật sản phẩm thành công', data: product });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        console.error(error);
        return res.status(500).json({ message: 'Lỗi cập nhật sản phẩm' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const pid = Number(req.params.id);
        if (!Number.isInteger(pid) || pid <= 0) {
            return res.status(400).json({ message: 'ID không hợp lệ' });
        }

        await prisma.product.delete({ where: { pid } });
        return res.json({ message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        if (error.code === 'P2003' || error.code === 'P2014') {
            return res.status(409).json({ message: 'Không thể xóa sản phẩm đã có trong đơn hàng' });
        }
        console.error(error);
        return res.status(500).json({ message: 'Lỗi xóa sản phẩm' });
    }
};

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
};
