# VARSHANETRA

## AI Rainfall and Flood Intelligence Platform

VARSHANETRA is a Smart India Hackathon 2026 prototype for rainfall monitoring, flood-risk analysis, inundation simulation, government response, community ground truth, and AI-assisted decision support across India.

> See the Rain. Predict the Flood. Save Lives.

## What This Prototype Provides

- Multi-source rainfall and warning dashboard
- District-level live rainfall map with AI-fused, satellite, radar, AWS, and NWP views
- 3D terrain and floodwater simulation with impact metrics
- Government command center for warnings, bulletins, resource dispatch, shelters, and broadcasts
- Citizen flood and waterlogging reports with an AI-verification workflow
- VARSHA AI assistant for warnings, rainfall, flood risk, model, and data questions
- AI model observatory, analytics, historical events, satellite view, evacuation, alerts, profiles, and administration pages
- English, Hindi, Marathi, Bengali, Tamil, Telugu, Kannada, and Malayalam interface support where translated content is available

This is a working prototype. Dashboard records and model outputs are seeded or model-estimated demonstration data and must not be treated as official emergency instructions.

## Technology

| Area | Implementation |
| --- | --- |
| Web application | Next.js 16 App Router, React 19, TypeScript |
| Styling and interaction | Tailwind CSS v4, CSS design tokens, Framer Motion, Canvas API |
| Charts and maps | Recharts, Leaflet, React Leaflet |
| Application database | MongoDB Atlas or MongoDB, accessed with Mongoose |
| Authentication | Cookie-based server sessions, protected by Next.js middleware |
| AI assistant | Google Gemini API with an application fallback response |
| Default ML service | Flask API on port 5000 with a statistical rainfall/inundation fallback |
| Optional trained ML service | FastAPI and PyTorch service in `Models_Only` on port 8000 |

## Requirements

- Node.js 18 or newer
- npm
- Python 3.8 or newer
- A reachable MongoDB database, normally MongoDB Atlas
- Optional: Gemini API key for live Gemini responses
- Optional: PyTorch environment for the trained model server

## Installation

From the project directory:

```powershell
npm install
python -m pip install -r ml_server/requirements.txt
```

Copy the example environment file:

```powershell
Copy-Item .env.example .env.local
```

Then set at least:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
GEMINI_API_KEY=<optional-gemini-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
ML_SERVER_URL=http://localhost:5000
DEMO_MODE=true
```

Never submit `.env.local`, API keys, database credentials, or private connection strings. `.env.local` is ignored by `.gitignore` and is only for local execution.

## Start the Complete Prototype

Recommended one-command startup:

```powershell
npm run dev
```

This starts:

- Next.js at `http://localhost:3000`
- Flask ML service at `http://localhost:5000`
- MongoDB connection on demand from the Next.js API routes

Equivalent Windows launchers are available:

```powershell
.\start-varshanetra.ps1
```

```cmd
start-varshanetra.bat
```

If port 3000 or 5000 is occupied, stop the existing process or use the port shown by Next.js. Keep the terminal running while using or recording the website. Stop both services with `Ctrl+C`.

## Seed Demonstration Data

After the application is running, seed the MongoDB database from a browser or PowerShell:

```powershell
Invoke-WebRequest http://localhost:3000/api/seed
```

The seed route creates demonstration users, stations, warnings, rainfall observations, risk zones, model metrics, notifications, and community reports. It is safe to run again for a clean demonstration dataset.

## Demo Accounts

| User type | Mobile / identifier | Password |
| --- | --- | --- |
| Public user | `9800000001` | `Demo@1234` |
| Government officer | `9800000002` | `Demo@1234` |
| Administrator | `9800000003` | `Admin@1234` |
| Researcher | `9800000004` | `Demo@1234` |

The login page also supports the role-selection demonstration flow. These accounts are for local prototype demonstrations only.

## Main Website Routes

### Public pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page and platform overview |
| `/about` | Mission and project information |
| `/features` | Feature overview |
| `/how-it-works` | Technical workflow |
| `/contact` | Contact form |
| `/historical` | Historical flood event view |
| `/architecture` | System architecture |
| `/api-docs` | API documentation |
| `/login` | Login |
| `/register` | Registration |
| `/forgot-password` | Password recovery |
| `/reset-password` | Password reset |
| `/verify-otp` | OTP verification |
| `/select-role` | Demo role selection |
| `/offline` | Offline warning view |

### Authenticated pages

