# BusGo Admin (Admin + Bus Operator portal)

Vite + React app for staff. Customers keep using `client/` (port 5173).

## Run it

```bash
# 1. Backend (needs MongoDB running locally)
cd server
npm install
node seedBuses.js     # only if you haven't already
node seedStaff.js     # creates admin + operators, routes, fleet, links existing trips
npm run dev           # http://localhost:5000

# 2. Admin app
cd ../admin
npm install
npm run dev           # http://localhost:5174
```

## Demo logins (created by seedStaff.js)

| Role     | Email                | Password     |
|----------|----------------------|--------------|
| Admin    | admin@busgo.com      | Admin@123    |
| Operator | operator1@busgo.com  | Operator@123 |
| Operator | operator2@busgo.com  | Operator@123 |

Change these passwords before using the system for real.

## What's inside

**Admin:** dashboard, add/manage buses (fleet + operator assignment), add/manage routes,
create schedules (bus + route + date range), view users (and create operators/admins),
view bookings, cancel bookings (seats are released), revenue/booking reports with CSV export.

**Operator:** operator login, assigned buses, schedules, passenger list per trip (CSV/print),
update trip status (Scheduled / Boarding / Departed / Delayed / Arrived / Cancelled), and
share the phone's GPS location for a trip. GPS sharing requires browser location permission
and HTTPS (localhost is also supported); it runs while the trip page is open.

Admins can see each trip's latest GPS location in **Schedules** and open it in a map. The
schedule list refreshes automatically; locations older than one minute are marked stale.

To point at a different API, copy `.env.example` to `.env` and edit `VITE_API_URL`.
