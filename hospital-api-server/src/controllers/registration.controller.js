const Registration = require('../models/Registration');

const registerPatient = async (req, res) => {
  try {
    const { caseType, name, villageName, phoneNumber, caseNumber } = req.body;
    const registrationWindowId = req.registrationWindowId;

    // Validation
    if (!caseType || !['new', 'old'].includes(caseType)) {
      return res.status(400).json({ error: 'Valid caseType (new/old) is required' });
    }
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) { // Basic 10-digit validation for demo
      return res.status(400).json({ error: 'Valid 10-digit phoneNumber is required' });
    }

    if (caseType === 'new') {
      if (!name || !villageName) {
        return res.status(400).json({ error: 'Name and villageName are required for new cases' });
      }
    } else {
      if (!caseNumber) {
        return res.status(400).json({ error: 'Case number is required for old cases' });
      }
    }

    // Check if phone number is already registered in this window
    const existing = await Registration.findOne({ phoneNumber, registrationWindowId });
    if (existing) {
        return res.status(409).json({ error: 'This phone number is already registered for this week.' });
    }

    const registration = new Registration({
      caseType,
      name,
      villageName,
      phoneNumber,
      caseNumber,
      registrationWindowId
    });

    await registration.save();
    
    // Optionally emit event if io is accessible (we'll emit from routes or a service if needed, for MVP, optional)
    if (req.io) {
        req.io.to('admin').emit('registration:created', { registration });
    }

    res.status(201).json({ message: 'Registration successful', registration });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMyRegistration = async (req, res) => {
    try {
        const { phoneNumber } = req.query;
        // getRegistrationWindowId could be imported or we just find the latest for this phone
        const { getRegistrationWindowId } = require('../middleware/validateRegistrationWindow');
        const registrationWindowId = getRegistrationWindowId();

        if (!phoneNumber) {
            return res.status(400).json({ error: 'phoneNumber is required' });
        }

        const registration = await Registration.findOne({ phoneNumber, registrationWindowId });
        if (!registration) {
            return res.status(404).json({ error: 'No active registration found for this window' });
        }

        res.status(200).json({ registration });
    } catch(err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { registerPatient, getMyRegistration };
