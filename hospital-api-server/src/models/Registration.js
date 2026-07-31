const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  caseType: { 
    type: String, 
    enum: ['new', 'old'], 
    required: true 
  },
  name: { 
    type: String, 
    required: function () { return this.caseType === 'new'; } 
  },
  villageName: { 
    type: String, 
    required: function () { return this.caseType === 'new'; } 
  },
  phoneNumber: { 
    type: String, 
    required: true, 
    index: true 
  },
  caseNumber: { 
    type: String, 
    required: function () { return this.caseType === 'old'; } 
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
