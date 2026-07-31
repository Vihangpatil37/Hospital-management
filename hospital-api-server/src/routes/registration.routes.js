const express = require('express');
const router = express.Router();
const { registerPatient, getMyRegistration } = require('../controllers/registration.controller');
const { validateRegistrationWindow } = require('../middleware/validateRegistrationWindow');

// Make IO accessible in req if we mount it, but we can also attach in app.js
router.post('/', validateRegistrationWindow, registerPatient);
router.get('/me', getMyRegistration);

module.exports = router;
