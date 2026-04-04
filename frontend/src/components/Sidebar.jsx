import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpen, Home, PlayCircle, Search, Award, BarChart3,
  Plus, Users, Settings, FileText
} from 'lucide-react';

const STUDENT_MENU = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/dashboard/my-courses', icon: PlayCircle, label: 'My Learning' },
  { path: '/dashboard/browse', icon: Search, label: 'Browse Courses' },
  { path: '/dashboard/become-instructor', icon: Award, label: 'Become Instructor' },
];

const INSTRUCTOR_MENU = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/dashboard/my-courses', icon: PlayCircle, label: 'My Courses' },
  { path: '/dashboard/create-course', icon: Plus, label: 'Create Course' },
  { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
];

const ADMIN_MENU = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/dashboard/courses', icon: BookOpen, label: 'All Courses' },
  { path: '/dashboard/instructor-requests', icon: Users, label: 'Instructor Requests' },
  { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar({ user }) {
  const menu = user.role === 'student' 
    ? STUDENT_MENU 
    : user.role === 'instructor' 
    ? INSTRUCTOR_MENU 
    : ADMIN_MENU;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BookOpen size={24} />
        <span>EduFlow</span>
      </div>

      <nav className="sidebar-nav">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
