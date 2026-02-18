
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
import { RedditCallback } from './pages/RedditCallback';
import { ContentArchitect } from './pages/ContentArchitect';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

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
          <Route path="/auth/reddit/callback" element={<RedditCallback />} />

          {/* User Dashboard Routes - Wrapped in AppLayout */}
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/content-architect" element={<ProtectedRoute><AppLayout><ContentArchitect /></AppLayout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><AppLayout><PricingPage /></AppLayout></ProtectedRoute>} />

          {/* Admin Routes - Separate from User Layout */}
          <Route path="/admin" element={<AdminLayout><Admin /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><Admin /></AdminLayout>} />
          <Route path="/admin/settings" element={<AdminLayout><Admin /></AdminLayout>} />
          <Route path="/admin/logs" element={<AdminLayout><Admin /></AdminLayout>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
