function requireParent(req, res, next) {
  if (!req.session.parentId) {
    return res.status(401).json({ error: 'Parent authentication required' });
  }
  next();
}

function requireChild(req, res, next) {
  if (!req.session.kidId) {
    return res.status(401).json({ error: 'Child authentication required' });
  }
  next();
}

module.exports = { requireParent, requireChild };
