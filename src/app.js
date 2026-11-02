const express = require('express');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const prisma = require('./config/prisma');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'E-commerce Monolithic API is running' });
});

app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return res.status(200).json({ status: 'UP', database: 'UP' });
    } catch (error) {
        console.error('Health check error:', error.message);
        return res.status(503).json({ status: 'DOWN', database: 'DOWN' });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);

module.exports = app;
