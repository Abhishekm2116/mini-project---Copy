const express = require('express');
const router = express.Router();
const Prison = require('../models/Prison');
const Prisoner = require('../models/Prisoner');
const Staff = require('../models/Staff');
const Visit = require('../models/Visit');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Prison routes
router.get('/prisons', async (req, res) => {
    try {
        console.log('Fetching prisons...');
        const prisons = await Prison.find();
        console.log('Found prisons:', prisons);
        res.json(prisons);
    } catch (err) {
        console.error('Error fetching prisons:', err);
        res.status(500).json({ message: err.message });
    }
});

// Prisoner routes
router.get('/prisoners', async (req, res) => {
    try {
        console.log('Fetching prisoners...');
        const prisoners = await Prisoner.find().populate('prisonId');
        console.log('Found prisoners:', prisoners);
        res.json(prisoners);
    } catch (err) {
        console.error('Error fetching prisoners:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get single prisoner
router.get('/prisoners/:id', async (req, res) => {
    try {
        console.log('Fetching prisoner:', req.params.id);
        const prisoner = await Prisoner.findById(req.params.id);
        
        if (!prisoner) {
            console.log('Prisoner not found');
            return res.status(404).json({ message: 'Prisoner not found' });
        }

        console.log('Found prisoner:', prisoner);
        res.json(prisoner);
    } catch (error) {
        console.error('Error fetching prisoner:', error);
        res.status(500).json({ message: error.message });
    }
});

// Staff routes
router.get('/staff', async (req, res) => {
    try {
        console.log('Fetching staff...');
        const staff = await Staff.find();
        console.log('Raw staff data:', JSON.stringify(staff, null, 2));
        
        // Populate prison data
        const populatedStaff = await Staff.find().populate('prisonId');
        console.log('Populated staff data:', JSON.stringify(populatedStaff, null, 2));
        
        res.json(populatedStaff);
    } catch (err) {
        console.error('Error fetching staff:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get single staff member
router.get('/staff/:id', async (req, res) => {
    try {
        console.log('Fetching staff member:', req.params.id);
        const staff = await Staff.findById(req.params.id);
        
        if (!staff) {
            console.log('Staff member not found');
            return res.status(404).json({ message: 'Staff member not found' });
        }

        console.log('Found staff member:', staff);
        res.json(staff);
    } catch (error) {
        console.error('Error fetching staff member:', error);
        res.status(500).json({ message: error.message });
    }
});

// Visit routes
router.get('/visits', async (req, res) => {
    try {
        console.log('Fetching visits...');
        const visits = await Visit.find().populate('prisonerId');
        console.log('Found visits:', visits);
        res.json(visits);
    } catch (err) {
        console.error('Error fetching visits:', err);
        res.status(500).json({ message: err.message });
    }
});

// Add new staff member
router.post('/staff', [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('role').isIn([
        'Correctional Officer',
        'Medical Staff',
        'Psychologist',
        'Social Worker',
        'Administrator',
        'Security Officer',
        'Counselor'
    ]).withMessage('Valid role is required'),
    body('hireDate').isDate().withMessage('Valid hire date is required'),
    body('department').optional(),
    body('employeeId').optional(),
    body('employmentType').optional().isIn(['full_time', 'part_time', 'contract', 'temporary']),
    body('salary').optional().isNumeric(),
    body('education').optional().isIn(['high_school', 'associate', 'bachelor', 'master', 'doctorate']),
    body('certifications').optional(),
    body('emergencyContact').optional(),
    body('notes').optional(),
    body('specialRequirements').optional()
], async (req, res) => {
    console.log('Received staff data:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Find the first available prison
        const prison = await Prison.findOne();
        console.log('Found prison:', prison);
        
        if (!prison) {
            console.log('No prison found');
            return res.status(400).json({ message: 'No prison found' });
        }

        // Create new staff member with prison ID
        const staffData = {
            ...req.body,
            prisonId: prison._id
        };
        console.log('Creating staff with data:', JSON.stringify(staffData, null, 2));

        const newStaff = new Staff(staffData);
        const savedStaff = await newStaff.save();
        
        console.log('New staff member added:', JSON.stringify(savedStaff, null, 2));
        res.status(201).json(savedStaff);
    } catch (error) {
        console.error('Error adding staff member:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete staff member
router.delete('/staff/:id', async (req, res) => {
    try {
        console.log('DELETE /staff/:id - Request received');
        console.log('Request params:', req.params);
        console.log('Request headers:', req.headers);
        
        const staffId = req.params.id;
        console.log('Staff ID to delete:', staffId);
        console.log('ID type:', typeof staffId);
        console.log('ID length:', staffId.length);
        
        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(staffId)) {
            console.log('Invalid staff ID format:', staffId);
            return res.status(400).json({ 
                message: 'Invalid staff ID format',
                details: {
                    id: staffId,
                    type: typeof staffId,
                    length: staffId.length
                }
            });
        }

        console.log('Looking for staff member with ID:', staffId);
        const staff = await Staff.findById(staffId);
        
        if (!staff) {
            console.log('Staff member not found with ID:', staffId);
            // Try to find any staff member to verify database connection
            const anyStaff = await Staff.findOne();
            console.log('Any staff member found:', anyStaff ? 'Yes' : 'No');
            return res.status(404).json({ 
                message: 'Staff member not found',
                details: {
                    id: staffId,
                    databaseConnected: !!anyStaff
                }
            });
        }

        console.log('Found staff member:', staff);
        const deleteResult = await Staff.deleteOne({ _id: staffId });
        console.log('Delete result:', deleteResult);
        
        if (deleteResult.deletedCount === 0) {
            console.log('No staff member was deleted');
            return res.status(404).json({ message: 'No staff member was deleted' });
        }

        console.log('Staff member deleted successfully');
        res.json({ 
            message: 'Staff member deleted successfully',
            details: {
                id: staffId,
                deletedCount: deleteResult.deletedCount
            }
        });
    } catch (error) {
        console.error('Error deleting staff member:', error);
        res.status(500).json({ 
            message: error.message,
            details: {
                name: error.name,
                stack: error.stack
            }
        });
    }
});

// Update staff member
router.put('/staff/:id', [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('role').isIn([
        'Correctional Officer',
        'Medical Staff',
        'Psychologist',
        'Social Worker',
        'Administrator',
        'Security Officer',
        'Counselor'
    ]).withMessage('Valid role is required'),
    body('department').optional(),
    body('employeeId').optional(),
    body('employmentType').optional().isIn(['full_time', 'part_time', 'contract', 'temporary']),
    body('salary').optional().isNumeric(),
    body('education').optional().isIn(['high_school', 'associate', 'bachelor', 'master', 'doctorate']),
    body('certifications').optional(),
    body('emergencyContact').optional(),
    body('notes').optional(),
    body('specialRequirements').optional()
], async (req, res) => {
    console.log('Updating staff member:', req.params.id);
    console.log('Update data:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            console.log('Staff member not found');
            return res.status(404).json({ message: 'Staff member not found' });
        }

        // Update staff member
        const updatedStaff = await Staff.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('prisonId');

        console.log('Updated staff member:', updatedStaff);
        res.json(updatedStaff);
    } catch (error) {
        console.error('Error updating staff member:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update prisoner
router.put('/prisoners/:id', [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('age').isInt({ min: 0 }).withMessage('Valid age is required'),
    body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
    body('cellNumber').notEmpty().withMessage('Cell number is required'),
    body('crime').notEmpty().withMessage('Crime is required'),
    body('sentence').notEmpty().withMessage('Sentence is required'),
    body('severity').isIn(['high', 'medium', 'low']).withMessage('Valid severity is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const prisoner = await Prisoner.findById(req.params.id);
        if (!prisoner) {
            return res.status(404).json({ message: 'Prisoner not found' });
        }

        // Update prisoner
        const updatedPrisoner = await Prisoner.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.json(updatedPrisoner);
    } catch (error) {
        console.error('Error updating prisoner:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/welcome', (req, res) => {
    console.log(`Request received: ${req.method} ${req.path}`);
    res.json({ message: 'Welcome to the Prison Management API Service!' });
});

module.exports = router;
