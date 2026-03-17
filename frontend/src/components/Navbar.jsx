import React, { useState } from 'react';
import { BookOpen, LogOut, ChevronDown, GraduationCap, Presentation, ShieldCheck } from 'lucide-react';

const ROLE_CONFIG = {
  student:    { label: 'Student',    Icon: GraduationCap },
  instructor: { label: 'Instructor', Icon: Presentation  },
  admin:      { label: 'Admin',      Icon: ShieldCheck   },
};

export default function Navbar({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const config = ROLE_CONFIG[user.role] || ROLE_CONFIG.student;
  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="navbar-brand">
          <BookOpen size={22} />
          <span>EduFlow</span>
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {/* Role pill */}
          <span
            className="pill purple"
            style={{ textTransform: 'capitalize', letterSpacing: 0, fontSize: '0.75rem', padding: '0.3rem 0.8rem' }}
          >
            <config.Icon size={12} />
            {config.label}
          </span>

          {/* User menu */}
          <div className="user-menu" onClick={() => setOpen((v) => !v)}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-email">{user.email}</span>
              <span className="user-role">{config.label}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </div>

          {open && (
            <>
              <div className="dropdown-overlay" onClick={() => setOpen(false)} />
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="user-avatar" style={{ width: 38, height: 38, fontSize: '0.8rem' }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {user.email}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{config.label}</div>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item danger"
                  onClick={() => { setOpen(false); onLogout(); }}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
