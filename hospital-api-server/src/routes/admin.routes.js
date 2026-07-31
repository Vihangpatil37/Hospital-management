const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const env = require('../config/env');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  jwt.verify(token, env.ADMIN_JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.admin = decoded;
    next();
  });
};

router.post('/login', adminController.login);

router.use(authMiddleware);

router.get('/queue/live', adminController.getLiveQueue);
router.post('/queue/:tokenId/call-next', adminController.callNext);
router.post('/queue/:tokenId/skip', adminController.skipToken);
router.post('/queue/:tokenId/complete', adminController.completeToken);

router.get('/registrations', adminController.getRegistrations);
router.patch('/registrations/:id', adminController.updateRegistration);
router.delete('/registrations/:id', adminController.deleteRegistration);

module.exports = router;
