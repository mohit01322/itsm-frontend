# I-ITSM Frontend (React PWA) - start here (Mac)

## Run it (first time)
1. Unzip this folder, e.g. into `Documents/itsm-frontend`.
2. Open **VS Code** -> File -> Open Folder -> choose `itsm-frontend`.
3. Open the terminal inside VS Code: menu **Terminal -> New Terminal**.
4. Type these two commands (press Enter after each):
       npm install
       npm run dev
5. Open http://localhost:5173 in Chrome.
6. Log in with: `employee / employee123`, `technician / tech123`, `admin / admin123`.
7. Stop the app: click the terminal and press `Control + C`.

Next time you only need `npm run dev`.

## IMPORTANT: it uses FAKE data right now
`src/api/config.js` has `USE_MOCK = true`. The orange "FAKE DATA" tag in the top bar shows this.
Fake data lives in `src/api/mockApi.js`. It resets every time you reload the browser page. That is normal.
On **Wed 11 Nov**, when the backend runs on your laptop, change it to `USE_MOCK = false`.

## Where things are
    src/api/config.js        THE SWITCH (fake / real)
    src/api/mockApi.js       fake backend
    src/api/realApi.js       real backend calls (Basic auth, /api proxy)
    src/auth/                login state + role guards
    src/components/          shared: Navbar, IncidentTable, Badges, useLoad
    src/pages/employee/      MOHIY  (Register, MyIncidents, ReportIncident, IncidentDetail, Notifications)
    src/pages/technician/    PARTNER (AssignedIncidents)
    src/pages/admin/         PARTNER (Dashboard, AllIncidents, Technicians, AuditLog)
    src/App.jsx              the list of page addresses (routes)
    src/index.css            all the colours and layout

## Rules for two people
- Edit only your own folder. Shared files (api/, auth/, components/, App.jsx, index.css): message the other person first.
- GitHub Desktop every time: Fetch/Pull -> work -> Commit -> Push.

## Things the backend team still has to add (the UI already expects them)
CORS (not needed in dev, the proxy handles it), GET /api/me, POST /api/auth/register, reporter on incidents + GET /api/incidents/mine,
notes, resolution text, feedback, users. Search for "TODO" in the code to see where each one plugs in.

## Make it a phone app (PWA)
`npm run build` then `npm run preview`, open the shown address in Chrome, and use the install icon in the address bar.
