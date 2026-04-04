import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ user, onLogout, title, children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar user={user} />
      <div className="dashboard-main">
        <Navbar user={user} onLogout={onLogout} title={title} />
        <main className="dashboard-content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
