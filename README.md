# MedPilot Frontend

A modern, production-grade medical practice management system built with React.

## Tech Stack

- **React 18** + React Router v6
- **Axios** – API communication
- **react-hot-toast** – notifications
- **lucide-react** – icons
- **date-fns** – date formatting
- **CSS Variables** – dark theme design system

## Project Structure

```
src/
├── components/
│   ├── Layout.jsx / Layout.css     # Sidebar + Topbar shell
│   ├── UI.jsx / UI.css             # Shared components (Button, Input, Table, Modal…)
├── context/
│   └── AuthContext.jsx             # Global auth state + hooks
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── PatientsPage.jsx
│   ├── PatientDetailPage.jsx
│   ├── AppointmentsPage.jsx
│   ├── PrescriptionsPage.jsx
│   ├── MedicalRecordsPage.jsx
│   └── ProfilePage.jsx
├── utils/
│   └── api.js                      # Axios instance + all API calls
├── App.jsx                         # Routing + AuthProvider
├── index.js                        # Entry point
└── index.css                       # Global styles + CSS variables
```

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd medpilot
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env – set REACT_APP_API_URL if needed
```

### 3. Run Locally

```bash
npm start
# App opens at http://localhost:3000
```

### 4. Build for Production

```bash
npm run build
# Output in /build
```

## Deployment

### Netlify 

1. Push to GitHub
2. Connect repo in Netlify dashboard
3. Set **Build command**: `npm run build`
4. Set **Publish directory**: `build`
5. Add environment variable: `REACT_APP_API_URL=https://medpilot-backend.onrender.com`

### Netlify – SPA routing fix

Create `public/_redirects`:
```
/*  /index.html  200
```

## API Integration

All API calls are in `src/utils/api.js`. The backend base URL is set via `REACT_APP_API_URL`.

Expected backend endpoints:

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile` |
| Patients | `GET/POST /api/patients`, `GET/PUT/DELETE /api/patients/:id` |
| Appointments | `GET/POST /api/appointments`, `GET/PUT/DELETE /api/appointments/:id` |
| Records | `GET /api/records/patient/:id`, `POST /api/records`, `PUT/DELETE /api/records/:id` |
| Prescriptions | `GET /api/prescriptions/patient/:id`, `POST /api/prescriptions`, `PUT/DELETE /api/prescriptions/:id` |
| Dashboard | `GET /api/dashboard/stats`, `GET /api/appointments/upcoming` |

## Features

- 🔐 JWT authentication (login / register / auto-logout on 401)
- 📊 Dashboard with live stats + upcoming appointments
- 👥 Patient management (CRUD + search + detail view with tabs)
- 📅 Appointment booking & management
- 💊 Prescription management
- 📋 Medical records management
- 👤 Profile & password settings
- 📱 Fully responsive (mobile sidebar)
- 🌙 Dark theme design system with CSS variables
