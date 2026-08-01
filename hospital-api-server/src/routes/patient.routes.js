const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');

router.get('/', patientController.searchPatients);
router.get('/stats', patientController.getPatientStats);
router.get('/:id', patientController.getPatientById);
router.patch('/:id', patientController.updatePatient);
router.post('/:id/register-again', patientController.registerAgain);

module.exports = router;
