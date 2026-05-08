const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes')
const aiRoutes = require('./routes/aiRoutes')

//ENV Variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'GROQ_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

//Connect to MongoDB
connectDB();                         //phle env fetch krna hai , then hi call krna hai DB ko

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true
}));


//MIDDLEWARE
app.use(express.json());                        // Without this, req.body will be undefined in your controllers.
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log("Request received:", req.method, req.url);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// Absolute path to client build folder
const __dirnamePath = path.resolve();
const clientBuildPath = path.join(__dirnamePath, '..', 'client', 'dist');

// Serve static files
app.use(express.static(clientBuildPath));

// For any route not starting with /api, send index.html
app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
        return res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
    next();
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is runing on port ${PORT}`);
})