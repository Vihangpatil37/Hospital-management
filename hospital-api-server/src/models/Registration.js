const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  registrationWindowId: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: ['registered', 'arrived', 'in_queue', 'in_consultation', 'completed', 'cancelled'],
    default: 'registered'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Registration', registrationSchema);
