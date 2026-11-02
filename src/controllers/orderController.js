const prisma = require('../config/prisma');

const createOrder = async (req, res) => {
    try {
        const uid = Number(req.user.uid);
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Đơn hàng phải có ít nhất một sản phẩm'
            });
        }

        // Gộp các sản phẩm trùng ID
        const quantities = new Map();

        for (const item of items) {
            const pid = Number(item.pid);
            const qty = Number(item.qty);

            if (!Number.isInteger(pid) || pid <= 0 ||
                !Number.isInteger(qty) || qty <= 0) {
                return res.status(400).json({
                    message: 'Mỗi sản phẩm cần pid hợp lệ và qty lớn hơn 0'
                });
            }

            quantities.set(pid, (quantities.get(pid) || 0) + qty);
        }

        const order = await prisma.$transaction(async (tx) => {
            const productIds = [...quantities.keys()];

            const products = await tx.product.findMany({
                where: { pid: { in: productIds } }
            });

            if (products.length !== productIds.length) {
                throw new Error('PRODUCT_NOT_FOUND');
            }

            for (const product of products) {
                const requestedQty = quantities.get(product.pid);
                if (product.quantity < requestedQty) {
                    throw new Error(`OUT_OF_STOCK:${product.pname}`);
                }
            }

            const newOrder = await tx.order.create({
                data: {
                    uid,
                    createat: new Date()
                }
            });

            for (const product of products) {
                const qty = quantities.get(product.pid);

                await tx.orderDetail.create({
                    data: {
                        oid: newOrder.oid,
                        pid: product.pid,
                        qty,
                        unit_price: product.price
                    }
                });

                await tx.product.update({
                    where: { pid: product.pid },
                    data: { quantity: { decrement: qty } }
                });
            }

            await tx.shipment.create({
                data: {
                    oid: newOrder.oid,
                    status: 'PENDING'
                }
            });

            return tx.order.findUnique({
                where: { oid: newOrder.oid },
                include: {
                    details: { include: { product: true } },
                    shipments: true
                }
            });
        });

        return res.status(201).json({
            message: 'Đặt hàng thành công',
            data: order
        });
    } catch (error) {
        if (error.message === 'PRODUCT_NOT_FOUND') {
            return res.status(404).json({ message: 'Có sản phẩm không tồn tại' });
        }
        if (error.message.startsWith('OUT_OF_STOCK:')) {
            return res.status(400).json({
                message: `Không đủ tồn kho: ${error.message.split(':')[1]}`
            });
        }
        console.error('Create order error:', error);
        return res.status(500).json({ message: 'Lỗi tạo đơn hàng' });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { uid: Number(req.user.uid) },
            orderBy: { createat: 'desc' },
            include: {
                details: { include: { product: true } },
                shipments: true
            }
        });

        return res.json({ data: orders });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi lấy danh sách đơn hàng' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const oid = Number(req.params.id);
        if (!Number.isInteger(oid) || oid <= 0) {
            return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
        }

        const order = await prisma.order.findFirst({
            where: {
                oid,
                uid: Number(req.user.uid)
            },
            include: {
                details: { include: { product: true } },
                shipments: true
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        return res.json({ data: order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi lấy đơn hàng' });
    }
};

module.exports = { createOrder, getMyOrders, getOrderById };
