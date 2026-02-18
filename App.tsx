
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';

// Simple placeholder components for other pages
const Settings = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
    <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-2xl">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Reddit Account</label>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
            <div>
              <p className="font-bold">u/jane_doe_builder</p>
              <p className="text-xs text-slate-500">Connected since Jan 2025</p>
            </div>
            <button className="ml-auto text-sm font-bold text-red-500 hover:text-red-600">Disconnect</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Subscription Plan</label>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex justify-between items-center">
            <div>
              <p className="font-bold text-orange-900">Pro Plan ($29/mo)</p>
              <p className="text-sm text-orange-700">Renewal on Feb 15, 2025</p>
            </div>
            <button className="text-sm font-bold bg-white text-orange-900 px-4 py-2 rounded-lg border border-orange-200">Manage</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Admin = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <p className="text-sm font-medium text-slate-500">Total Users</p>
        <p className="text-3xl font-bold">1,245</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <p className="text-sm font-medium text-slate-500">Active Subscriptions</p>
        <p className="text-3xl font-bold">842</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <p className="text-sm font-medium text-slate-500">API Credit Usage</p>
        <p className="text-3xl font-bold">64%</p>
      </div>
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 font-bold">User Management</div>
      <div className="p-8 text-center text-slate-400">Loading user table...</div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
        <Route path="/admin" element={<AppLayout><Admin /></AppLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
