const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const router = express.Router();

// Get all members
router.get('/', async (req, res) => {
    try {
        const [members] = await pool.query('SELECT * FROM members');
        res.json(members);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Failed to fetch members', details: error.message });
    }
});

// Add or update member
router.post('/', async (req, res) => {
    const { id, name, phone, address, rayon } = req.body;
    if (!name || !phone || !rayon) {
        return res.status(400).json({ error: 'Name, phone, and rayon are required' });
    }
    try {
        if (id) {
            const [result] = await pool.query(
                'UPDATE members SET name = ?, phone = ?, address = ?, rayon = ? WHERE id = ?',
                [name, phone, address, rayon, id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Member not found' });
            }
        } else {
            await pool.query(
                'INSERT INTO members (id, name, phone, address, rayon) VALUES (?, ?, ?, ?, ?)',
                [uuidv4(), name, phone, address, rayon]
            );
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving member:', error);
        res.status(500).json({ error: 'Failed to save member', details: error.message });
    }
});

module.exports = router;