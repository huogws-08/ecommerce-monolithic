const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
    getMyShipments,
    getShipmentById
} = require('../controllers/shipmentController');

router.use(authMiddleware);

router.get('/', getMyShipments);
router.get('/:id', getShipmentById);

module.exports = router;
