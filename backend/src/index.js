const express = require('express');
const cors = require('cors');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static uploaded files as a local fallback
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


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
const userRoutes = require('./routes/userRoutes');
const historyRoutes = require('./routes/historyRoutes');
const taskRoutes = require('./routes/taskRoutes');
const noteRoutes = require('./routes/noteRoutes');
const fileRoutes = require('./routes/fileRoutes');

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
app.use('/api/users', userRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/files', fileRoutes);

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "VLU API Documentation" }));

// Phục vụ các file tĩnh của Frontend đã build
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Trả về file index.html cho các route của Single Page Application (React/Vite Router)
app.get('*', (req, res, next) => {
    // Nếu là request API thì bỏ qua để đi tiếp vào các router API bên dưới
    if (req.path.startsWith('/api/') || req.path.startsWith('/api-docs')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
