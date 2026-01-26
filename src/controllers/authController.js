const User = require('../models/User');

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide name, email, and password'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        // Generate token
        const token = user.generateAuthToken();

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error during registration'
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password'
            });
        }

        // Find user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Generate token
        const token = user.generateAuthToken();

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    preferredLanguage: user.preferredLanguage
                },
                token
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error during login'
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error'
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, preferredLanguage } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, preferredLanguage },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('UpdateProfile Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error'
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
    res.status(200).json({
        success: true,
        data: {},
        message: 'Logged out successfully'
    });
};