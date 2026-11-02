const express = require('express');
const authRoutes = require('./routes/authRoutes');
const prisma = require('./config/prisma');

const app = express();

app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'E-commerce Monolithic API is running'
    });
});

// Health Check
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        return res.status(200).json({
            status: 'UP',
            database: 'UP'
        });
    } catch (error) {
        console.error('Health check error:', error.message);

        return res.status(503).json({
            status: 'DOWN',
            database: 'DOWN'
        });
    }
});

// Auth routes
app.use('/api/auth', authRoutes);

module.exports = app;