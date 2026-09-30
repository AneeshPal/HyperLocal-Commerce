import { Routes, Route } from 'react-router-dom';

import AppShell from './layouts/AppShell';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import Chat from './pages/Chat';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Main Application */}
      <Route element={<AppShell />}>

        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Listing Details */}
        <Route
          path="/listing/:id"
          element={<ListingDetail />}
        />

        {/* Edit Listing */}
        <Route
          path="/edit-listing/:id"
          element={<EditListing />}
        />

        {/* Create Listing */}
        <Route
          path="/create-listing"
          element={<CreateListing />}
        />

        {/* Chat */}
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:id" element={<Chat />} />

        {/* Checkout */}
        <Route
          path="/checkout/:id"
          element={<Checkout />}
        />

        {/* Orders */}
        <Route path="/orders" element={<Orders />} />

        {/* Profile */}
        <Route path="/profile" element={<Profile />} />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={<Notifications />}
        />

      </Route>
    </Routes>
  );
}