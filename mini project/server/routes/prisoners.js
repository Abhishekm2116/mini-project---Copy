const express = require('express');
const router = express.Router();
const Prisoner = require('../models/Prisoner');
const Prison = require('../models/Prison');

// Get all prisoners
router.get('/', async (req, res) => {
    try {
        const prisoners = await Prisoner.find().populate('prisonId');
        res.json(prisoners);
    } catch (err) {
        console.error('Error fetching prisoners:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get single prisoner
router.get('/:id', async (req, res) => {
    try {
        const prisoner = await Prisoner.findById(req.params.id).populate('prisonId');
        if (!prisoner) {
            return res.status(404).json({ message: 'Prisoner not found' });
        }
        res.json(prisoner);
    } catch (err) {
        console.error('Error fetching prisoner:', err);
        res.status(500).json({ message: err.message });
    }
});

// Add new prisoner
router.post('/', async (req, res) => {
    try {
        // Find the first available prison
        const prison = await Prison.findOne();
        if (!prison) {
            return res.status(400).json({ message: 'No prison found' });
        }

        // Build prisoner data
        const prisonerData = {
            ...req.body,
            prisonId: prison._id
        };

        const newPrisoner = new Prisoner(prisonerData);
        const savedPrisoner = await newPrisoner.save();
        
        // Update prison population
        prison.currentPopulation += 1;
        await prison.save();

        res.status(201).json(savedPrisoner);
    } catch (error) {
        console.error('Error adding prisoner:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update prisoner
router.put('/:id', async (req, res) => {
    try {
        const prisoner = await Prisoner.findById(req.params.id);
        if (!prisoner) {
            return res.status(404).json({ message: 'Prisoner not found' });
        }

        // Update prisoner fields
        Object.keys(req.body).forEach(key => {
            prisoner[key] = req.body[key];
        });

        const updatedPrisoner = await prisoner.save();
        res.json(updatedPrisoner);
    } catch (error) {
        console.error('Error updating prisoner:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete prisoner
router.delete('/:id', async (req, res) => {
    try {
        const prisoner = await Prisoner.findById(req.params.id);
        if (!prisoner) {
            return res.status(404).json({ message: 'Prisoner not found' });
        }

        // Update prison population
        const prison = await Prison.findById(prisoner.prisonId);
        if (prison) {
            prison.currentPopulation = Math.max(0, prison.currentPopulation - 1);
            await prison.save();
        }

        await prisoner.deleteOne();
        res.json({ message: 'Prisoner deleted successfully' });
    } catch (error) {
        console.error('Error deleting prisoner:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 