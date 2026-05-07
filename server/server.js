const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const PORT = process.env.PORT || 3000;
const authRoutes = require('./routes/authRoutes')
const aiRoutes = require('./routes/aiRoutes')

//ENV Variables
dotenv.config();

//Connect to MongoDB
connectDB();                         //phle env fetch krna hai , then hi call krna hai DB ko


const app = express();

//MIDDLEWARE
app.use(express.json());                        // Without this, req.body will be undefined in your controllers.

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
    console.log(`Server is runing on port ${PORT}`);
})