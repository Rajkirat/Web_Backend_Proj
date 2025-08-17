const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Thread = require('../models/Threads');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();


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

   
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({ name, description, color });
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
