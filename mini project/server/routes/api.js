const express = require('express');
const router = express.Router();
const Prison = require('../models/Prison');
const Staff = require('../models/Staff');
const Visit = require('../models/Visit');

// Get all prisons
router.get('/prisons', async (req, res) => {
    try {
        const prisons = await Prison.find();
        res.json(prisons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all staff
router.get('/staff', async (req, res) => {
    try {
        const staff = await Staff.find();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all visits
router.get('/visits', async (req, res) => {
    try {
        const visits = await Visit.find().populate('prisonerId visitorId');
        res.json(visits);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