| Route | Purpose |
| --- | --- |
| `/dashboard` | Command overview and citizen/expert dashboard |
| `/map` | Live rainfall and warning map |
| `/warnings` | Warning list, filters, and export |
| `/inundation` | 3D flood simulation and impact results |
| `/government` | Government command center and response actions |
| `/bulletin` | AI-assisted bulletin generation |
| `/community` | Citizen ground-truth reports |
| `/chat` | VARSHA AI assistant |
| `/ai-observatory` | Model metrics and inference pipeline |
| `/analytics` | Analytics and comparisons |
| `/district/[code]` | District details and risk zones |
| `/evacuation` | Evacuation planning |
| `/satellite` | Satellite view |
| `/models` | Model information |
| `/notifications` | Notification center |
| `/profile` | User profile and preferences |
| `/subscribe` | Alert subscription workflow |

### Administration

| Route | Purpose |
| --- | --- |
| `/admin` | Administration dashboard |
| `/admin/users` | User management |
| `/admin/models` | Model management |
| `/admin/system` | System status |
| `/admin/verification` | Verification queue |

## API Services

The Next.js API routes are under `src/app/api` and include:

- Authentication: login, logout, registration, OTP, profile, password reset
- Dashboard: overview, warnings, notifications, rainfall, districts
- Public: statistics, warning ticker, memorial endpoint
- Flood intelligence: inundation simulation, analytics, AI models
- Operations: bulletins, community reports, subscriptions, alerts
- Maintenance: health and seed routes

Default service checks:

```powershell
Invoke-WebRequest http://localhost:5000/health
Invoke-WebRequest http://localhost:3000/api/health
```

## ML Services

### Default Flask service

`ml_server/app.py` is started by `npm run dev`. It provides:

- `GET /health`
- `GET /models`
- `POST /predict`

It uses a lightweight statistical model so the complete prototype runs without a GPU or large Python installation.

### Optional trained PyTorch service

`Models_Only` contains the trained rainfall and inundation network definitions, checkpoints, training CSV, and a standalone FastAPI server. It is separate from the default `npm run dev` command.

```powershell
cd Models_Only
python -m pip install -r requirements.txt
python ml_server.py
```

It runs on `http://localhost:8000` and provides `/health`, `/models`, `/predict/rainfall`, `/predict/inundation`, `/predict/district`, and `/predict/batch`. The checkpoint files are intentionally retained for future trained-model integration.

## Recommended SIH Recording Flow

1. Start the project with `npm run dev`.
2. Seed data once with `/api/seed`.
3. Open `/` and show the platform purpose.
4. Log in with the government demo account.
5. Show `/dashboard` and live warning indicators.
6. Open `/map`, search for Mumbai, and switch data sources.
7. Open `/inundation`, select Mumbai, choose `Very Heavy 200mm/24h`, and click **Run Simulation**.
8. Show **Impact Results**, then return to **3D Terrain**.
9. Open `/government`, select Mumbai, choose **Broadcast Alert**, and confirm it.
10. Open `/community`, submit a Mumbai waterlogging report, and show the pending AI-verification status.
11. Open `/chat`, choose **Current RED warnings**, and show the response and sources.

Allow each page and simulation to finish loading before moving to the next scene. Model values are estimates for the prototype; critical real-world decisions must use official IMD, NDMA, and local authority channels.

## Validation Commands

```powershell
npm run lint
npm run typecheck
npm run build
```

The project has a large TypeScript surface and may require additional Node heap on constrained machines for `typecheck` or `build`:

```powershell
$env:NODE_OPTIONS="--max-old-space-size=8192"
npm run typecheck
```

## Project Structure

```text
src/app/                 Next.js pages and API routes
src/components/          Shared application, map, dashboard, UI, and landing components
src/context/             Locale context
src/lib/                 MongoDB models, authentication, seed data, i18n, and utilities
ml_server/               Default Flask prediction service
Models_Only/             Optional trained PyTorch/FastAPI service and checkpoints
start-varshanetra.*      Windows startup helpers
.env.example             Safe environment template
```

## Submission and Security Checklist

- Include source code, `package.json`, `package-lock.json`, `ml_server`, `Models_Only`, and the documentation.
- Do not include `.env.local`, API keys, database passwords, `node_modules`, or `.next` in the SIH archive.
- Run `npm install` and Python dependency installation on the target machine.
- Seed the target MongoDB instance before the demonstration.
- Use only the documented demo credentials for local presentation.
- Do not present seeded values or model estimates as official live emergency measurements.

## Project Context

- Event: Smart India Hackathon 2026
- Domain: Disaster management and flood intelligence
- Platform: VARSHANETRA
- Category: Software prototype
