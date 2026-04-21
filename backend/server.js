require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const projectRoutes = require('./routes/projectRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
// Connecting strictly using the URI from the .env file (e.g., MongoDB Atlas)
if (!process.env.MONGO_URI) {
    console.error('ERROR: MONGO_URI is missing in the .env file!');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const path = require('path');

// Routes
app.use('/api/projects', projectRoutes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../')));

// Catch-all route to serve index.html for any other requests (Single Page App behavior)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
