import React, { useState } from 'react';
import { LogOut, ChevronDown, GraduationCap, Presentation, ShieldCheck, Bell } from 'lucide-react';

const ROLE_CONFIG = {
  student:    { label: 'Student',    Icon: GraduationCap },
  instructor: { label: 'Instructor', Icon: Presentation  },
  admin:      { label: 'Admin',      Icon: ShieldCheck   },
};

export default function Navbar({ user, onLogout, title }) {
  const [open, setOpen] = useState(false);
  const config = ROLE_CONFIG[user.role] || ROLE_CONFIG.student;
  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <nav className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title || 'Dashboard'}</h1>
      </div>

      <div className="topbar-right">
        {/* Notifications */}
        <button className="topbar-icon-btn">
          <Bell size={20} />
        </button>

        {/* User menu */}
        <div className="topbar-user-menu" onClick={() => setOpen((v) => !v)}>
          <div className="topbar-avatar">{initials}</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user.email.split('@')[0]}</span>
            <span className="topbar-user-role">{config.label}</span>
          </div>
          <ChevronDown size={16} />
        </div>

        {open && (
          <>
            <div className="dropdown-overlay" onClick={() => setOpen(false)} />
            <div className="topbar-dropdown">
              <div className="topbar-dropdown-header">
                <div className="topbar-avatar" style={{ width: 40, height: 40 }}>
                  {initials}
                </div>
                <div>
                  <div className="topbar-dropdown-name">{user.email}</div>
                  <div className="topbar-dropdown-role">{config.label}</div>
                </div>
              </div>
              <div className="topbar-dropdown-divider" />
              <button
                className="topbar-dropdown-item danger"
                onClick={() => { setOpen(false); onLogout(); }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
