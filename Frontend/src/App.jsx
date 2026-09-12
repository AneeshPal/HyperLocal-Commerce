import { Routes, Route } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import Chat from './pages/Chat';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/create-listing" element={<CreateListing />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
}
