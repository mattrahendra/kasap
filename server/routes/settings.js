const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
    try {
        const [settings] = await pool.query('SELECT * FROM settings LIMIT 1');
        res.json(settings[0] || {});
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings', details: error.message });
    }
});

// Update settings
router.post('/', async (req, res) => {
    const { organizationName, activeMonth, monthlyFee } = req.body;
    if (!organizationName || !activeMonth || !monthlyFee) {
        return res.status(400).json({ error: 'All settings fields are required' });
    }
    try {
        await pool.query(
            'UPDATE settings SET organization_name = ?, active_month = ?, monthly_fee = ? WHERE id = 1',
            [organizationName, activeMonth, monthlyFee]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings', details: error.message });
    }
});

module.exports = router;