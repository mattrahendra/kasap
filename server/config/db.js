const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kasapro',
    port: process.env.DB_PORT || 3306, // Ubah dari PORT ke DB_PORT
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000 // 10 seconds timeout
});

// Test pool connection on startup
pool.getConnection()
    .then(conn => {
        console.log('✅ Database connected successfully');
        console.log(`📊 Database: ${process.env.DB_NAME || 'kasapro'} at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
        conn.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

module.exports = pool;