const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Thread = require('../models/Thread');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user stats
    const threadCount = await Thread.countDocuments({ author: user._id });
    const replyCount = await Thread.aggregate([
      { $unwind: '$replies' },
      { $match: { 'replies.author': user._id } },
      { $count: 'total' }
    ]);

    res.json({
      user,
      stats: {
        threadCount,
        replyCount: replyCount[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user stats
    const threadCount = await Thread.countDocuments({ author: user._id });
    const threads = await Thread.find({ author: user._id })
      .populate('category', 'name color')
      .populate('tags', 'name color')
      .sort({ createdAt: -1 })
      .limit(5);

    const replyCount = await Thread.aggregate([
      { $unwind: '$replies' },
      { $match: { 'replies.author': user._id } },
      { $count: 'total' }
    ]);

    res.json({
      user,
      stats: {
        threadCount,
        replyCount: replyCount[0]?.total || 0
      },
      recentThreads: threads
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', requireAuth, [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, bio, avatar } = req.body;
    const updates = {};

    if (username && username !== req.user.username) {
      // Check if username is taken
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      updates.username = username;
    }

    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (Admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role (Admin only)
router.put('/:id/role', requireAuth, requireAdmin, [
  body('role')
    .isIn(['user', 'moderator', 'admin'])
    .withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Ban/Unban user (Admin only)
router.put('/:id/status', requireAuth, requireAdmin, [
  body('isActive')
    .isBoolean()
    .withMessage('Status must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: `User ${isActive ? 'activated' : 'banned'} successfully`, 
      user 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;