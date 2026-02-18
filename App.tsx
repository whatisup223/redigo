
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { Admin } from './pages/Admin';
import { Settings } from './pages/Settings';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { LoginPage } from './pages/LoginPage';
import { PricingPage } from './pages/PricingPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Landing Page - Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* User Dashboard Routes - Wrapped in AppLayout */}
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
          <Route path="/pricing" element={<AppLayout><PricingPage /></AppLayout>} />

          {/* Admin Routes - Separate from User Layout */}
          <Route path="/admin" element={<AdminLayout><Admin /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><Admin /></AdminLayout>} />
          <Route path="/admin/ai" element={<AdminLayout><Admin /></AdminLayout>} />
          <Route path="/admin/payments" element={<AdminLayout><Admin /></AdminLayout>} />
          <Route path="/admin/logs" element={<AdminLayout><Admin /></AdminLayout>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
