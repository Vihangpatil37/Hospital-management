require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 4000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-queue',
  CORS_ORIGIN_PATIENT: process.env.CORS_ORIGIN_PATIENT || 'http://localhost:3000',
  CORS_ORIGIN_ADMIN: process.env.CORS_ORIGIN_ADMIN || 'http://localhost:3001',
  GEOFENCE_RADIUS_METERS: parseInt(process.env.GEOFENCE_RADIUS_METERS) || 70,
  GRACE_PERIOD_MINUTES: parseInt(process.env.GRACE_PERIOD_MINUTES) || 3,
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || 'secret',
  HOSPITAL_LAT: parseFloat(process.env.HOSPITAL_LAT) || 12.9716, // Example coord
  HOSPITAL_LNG: parseFloat(process.env.HOSPITAL_LNG) || 77.5946,
  TIMEZONE: process.env.TIMEZONE || 'Asia/Kolkata'
};
