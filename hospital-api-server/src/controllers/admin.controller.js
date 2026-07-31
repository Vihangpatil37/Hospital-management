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
    .populate('registrationId');
    
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
const getRegistrations = async (req, res) => {
    try {
        const { search, type, status, window } = req.query;
        let query = {};
        
        if (window) query.registrationWindowId = window;
        if (type) query.caseType = type;
        if (status) query.status = status;
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
                { caseNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        const registrations = await Registration.find(query).sort({ createdAt: -1 });
        res.status(200).json({ registrations });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // whitelist fields
        const allowedFields = ['name', 'villageName', 'phoneNumber', 'caseNumber', 'status'];
        const safeUpdates = {};
        Object.keys(updates).forEach(k => {
            if (allowedFields.includes(k)) safeUpdates[k] = updates[k];
        });
        
        const registration = await Registration.findByIdAndUpdate(id, safeUpdates, { new: true });
        res.status(200).json({ registration });
    } catch(err) {
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
