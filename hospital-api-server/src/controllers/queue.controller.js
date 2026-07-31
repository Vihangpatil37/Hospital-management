const Registration = require('../models/Registration');
const QueueToken = require('../models/QueueToken');
const Counter = require('../models/Counter');
const { haversineDistance } = require('../utils/haversine');
const env = require('../config/env');

const checkin = async (req, res) => {
  try {
    const { registrationId, lat, lng } = req.body;
    
    if (!registrationId || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'registrationId, lat, and lng are required' });
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Check geofence
    const distance = haversineDistance(lat, lng, env.HOSPITAL_LAT, env.HOSPITAL_LNG);
    if (distance > env.GEOFENCE_RADIUS_METERS) {
      return res.status(409).json({ 
        error: 'You are outside the hospital premises.', 
        distance: Math.round(distance) 
      });
    }

    // Check if already checked in and has an active token
    let token = await QueueToken.findOne({ 
      registrationId, 
      status: { $in: ['active', 'grace_period', 'called', 'in_consultation'] }
    });

    if (!token) {
        // Generate new token number using Counter
        const counter = await Counter.findOneAndUpdate(
            { registrationWindowId: registration.registrationWindowId },
            { $inc: { sequence: 1 } },
            { new: true, upsert: true }
        );

        token = new QueueToken({
            registrationId,
            tokenNumber: counter.sequence,
            registrationWindowId: registration.registrationWindowId,
            status: 'active'
        });
        await token.save();
        
        registration.status = 'arrived';
        await registration.save();

        if (req.io) {
            req.io.to('admin').emit('queue:new-token', { token, registration });
        }
    } else {
        // If they already have a token and it was in grace period, restore it
        if (token.status === 'grace_period') {
            token.status = 'active';
            token.geofenceExitAt = null;
            token.lastPingAt = new Date();
            await token.save();
            if (req.io) {
                req.io.to('admin').emit('queue:updated', { tokenId: token._id, status: token.status });
            }
        }
    }

    res.status(200).json({ message: 'Checked in successfully', token });
  } catch (error) {
    console.error('Checkin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const ping = async (req, res) => {
    try {
        const { tokenId, lat, lng } = req.body;
        if (!tokenId || lat === undefined || lng === undefined) {
            return res.status(400).json({ error: 'tokenId, lat, and lng are required' });
        }

        const token = await QueueToken.findById(tokenId);
        if (!token) {
            return res.status(404).json({ error: 'Token not found' });
        }
        
        if (['cancelled', 'completed', 'skipped'].includes(token.status)) {
             return res.status(400).json({ error: 'Token is no longer active', status: token.status });
        }

        const distance = haversineDistance(lat, lng, env.HOSPITAL_LAT, env.HOSPITAL_LNG);
        const insideGeofence = distance <= env.GEOFENCE_RADIUS_METERS;

        if (insideGeofence) {
            token.lastPingAt = new Date();
            if (token.status === 'grace_period') {
                token.status = 'active';
                token.geofenceExitAt = null;
                if (req.io) {
                    req.io.to('admin').emit('queue:updated', { tokenId: token._id, status: token.status });
                }
            }
        } else {
            if (token.geofenceExitAt === null) {
                token.geofenceExitAt = new Date();
                token.status = 'grace_period';
                if (req.io) {
                    req.io.to('admin').emit('queue:updated', { tokenId: token._id, status: token.status });
                }
            }
        }

        await token.save();
        res.status(200).json({ status: token.status, distance: Math.round(distance) });
    } catch (error) {
        console.error('Ping error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getToken = async (req, res) => {
    try {
        const { tokenId } = req.params;
        const token = await QueueToken.findById(tokenId).populate('registrationId');
        if (!token) {
            return res.status(404).json({ error: 'Token not found' });
        }
        
        // Calculate queue position
        const queuePosition = await QueueToken.countDocuments({
            registrationWindowId: token.registrationWindowId,
            tokenNumber: { $lt: token.tokenNumber },
            status: { $in: ['active', 'grace_period'] }
        });

        res.status(200).json({ token, queuePosition });
    } catch(err) {
        console.error('getToken error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { checkin, ping, getToken };
