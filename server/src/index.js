const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { sequelize } = require('./models');
const syncRoutes = require('./routes/syncRoutes');
const featureRoutes = require('./routes/featureRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

const faceRoutes = require('./routes/faceRoutes');

// Routes
app.use('/api/sync', syncRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/faces', faceRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully');
        
        // Sync models (don't force in production)
        await sequelize.sync({ alter: true });
        console.log('Models synchronized');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Server failed to start:', error);
    }
};

startServer();
