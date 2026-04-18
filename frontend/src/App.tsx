import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Trips } from './pages/Trips';
import { Bags } from './pages/Bags';
import { Tracking } from './pages/Tracking';
import { TripHistory } from './pages/TripHistory';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { Subscription } from './pages/Subscription';
import { SubscriptionResult } from './pages/SubscriptionResult';
import { ResetPassword } from './pages/ResetPassword';
import { About } from './pages/About';
import { Contact } from './pages/Contact';

const App = () => {
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/subscription-result" element={<SubscriptionResult />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Protected Routes inside Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/bags" element={<Bags />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/history" element={<TripHistory />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscription" element={<Subscription />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
