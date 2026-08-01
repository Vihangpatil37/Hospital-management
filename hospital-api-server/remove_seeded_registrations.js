const mongoose = require('mongoose');
const env = require('./src/config/env');

async function removeSeeded() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('MongoDB connected.');

    const db = mongoose.connection.db;
    const registrationsCol = db.collection('registrations');

    // Remove all registrations that were part of the initial seed (WIN1)
    const result = await registrationsCol.deleteMany({ registrationWindowId: 'WIN1' });

    console.log(`Successfully removed ${result.deletedCount} seeded registrations from the Registration collection.`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to remove seeded registrations:', error);
    process.exit(1);
  }
}

removeSeeded();
