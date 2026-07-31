const mongoose = require('mongoose');

const queueTokenSchema = new mongoose.Schema({
  registrationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Registration', 
    required: true 
  },
  tokenNumber: { 
    type: Number, 
    required: true 
  },
  registrationWindowId: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: ['active', 'grace_period', 'cancelled', 'called', 'in_consultation', 'completed', 'skipped'],
    default: 'active'
  },
  lastPingAt: { 
    type: Date, 
    default: Date.now 
  },
  geofenceExitAt: { 
    type: Date, 
    default: null 
  },
  calledAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QueueToken', queueTokenSchema);
