// Load environment variables first
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./server/routes/api');
const prisonersRouter = require('./server/routes/prisoners');
const axios = require('axios');

// Set default environment variables if not present
process.env.PORT = process.env.PORT || '3000';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prison_management';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_123';

const app = express();
const corsOptions = {
    origin: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: '*',  // Allow all headers
    exposedHeaders: '*',  // Expose all headers
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Update the CORS configuration in server.js
app.use(cors(corsOptions));

// Add specific OPTIONS handler for the problematic endpoint
app.options('/ai/prompts', cors(corsOptions));
app.options('/api/aitopia', cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory and root directory
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(path.join(__dirname, 'public/js'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
app.use('/css', express.static(path.join(__dirname, 'public/css')));

// API Routes
app.use('/api', apiRoutes);
app.use('/api/prisoners', prisonersRouter);

// Add this after your CORS configuration
app.use('/api/aitopia', async (req, res) => {
    try {
        const response = await axios({
            method: req.method,
            url: 'https://extensions.aitopia.ai/ai/prompts',
            headers: {
                'hopekey': req.headers.hopekey,
                'Content-Type': 'application/json',
                'Accept': '*/*'
            },
            data: req.body
        });
        
        // Set CORS headers on the proxied response
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,X-Requested-With,hopekey');
        res.header('Access-Control-Allow-Credentials', 'true');

        // Add Vary header to indicate response varies based on Origin
        res.header('Vary', 'Origin');

        res.json(response.data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(error.response?.status || 500).json({
            message: 'Error proxying request to aitopia.ai',
            error: error.message
        });
    }
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Protected routes
const { auth, isAdmin, isVisitor } = require('./middleware/auth');

// Admin routes
app.get('/api/admin/dashboard', auth, isAdmin, (req, res) => {
    res.json({ message: 'Admin dashboard data' });
});

// Visitor routes
app.get('/api/visitor/dashboard', auth, isVisitor, (req, res) => {
    res.json({ message: 'Visitor dashboard data' });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/visitor-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'visitor-dashboard.html'));
});

// Connect to MongoDB with error handling
const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('MongoDB URI:', process.env.MONGODB_URI);
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB successfully');

        // Create a default prison if none exists
        const Prison = require('./server/models/Prison');
        const prisonCount = await Prison.countDocuments();
        if (prisonCount === 0) {
            console.log('Creating default prison...');
            const defaultPrison = new Prison({
                name: 'Central Prison',
                location: 'Main City',
                capacity: 1000,
                currentPopulation: 0,
                type: 'Maximum Security',
                address: '123 Prison Street',
                contactNumber: '555-0123',
                email: 'contact@centralprison.com'
            });
            await defaultPrison.save();
            console.log('Default prison created successfully');
        }
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit process with failure
    }
};

// Connect to database before starting server
connectDB().then(() => {
    const PORT = process.env.PORT;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Login page: http://localhost:${PORT}/login.html`);
        console.log(`Admin Dashboard: http://localhost:${PORT}/admin-dashboard`);
        console.log(`Visitor Dashboard: http://localhost:${PORT}/visitor-dashboard`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});