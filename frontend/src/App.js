import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import KanbanPage from './pages/KanbanPage';
import LeadDetailPage from './pages/LeadDetailPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6c63ff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>LF</div>
        <div style={{ color: '#6a6a80', fontSize: 13 }}>Loading LeadFlow...</div>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#18181f', color: '#f0f0f8', border: '1px solid #2a2a35', fontSize: 13 },
            success: { iconTheme: { primary: '#22d3a0', secondary: '#18181f' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#18181f' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />
            <Route path="kanban" element={<KanbanPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
