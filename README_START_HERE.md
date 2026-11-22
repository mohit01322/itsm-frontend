# I-ITSM Frontend (React) - start here

The website for the I-ITSM incident management project. The backend (Spring Boot) is in the separate `OOPS_Project_Final` repository.

Live version: https://iitsm-bits.netlify.app

## Run it on your computer

You need Node.js 18 or newer, and the backend running on http://localhost:8080 (see the backend repository's README.md: create the `itsm_db` database, then `mvn spring-boot:run`).

1. Open a terminal in this folder and run (press Enter after each):

       npm install
       npm run dev

2. Open http://localhost:5173 in Chrome.
3. Log in with the demo buttons, or with:

   | Login | Password | Role |
   | --- | --- | --- |
   | admin | admin123 | Administrator |
   | employee | employee123 | Employee |
   | technician | tech123 | Technician (Ravi Kumar) |
   | priya | priya123 | Technician (Priya Sharma) |
   | arjun | arjun123 | Technician (Arjun Mehta) |

   On a new (empty) database the backend adds these technicians and six sample incidents by itself.
4. Stop the app: click the terminal and press `Ctrl + C`.

Next time you only need `npm run dev`.

## Where things are

    src/api/config.js        USE_MOCK = false: talks to the real backend (true = old fake data, without the newer features)
    src/api/realApi.js       every backend call (Basic auth, through the /api proxy)
    src/auth/                login state + role guards
    src/components/          shared: Navbar, IncidentTable, Badges, useLoad
    src/pages/employee/      Register, MyIncidents, ReportIncident, IncidentDetail, Notifications
    src/pages/technician/    AssignedIncidents
    src/pages/admin/         Dashboard, AllIncidents, Technicians, Delegations, AuditLog, Settings
    src/pages/               Login, Account, ChangePassword
    src/App.jsx              the list of page addresses (routes)
    src/index.css            all the colours and layout
    public/_redirects        on Netlify, sends /api calls to the cloud backend

## Put a new version online

    npm run build

Then drag the `dist` folder onto the site's Deploys page on Netlify.

## Install it like an app (PWA)

On the live site, use the install icon in Chrome's address bar.
