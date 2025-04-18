const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        req.session.user = {
            id: user._id,
            email: user.email,
            role: user.role
        };

        res.json({ 
            success: true,
            redirectUrl: '/dashboard'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already exists' 
            });
        }

        user = new User({
            email,
            password,
            role: role || 'student'
        });

        await user.save();

        // Auto-login after signup
        req.session.user = {
            id: user._id,
            email: user.email,
            role: user.role
        };

        res.json({ 
            success: true,
            redirectUrl: '/dashboard'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});


module.exports = router;
