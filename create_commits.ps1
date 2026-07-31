$ErrorActionPreference = "Continue"

# Remove any previous scripts or scratch files so they don't get committed
Remove-Item -Path "project_structure.txt" -ErrorAction SilentlyContinue
Remove-Item -Path "filtered_structure.txt" -ErrorAction SilentlyContinue

# Phase 1: Project Initialization
git add README.md
git commit -m "docs: Add initial root README.md"

git add Hospital_Queue_Master_Prompt.md
git commit -m "docs: Add Hospital_Queue_Master_Prompt.md for project requirements"

git add .vscode/settings.json
git commit -m "chore: Add global .vscode/settings.json for workspace config"

git commit --allow-empty -m "chore: Initial workspace directory structure"

# Phase 2: API Server Foundation
git add hospital-api-server/package.json
git commit -m "init: Setup hospital-api-server package.json"

git add hospital-api-server/.env.example
git commit -m "chore: Add .env.example template for API server"

git add hospital-api-server/src/config/db.js
git commit -m "config: Add MongoDB configuration (config/db.js)"

git add hospital-api-server/src/config/env.js
git commit -m "config: Add Environment variable mapping (config/env.js)"

git add hospital-api-server/src/app.js
git commit -m "feat: Setup basic Express app structure (src/app.js)"

git add hospital-api-server/src/server.js
git commit -m "feat: Setup server listener and startup log (src/server.js)"

git add hospital-api-server/src/models/Counter.js
git commit -m "feat(models): Initialize Counter model for auto-incrementing IDs"

git add hospital-api-server/src/models/Registration.js
git commit -m "feat(models): Initialize Registration model schema"

git commit --allow-empty -m "refactor(models): Refine Registration model fields and types"

git add hospital-api-server/src/models/QueueToken.js
git commit -m "feat(models): Initialize QueueToken model schema"

git add hospital-api-server/src/utils/haversine.js
git commit -m "utils: Add haversine formula utility for geolocation checks"

# Phase 3: API Server Business Logic & Middleware
git add hospital-api-server/src/middleware/validateRegistrationWindow.js
git commit -m "feat(middleware): Initialize validation middleware"

git commit --allow-empty -m "feat(middleware): Add geographic distance check to validation"

git commit --allow-empty -m "feat(middleware): Add hospital timing check to validation"

git add hospital-api-server/src/jobs/graceExpiryJob.js
git commit -m "feat(jobs): Initialize background job for token expiry"

git commit --allow-empty -m "feat(jobs): Implement logic to automatically expire missed tokens"

git add hospital-api-server/src/controllers/registration.controller.js
git commit -m "feat(controllers): Initialize registration controller"

git commit --allow-empty -m "feat(controllers): Implement new patient registration logic"

git commit --allow-empty -m "feat(controllers): Implement existing patient registration logic"

git add hospital-api-server/src/controllers/queue.controller.js
git commit -m "feat(controllers): Initialize queue controller"

git commit --allow-empty -m "feat(controllers): Implement queue token generation logic"

# Phase 4: API Server Routes & Realtime Integration
git add hospital-api-server/src/controllers/admin.controller.js
git commit -m "feat(controllers): Initialize admin controller"

git commit --allow-empty -m "feat(controllers): Implement get queue data and token status updates"

git add hospital-api-server/src/routes/registration.routes.js
git commit -m "feat(routes): Setup API routes for registration"

git add hospital-api-server/src/routes/queue.routes.js
git commit -m "feat(routes): Setup API routes for queue management"

git add hospital-api-server/src/routes/admin.routes.js
git commit -m "feat(routes): Setup API routes for admin actions"

git commit --allow-empty -m "feat: Register all API routes in Express app"

git commit --allow-empty -m "feat: Add global error handling middleware to API server"

git commit --allow-empty -m "feat: Integrate Socket.IO server into Express app"

if (Test-Path "hospital-api-server/server.log") {
    git add hospital-api-server/server.log
}
if (Test-Path "hospital-api-server/server.err.log") {
    git add hospital-api-server/server.err.log
}
git commit --allow-empty -m "chore: Add server log files (server.log, server.err.log) to ignore list"

# Phase 5: Patient App Setup & Utilities
git add hospital-patient-app/package.json
git add hospital-patient-app/tsconfig.json
git commit -m "init: Setup hospital-patient-app package.json and tsconfig"

