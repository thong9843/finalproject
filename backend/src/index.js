const express = require('express');
const cors = require('cors');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

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
const studentRoutes = require('./routes/studentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const importRoutes = require('./routes/importRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const mouRoutes = require('./routes/mouRoutes');
const structureRoutes = require('./routes/structureRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/enterprises', enterpriseRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/stats', statRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/import', importRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/mous', mouRoutes);
app.use('/api/structure', structureRoutes);

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "VLU API Documentation" }));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
