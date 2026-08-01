const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const Registration = require('./src/models/Registration');
const env = require('./src/config/env');

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Read excel file
    const filePath = path.join(__dirname, '..', 'sample_dataset_500_rows.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log(`Found ${data.length} rows in the excel file.`);

    const registrationsToInsert = [];

    for (const row of data) {
      // Sometimes phone numbers are numbers, convert to string
      const phoneNumber = row['Phone No.'] ? String(row['Phone No.']) : '';
      
      const registration = {
        caseType: 'new', // Assuming these are new registrations for the sake of the dataset
        name: row['Name'] || 'Unknown',
        villageName: row['Village Name'] || 'Unknown',
        phoneNumber: phoneNumber,
        registrationWindowId: 'WIN1', // Dummy window ID
        status: 'registered',
        createdAt: new Date()
      };
      
      // If the case ID is present, we could optionally map it or just leave as is.
      // Schema says caseNumber is required if caseType is old. 
      // If we want to simulate old cases, we could do:
      // caseType: 'old', caseNumber: row['Case ID']
      // Let's mix them or just use new?
      // Since Name and Village Name are present, which are required for 'new' cases, let's just make them all 'new'.
      
      registrationsToInsert.push(registration);
    }

    // Clear existing data? Optionally. Let's just insert.
    await Registration.insertMany(registrationsToInsert);
    console.log(`Successfully seeded ${registrationsToInsert.length} registrations!`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
