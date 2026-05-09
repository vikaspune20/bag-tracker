import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Trips } from './pages/Trips';
import { TripDetail } from './pages/TripDetail';
import { Bags } from './pages/Bags';
import { Tracking } from './pages/Tracking';
import { TripHistory } from './pages/TripHistory';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { Subscription } from './pages/Subscription';
import { SubscriptionResult } from './pages/SubscriptionResult';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { TermsOfService } from './pages/TermsOfService';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { RefundCancellationPolicy } from './pages/RefundCancellationPolicy';
import { ContactInformation } from './pages/ContactInformation';
import { DeviceShop } from './pages/DeviceShop';
import { DeviceCheckout } from './pages/DeviceCheckout';
import { DeviceOrderResult } from './pages/DeviceOrderResult';
import { MyDevices } from './pages/MyDevices';
import { DeviceOrders } from './pages/DeviceOrders';
import { DeviceInvoice } from './pages/DeviceInvoice';
import { SubscriptionInvoice } from './pages/SubscriptionInvoice';
import { MobileTracker } from './pages/MobileTracker';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminUserDetail } from './pages/admin/AdminUserDetail';
import { AdminDevices } from './pages/admin/AdminDevices';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminSubscriptions } from './pages/admin/AdminSubscriptions';
import { AdminEnquiries } from './pages/admin/AdminEnquiries';
import { AdminTracking } from './pages/admin/AdminTracking';
import { AdminDataPurge } from './pages/admin/AdminDataPurge';
import { AdminPricing } from './pages/admin/AdminPricing';

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
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/refunds" element={<RefundCancellationPolicy />} />
        <Route path="/contact-info" element={<ContactInformation />} />
        <Route path="/mobile-tracker" element={<MobileTracker />} />

        {/* Protected Routes inside Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trips/:id" element={<TripDetail />} />
          <Route path="/bags" element={<Bags />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/history" element={<TripHistory />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/devices" element={<DeviceShop />} />
          <Route path="/devices/checkout" element={<DeviceCheckout />} />
          <Route path="/devices/order-result" element={<DeviceOrderResult />} />
          <Route path="/my-devices" element={<MyDevices />} />
          <Route path="/orders" element={<DeviceOrders />} />
          <Route path="/orders/:id/invoice" element={<DeviceInvoice />} />
          <Route path="/subscription-invoice/:id" element={<SubscriptionInvoice />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />
          <Route path="/admin/devices" element={<AdminDevices />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/enquiries" element={<AdminEnquiries />} />
          <Route path="/admin/pricing" element={<AdminPricing />} />
          <Route path="/admin/tracking" element={<AdminTracking />} />
          <Route path="/admin/purge" element={<AdminDataPurge />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
