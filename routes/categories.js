const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Thread = require('../models/Thread');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    
    // Get thread count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const threadCount = await Thread.countDocuments({ category: category._id });
        return {
          ...category.toObject(),
          threadCount
        };
      })
    );

    res.json(categoriesWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const threadCount = await Thread.countDocuments({ category: category._id });
    
    res.json({
      ...category.toObject(),
      threadCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create category (Admin only)
router.post('/', requireAuth, requireAdmin, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be 1-50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, color } = req.body;

    // Check if category exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}// package.json
{
  "name": "online-forum-backend",
  "version": "1.0.0",
  "description": "Backend for online discussion forum",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.0.1",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "express-rate-limit": "^6.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": [
    "forum",
    "discussion",
    "nodejs",
    "express",
    "mongodb"
  ],
  "author": "Your Name",
  "license": "MIT"
    }