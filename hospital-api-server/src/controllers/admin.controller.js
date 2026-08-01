const jwt = require('jsonwebtoken');
const QueueToken = require('../models/QueueToken');
const Registration = require('../models/Registration');
const env = require('../config/env');
const { getRegistrationWindowId } = require('../middleware/validateRegistrationWindow');

const login = (req, res) => {
  const { pin } = req.body;
  // Simple hardcoded PIN for MVP
  if (pin === '1234') {
    const token = jwt.sign({ role: 'admin' }, env.ADMIN_JWT_SECRET, { expiresIn: '8h' });
    return res.status(200).json({ token });
  }
  return res.status(401).json({ error: 'Invalid PIN' });
};

const getLiveQueue = async (req, res) => {
  try {
    const windowId = getRegistrationWindowId();
    const tokens = await QueueToken.find({ 
      registrationWindowId: windowId,
      status: { $in: ['active', 'grace_period', 'called', 'in_consultation'] }
    })
    .sort({ tokenNumber: 1 })
    .populate({
      path: 'registrationId',
      populate: { path: 'patientId' }
    });
    
    res.status(200).json({ queue: tokens });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateTokenStatus = async (tokenId, newStatus, req, res) => {
    try {
        const token = await QueueToken.findById(tokenId);
        if (!token) return res.status(404).json({ error: 'Token not found' });
        
        token.status = newStatus;
        if (newStatus === 'called') token.calledAt = new Date();
        if (newStatus === 'completed') {
            token.completedAt = new Date();
            // update registration
            await Registration.findByIdAndUpdate(token.registrationId, { status: 'completed' });
        }
        
        await token.save();
        
        if (req.io) {
            req.io.to('admin').emit('queue:updated', { tokenId, status: newStatus });
            req.io.to(`patient:${token.registrationId}`).emit(`token:${newStatus}`, { tokenNumber: token.tokenNumber });
        }
        
        res.status(200).json({ message: `Token marked as ${newStatus}`, token });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const callNext = async (req, res) => {
    const { tokenId } = req.params;
    let targetTokenId = tokenId;
    
    if (!targetTokenId || targetTokenId === 'next') {
        const windowId = getRegistrationWindowId();
        const nextToken = await QueueToken.findOne({
            registrationWindowId: windowId,
            status: 'active'
        }).sort({ tokenNumber: 1 });
        
        if (!nextToken) {
             return res.status(404).json({ error: 'No active tokens in queue' });
        }
        targetTokenId = nextToken._id;
    }
    
    return updateTokenStatus(targetTokenId, 'called', req, res);
};

const skipToken = async (req, res) => {
    return updateTokenStatus(req.params.tokenId, 'skipped', req, res);
};

const completeToken = async (req, res) => {
    return updateTokenStatus(req.params.tokenId, 'completed', req, res);
};

// Registrations Management
const Patient = require('../models/Patient');

const getRegistrations = async (req, res) => {
    try {
        const { search, type, status, window } = req.query;
        
        // 1. If there is search or type filtering, find matching patients first
        let patientQuery = {};
        if (type) patientQuery.caseType = type;
        if (search) {
            patientQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
                { caseNumber: { $regex: search, $options: 'i' } }
            ];
        }

        let patientIds = null;
        if (Object.keys(patientQuery).length > 0) {
            const patients = await Patient.find(patientQuery).select('_id');
            patientIds = patients.map(p => p._id);
        }

        // 2. Query Registrations
        let regQuery = {};
        const targetWindow = window || getRegistrationWindowId();
        regQuery.registrationWindowId = targetWindow;
        if (status) regQuery.status = status;
        if (patientIds !== null) {
            regQuery.patientId = { $in: patientIds };
        }
        
        const registrations = await Registration.find(regQuery)
            .populate('patientId')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ registrations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const registration = await Registration.findById(id);
        if (!registration) return res.status(404).json({ error: 'Registration not found' });

        // Update Patient fields
        const patientAllowedFields = ['name', 'villageName', 'phoneNumber', 'caseNumber'];
        const patientUpdates = {};
        Object.keys(updates).forEach(k => {
            if (patientAllowedFields.includes(k)) patientUpdates[k] = updates[k];
        });

        if (Object.keys(patientUpdates).length > 0) {
            await Patient.findByIdAndUpdate(registration.patientId, patientUpdates);
        }

        // Update Registration fields
        if (updates.status) {
            registration.status = updates.status;
            await registration.save();
        }
        
        const updatedReg = await Registration.findById(id).populate('patientId');
        res.status(200).json({ registration: updatedReg });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteRegistration = async (req, res) => {
    try {
        await Registration.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch(err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { 
    login, getLiveQueue, callNext, skipToken, completeToken,
    getRegistrations, updateRegistration, deleteRegistration 
};
