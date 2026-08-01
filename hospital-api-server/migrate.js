const mongoose = require('mongoose');
const env = require('./src/config/env');

async function runMigration() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('MongoDB connected for migration');

    const db = mongoose.connection.db;
    const registrationsCol = db.collection('registrations');
    const patientsCol = db.collection('patients');

    const allRegistrations = await registrationsCol.find({}).toArray();
    console.log(`Found ${allRegistrations.length} registrations to migrate.`);

    let migratedCount = 0;
    for (const reg of allRegistrations) {
      // Check if it's already migrated (has patientId)
      if (reg.patientId) continue;

      // Check if patient already exists by phone number
      let patient = await patientsCol.findOne({ phoneNumber: reg.phoneNumber });
      
      if (!patient) {
        // Create new patient
        const newPatient = {
          _id: new mongoose.Types.ObjectId(),
          caseType: reg.caseType || 'new',
          name: reg.name,
          villageName: reg.villageName,
          phoneNumber: reg.phoneNumber,
          caseNumber: reg.caseNumber,
          createdAt: reg.createdAt || new Date()
        };
        await patientsCol.insertOne(newPatient);
        patient = newPatient;
      }

      // Update registration
      await registrationsCol.updateOne(
        { _id: reg._id },
        { 
          $set: { patientId: patient._id },
          $unset: { caseType: "", name: "", villageName: "", phoneNumber: "", caseNumber: "" }
        }
      );
      migratedCount++;
    }

    console.log(`Successfully migrated ${migratedCount} registrations.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
