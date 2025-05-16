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

// Get staff member by employeeId
router.get('/staff/by-employee-id/:employeeId', async (req, res) => {
    try {
        const staff = await Staff.findOne({ employeeId: req.params.employeeId });
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add new staff member
router.post('/staff', async (req, res) => {
    try {
        const newStaff = new Staff(req.body);
        const savedStaff = await newStaff.save();
        res.status(201).json(savedStaff);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;

