const prisma = require('../config/prisma');

const getMyShipments = async (req, res) => {
    try {
        const shipments = await prisma.shipment.findMany({
            where: {
                order: { uid: Number(req.user.uid) }
            },
            include: {
                order: {
                    include: {
                        details: { include: { product: true } }
                    }
                }
            },
            orderBy: { shipid: 'desc' }
        });

        return res.json({ data: shipments });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi lấy thông tin giao hàng' });
    }
};

const getShipmentById = async (req, res) => {
    try {
        const shipid = Number(req.params.id);

        if (!Number.isInteger(shipid) || shipid <= 0) {
            return res.status(400).json({ message: 'ID giao hàng không hợp lệ' });
        }

        const shipment = await prisma.shipment.findFirst({
            where: {
                shipid,
                order: { uid: Number(req.user.uid) }
            },
            include: { order: true }
        });

        if (!shipment) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin giao hàng' });
        }

        return res.json({ data: shipment });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi lấy thông tin giao hàng' });
    }
};

module.exports = { getMyShipments, getShipmentById };
