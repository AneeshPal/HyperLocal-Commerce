# Aas-Paas — HyperLocal Commerce Frontend (UI scaffold)

This is the basic UI scaffold for the HyperLocal Commerce platform, built with
React (Vite), React Router, and Material UI. It's wired with mock data so you
can see every screen immediately — swap the mock data calls in `src/data/mockData.js`
for real API calls as you build out the backend.

## Screens included
- Login / Signup
- Home feed (nearby listings, category filters)
- Listing detail
- Create listing (seller form)
- Messages (conversation list + chat thread)
- Checkout (escrow-style payment summary)
- Orders (status tracker: paid → escrow held → delivered → released)
- Profile (listings + reviews)
- Notifications

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## Where to plug in real functionality
- `src/data/mockData.js` — replace with API calls (fetch/axios) to your backend
- Auth: `src/pages/Login.jsx`, `src/pages/Signup.jsx` — wire up your auth endpoint,
  then guard the `AppShell` routes in `src/App.jsx`
- Real-time chat: `src/pages/Chat.jsx` — replace local state with a Socket.io client
- Payments: `src/pages/Checkout.jsx` — replace the mock "Pay securely" button with
  the Razorpay checkout SDK
- Geolocation/maps: `src/pages/Home.jsx` and `src/layouts/AppShell.jsx` — the location
  chip and "within 3 km" text are placeholders for your MongoDB geospatial query params

## Structure
```
src/
  layouts/AppShell.jsx   sidebar nav + topbar shared across logged-in pages
  pages/                 one file per screen
  components/            ListingCard (reused in Home + Profile)
  data/mockData.js        placeholder data — swap for API calls
  theme.js                MUI theme (colors, type)
```
