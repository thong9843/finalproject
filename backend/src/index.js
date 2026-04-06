const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.send('VLU Enterprise Link Manager API is running');
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const enterpriseRoutes = require('./routes/enterpriseRoutes');
const activityRoutes = require('./routes/activityRoutes');
const statRoutes = require('./routes/statRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/enterprises', enterpriseRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/stats', statRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
