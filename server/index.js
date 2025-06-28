const express = require('express');
const cors = require('cors');
const bcryptjs = require('bcryptjs'); // Ganti dari bcrypt ke bcryptjs
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const pool = require('./config/db');
const memberRoutes = require('./routes/members');
const transactionRoutes = require('./routes/transactions');
const settingsRoutes = require('./routes/settings');

require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.APP_PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// Configure CORS
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5000',
        'http://localhost:8000',
        'http://localhost:5500',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:5500',
        'null'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

// Tambahkan logging untuk debug
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.get('Origin') || 'no-origin'}`);
    next();
});

app.use(express.json());

// Rate limiting for login endpoint
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many login attempts, please try again later.' }
});

// API Routes
app.use('/api/members', memberRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/settings', settingsRoutes);

// Login Route with bcryptjs
app.post('/api/login', loginLimiter, [
    body('username').isString().notEmpty().trim().withMessage('Username is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
    body('role').isIn(['bendahara', 'pengawas']).withMessage('Invalid role')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const { username, password, role } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
        const user = users[0];
        const match = await bcryptjs.compare(password, user.password); // Gunakan bcryptjs
        if (!match || user.role !== role) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or role' });
        }
        res.json({ success: true, role: user.role });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error', details: error.message });
    }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const [result] = await pool.query('SELECT 1');
        res.json({ success: true, result });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ success: false, message: 'Database connection failed', details: error.message });
    }
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error', details: err.message });
});

// Start server dengan error handling yang lebih baik
const server = app.listen(PORT, HOST, () => {
    console.log('\n🚀 Server berhasil dijalankan!');
    console.log(`📍 Local: http://${HOST}:${PORT}`);
    console.log(`🌐 Network: http://localhost:${PORT}`);
    console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Node.js Version: ${process.version}`);
    console.log(`💻 Platform: ${process.platform} ${process.arch}`);
    console.log('\n📊 Database Configuration:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   User: ${process.env.DB_USER || 'root'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'kasapro'}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log('\n🔗 Available Endpoints:');
    console.log(`   • GET  http://${HOST}:${PORT}/api/members`);
    console.log(`   • GET  http://${HOST}:${PORT}/api/transactions`);
    console.log(`   • GET  http://${HOST}:${PORT}/api/settings`);
    console.log(`   • POST http://${HOST}:${PORT}/api/login`);
    console.log(`   • GET  http://${HOST}:${PORT}/api/test-db`);
    console.log('\n✨ Server siap menerima request...\n');
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} sudah digunakan. Coba port lain atau hentikan aplikasi yang menggunakan port ini.`);
        process.exit(1);
    } else {
        console.error('❌ Server error:', err);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 Menerima SIGTERM, menutup server...');
    server.close(() => {
        console.log('✅ Server ditutup dengan baik');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n👋 Menerima SIGINT, menutup server...');
    server.close(() => {
        console.log('✅ Server ditutup dengan baik');
        process.exit(0);
    });
});