# Hospital Registration & Queue Management System

A comprehensive, real-time three-part system for weekly hospital OPD registration and geofenced queue management. The system is designed to be used entirely on smartphones by both patients and hospital staff.

## Architecture

The project is split into three separate applications:

1. **`hospital-api-server`** (Backend)
   - Express.js, MongoDB (Mongoose), Socket.IO, node-cron
   - Handles API endpoints, live Socket connections for real-time queue updates, geofence radius validations via Haversine distance, and cron jobs for automatic grace-period token cancellations.

2. **`hospital-patient-app`** (Patient Frontend)
   - Next.js 15, TailwindCSS
   - Public-facing app where patients register (New/Old case types).
   - Generates tokens only if the patient is within the 70m geofence radius of the hospital.
   - Pings real-time geolocation via `watchPosition` and displays live token status and queue position updates to the patient.

3. **`hospital-admin-app`** (Admin Frontend)
   - Next.js 15, TailwindCSS
   - Staff-facing dashboard secured via PIN-based JWT login.
   - Features a real-time live queue board updating via Socket.IO.
   - Allows staff to "Call Next", "Skip", or mark consultations as "Complete" seamlessly.
   - Searchable directory of registrations.

## Prerequisites

- Node.js v18+
- MongoDB instance (e.g., MongoDB Atlas Free Tier)

## Setup & Running Locally

### 1. Backend Server (`hospital-api-server`)
```bash
cd hospital-api-server
npm install
```
- Copy `.env.example` to `.env` and provide a valid `MONGODB_URI`.
- You can also adjust coordinates (`HOSPITAL_LAT`, `HOSPITAL_LNG`), geofence radius, and grace period settings in the `.env` file.
```bash
npm start
```
The server will run on `http://localhost:4000`.

### 2. Patient App (`hospital-patient-app`)
```bash
cd hospital-patient-app
npm install
```
- The `.env.local` is already configured to point to `http://localhost:4000` by default.
```bash
npm run dev
```
Runs on `http://localhost:3000`.

### 3. Admin App (`hospital-admin-app`)
```bash
cd hospital-admin-app
npm install
```
- The `.env.local` is already configured to point to `http://localhost:4000` by default.
```bash
npm run dev
```
Runs on `http://localhost:3001` (if 3000 is occupied).

## Features Implemented
- **Time-restricted Registration Windows:** Patients can only register between Saturday 06:00 and Sunday 06:00 (timezone-aware).
- **Geolocation Validation:** Patients must check in within 70m of the hospital to obtain a live queue token.
- **Grace Period Expiry:** If a patient leaves the 70m radius, their token enters a "grace period". If they don't return within 3 minutes, a background cron job cancels their token.
- **Live Socket.IO Board:** Automatic real-time status updates, reducing polling overhead and guaranteeing staff/patients see the same queue simultaneously. 
- **Minimal Aesthetic Design:** Optimized specifically for smartphone displays under sunlight with robust tabular-figure token digits.

## Deployment Notes
- **Databases:** MongoDB Atlas is recommended.
- **Backend:** Railway or Render is highly recommended since Vercel's serverless functions cannot maintain persistent Socket.IO connections or run background `node-cron` intervals.
- **Frontends:** Both `patient-app` and `admin-app` can be deployed easily on Vercel.