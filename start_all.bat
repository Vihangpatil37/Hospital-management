@echo off
echo ==============================================
echo   Starting Hospital Management Project...
echo ==============================================

echo [1/3] Starting Hospital API Server...
start "Hospital API Server" cmd /k "cd hospital-api-server && node src/server.js"

echo [2/3] Starting Hospital Patient App (Port 3000)...
start "Hospital Patient App" cmd /k "cd hospital-patient-app && npm run dev -- -p 3000"

echo [3/3] Starting Hospital Admin App (Port 3001)...
start "Hospital Admin App" cmd /k "cd hospital-admin-app && npm run dev -- -p 3001"

echo.
echo All services have been launched in separate windows!
echo.
echo URLs:
echo - API Server: http://localhost:4000
echo - Patient App: http://localhost:3000
echo - Admin App: http://localhost:3001
echo.