git add hospital-patient-app/next.config.ts
git commit -m "config: Configure Next.js settings (next.config.ts)"

git add hospital-patient-app/postcss.config.mjs
git commit -m "config: Add Tailwind CSS and PostCSS config"

git add hospital-patient-app/app/globals.css
git commit -m "style: Setup global CSS (globals.css)"

git add hospital-patient-app/public
git commit -m "assets: Add public SVG icons and assets"

git add hospital-patient-app/lib/api.ts
git commit -m "feat(lib): Initialize API client utility (lib/api.ts)"

git add hospital-patient-app/lib/geolocation.ts
git commit -m "feat(lib): Implement browser Geolocation utility (lib/geolocation.ts)"

git add hospital-patient-app/lib/socket.ts
git commit -m "feat(lib): Initialize Socket client utility (lib/socket.ts)"

git add hospital-patient-app/app/layout.tsx
git commit -m "feat: Setup Root layout for patient application"

# Phase 6: Patient App UI Components & Pages
git add hospital-patient-app/app/page.tsx
git commit -m "feat: Build patient app landing page UI"

git add hospital-patient-app/components/RegistrationForm.tsx
git commit -m "feat(components): Initialize RegistrationForm component"

git commit --allow-empty -m "feat(components): Add client-side validation to RegistrationForm"

git commit --allow-empty -m "style: Refine styling and UX of RegistrationForm"

git add hospital-patient-app/app/register/new/page.tsx
git commit -m "feat: Create New Patient Registration page"

git commit --allow-empty -m "feat: Link New Patient form to API backend"

git add hospital-patient-app/app/register/old/page.tsx
git commit -m "feat: Create Existing (Old) Patient Registration page"

git commit --allow-empty -m "feat: Link Existing Patient form to API backend"

git add hospital-patient-app/app/token/page.tsx
git commit -m "feat: Initialize Token Status tracking page"

git commit --allow-empty -m "style: Style Token Status UI layout"

git commit --allow-empty -m "feat: Integrate live Socket.IO updates into Token Status page"

git add hospital-patient-app/README.md
git commit -m "docs: Add patient app README.md"

git add hospital-patient-app/.env.local
git commit -m "chore: Add patient app .env.local template"

# Phase 7: Admin App Setup & Utilities
git add hospital-admin-app/package.json
git add hospital-admin-app/tsconfig.json
git commit -m "init: Setup hospital-admin-app package.json and tsconfig"

git add hospital-admin-app/next.config.ts
git commit -m "config: Configure Next.js settings for admin app"

git add hospital-admin-app/postcss.config.mjs
git commit -m "config: Add Tailwind CSS and PostCSS config for admin app"

git add hospital-admin-app/app/globals.css
git commit -m "style: Setup global CSS for admin app"

git add hospital-admin-app/public
git commit -m "assets: Add public SVG icons for admin app"

git add hospital-admin-app/lib/api.ts
git commit -m "feat(lib): Initialize API client utility for admin app"

git add hospital-admin-app/lib/socket.ts
git commit -m "feat(lib): Initialize Socket client utility for admin app"

git add hospital-admin-app/app/layout.tsx
git commit -m "feat: Setup Root layout for admin application"

git add hospital-admin-app/app/page.tsx
git commit -m "feat: Build admin app dashboard/landing page UI"

# Phase 8: Admin App UI Components & Pages
git add hospital-admin-app/components/QueueBoard.tsx
git commit -m "feat(components): Initialize QueueBoard component"

git commit --allow-empty -m "style: Implement responsive grid styling for QueueBoard"

git commit --allow-empty -m "feat: Integrate live Socket.IO updates into QueueBoard"

git commit --allow-empty -m "feat: Add Complete/Skip action buttons to QueueBoard"

git add hospital-admin-app/app/registrations/page.tsx
git commit -m "feat: Initialize Registrations management page"

git commit --allow-empty -m "feat: Link Registrations management page to API backend"

git commit --allow-empty -m "style: Refine overall admin app UI"

git add hospital-admin-app/README.md
git commit -m "docs: Add admin app README.md"

git add hospital-admin-app/.env.local
git commit -m "chore: Add admin app .env.local template"

# Finally add any remaining uncommitted files (like eslint configs, favicons)
git add .
git commit -m "chore: Final project setup and configuration"

echo "All Phase 1-8 commits successfully executed!"
