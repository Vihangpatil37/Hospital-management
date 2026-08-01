# 🏥 NextGen Hospital OPD Queue & Registration System

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Express.js-Backend-404D59?style=for-the-badge" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.io-Real--Time-white?style=for-the-badge&logo=socket.io" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind" />
</div>

<br />

A state-of-the-art, geofenced real-time registration and queue management ecosystem tailored for modern hospital Outpatient Departments (OPD). Engineered for mobile-first usage, ensuring both patients and hospital staff have seamless, real-time sync capabilities.

---

## ✨ Key Features

- **📍 Strict Geofencing Validation**: Patients can only check-in and generate queue tokens when they are physically within a `70m` radius of the hospital (powered by Haversine distance calculations).
- **⏱️ Automated Grace Period Management**: If a patient steps outside the hospital perimeter, their token enters a "grace period". A Node cron job automatically revokes the token if they fail to return within `3` minutes.
- **⚡ Real-Time Socket Operations**: No polling. Live queue board updates instantaneously across all admin and patient interfaces via Socket.IO.
- **🔒 Secure Admin Dashboard**: Staff portal protected by a robust PIN-based JWT authentication system.
- **🕒 Time-Restricted Registration**: System programmatically enforces registration windows (e.g., Saturday 06:00 to Sunday 06:00).
- **📱 Ultra-Responsive UX**: Minimalist, high-contrast UI designed specifically for smartphone legibility under direct sunlight.

---

## 🏗️ System Architecture

The ecosystem operates on a microservices-inspired monorepo structure consisting of three primary nodes:

### 1. Backend Server (`hospital-api-server`)
- **Core**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Real-time Engine**: Socket.IO
- **Background Tasks**: `node-cron`
- **Role**: Serves as the central nervous system. Manages REST endpoints, calculates geo-validations, orchestrates live queue states, and enforces cron-based token expiries.

### 2. Patient Portal (`hospital-patient-app`)
- **Core**: Next.js 15, React 19
- **Styling**: Tailwind CSS
- **Role**: Client-facing progressive web app. Requests continuous `watchPosition` telemetry from the browser, handles new/old patient onboarding, and renders live queue placement.

### 3. Staff Dashboard (`hospital-admin-app`)
- **Core**: Next.js 15, React 19
- **Styling**: Tailwind CSS
- **Role**: Secure command center. Allows hospital staff to cycle patients (`Call Next`, `Skip`, `Complete`) and monitor overall OPD throughput in real-time.

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A running instance of [MongoDB](https://www.mongodb.com/) (Atlas Free Tier is recommended)

---

## 🚀 Quick Start (Windows)

For developers on Windows machines, a streamlined bootstrapping script is provided.

1. Clone the repository and ensure your `.env` files are configured (see [Environment Variables](#-environment-variables)).
2. From the project root, execute:
   ```cmd
   .\start_all.bat
   ```
This batch script will automatically spawn three dedicated terminals and bind to:
- **API**: `http://localhost:4000`
- **Patient UI**: `http://localhost:3000`
- **Admin UI**: `http://localhost:3001`

---

## 🛠️ Manual Installation (Cross-Platform)

If you prefer granular control or are on macOS/Linux, follow these steps:

### 1. Initialize Backend API
```bash
cd hospital-api-server
npm install
npm start
```

### 2. Initialize Patient Frontend
```bash
cd hospital-patient-app
npm install
npm run dev
```

### 3. Initialize Admin Frontend
```bash
cd hospital-admin-app
npm install
npm run dev
```

---

## 🔐 Environment Variables

You must create a `.env` file in the **`hospital-api-server`** directory based on the `.env.example` template:

```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hospital

# Server Configuration
PORT=4000
JWT_SECRET=your_super_secret_jwt_key

# Geolocation Constraints
HOSPITAL_LAT=19.123456
HOSPITAL_LNG=72.123456
GEOFENCE_RADIUS_METERS=70
GRACE_PERIOD_MINUTES=3
```

*Note: The frontend applications (`.env.local`) are pre-configured to point to `http://localhost:4000` for development.*

---

## 🚢 Deployment Strategy

For production workloads, careful consideration must be given to the real-time constraints:

- **Database**: **MongoDB Atlas** (Serverless or Dedicated).
- **Backend API**: We strongly recommend deploying on **Railway**, **Render**, or **Fly.io**. 
  > ⚠️ **Warning**: Deploying the backend to Vercel/Netlify serverless environments is not supported as they cannot maintain the persistent TCP connections required by Socket.IO, nor can they reliably run continuous `node-cron` daemon processes.
- **Frontends (Patient/Admin)**: Both Next.js applications are highly optimized for edge deployment on **Vercel**.

---

## 🤝 Contributing

We welcome contributions to make this ecosystem even more robust.
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.