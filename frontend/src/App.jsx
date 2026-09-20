import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { QRKioskModal } from './components/QRKioskModal';
import { LoginPage } from './pages/Login';

import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { HRDashboard } from './pages/HRDashboard';
import { EmployeesPage } from './pages/EmployeesPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeavesPage } from './pages/LeavesPage';
import { CalendarPage } from './pages/CalendarPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { MyAttendancePage } from './pages/MyAttendancePage';
import { MyLeavesPage } from './pages/MyLeavesPage';
import { NotificationsPage } from './pages/NotificationsPage';

const AppContent = () => {
  const { currentRole, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderDashboardByRole = () => {
    switch (currentRole) {
      case 'MANAGER':
        return <ManagerDashboard />;
      case 'HR':
        return <HRDashboard onNavigate={setActiveTab} />;
      case 'EMPLOYEE':
      default:
        return <EmployeeDashboard />;
    }
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardByRole();
      // Employee-only pages
      case 'my-attendance':
        return <MyAttendancePage />;
      case 'my-leaves':
        return <MyLeavesPage />;
      // Manager/HR shared pages
      case 'employees':
        return <EmployeesPage />;
      case 'departments':
        return <DepartmentsPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'leaves':
        return <LeavesPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'notifications':
        return <NotificationsPage />;
      default:
        return renderDashboardByRole();
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar />
        
        <main style={{ flex: 1, padding: '1.75rem 2rem', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          {renderActivePage()}
        </main>
      </div>

      <QRKioskModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
