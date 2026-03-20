'use strict';

const express = require('express');
const { requireChild } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// POST /api/uploads/proof — upload a chore proof photo
router.post('/proof', requireChild, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the URL path that Express will serve
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
