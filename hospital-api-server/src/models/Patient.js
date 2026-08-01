const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
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
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Patient', patientSchema);
