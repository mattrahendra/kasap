const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const router = express.Router();

// Get all transactions
router.get('/', async (req, res) => {
    try {
        const [transactions] = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
    }
});

// Add transaction
router.post('/', async (req, res) => {
    const { type, description, amount, method, memberId, month, year, category } = req.body;
    if (!type || !description || !amount || !method) {
        return res.status(400).json({ error: 'Type, description, amount, and method are required' });
    }
    try {
        await pool.query(
            'INSERT INTO transactions (id, type, description, amount, method, date, member_id, month_id, year, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), type, description, amount, method, new Date().toISOString().split('T')[0], memberId, month, year, category]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ error: 'Failed to add transaction', details: error.message });
    }
});

module.exports = router;