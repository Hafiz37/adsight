import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

// SVGs inline for portability and style consistency
const IconDashboard = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconCampaign = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
const IconAudit = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const IconPortal = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>;
const IconLogout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const IconMenu = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard Overview', icon: <IconDashboard /> },
    { path: '/admin/users', label: 'User Management', icon: <IconUsers /> },
    { path: '/admin/campaigns', label: 'Campaign Monitoring', icon: <IconCampaign /> },
    { path: '/admin/audit-logs', label: 'Admin Audit Logs', icon: <IconAudit /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getBreadcrumbs = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    return segments.map((seg, idx) => {
      const path = '/' + segments.slice(0, idx + 1).join('/');
      const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace('-', ' ');
      const isLast = idx === segments.length - 1;
      return { path, label, isLast };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-950 flex text-gray-100 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-30 lg:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar container */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-40 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">
            Ad<span className="text-violet-400">Sight</span> <span className="text-[10px] ml-1.5 px-2 py-0.5 rounded bg-violet-600/30 text-violet-300 font-semibold tracking-wider uppercase">Admin</span>
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <IconClose />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-2">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all border border-transparent hover:border-gray-800"
          >
            <IconPortal />
            User Portal
          </Link>

          <div className="px-4 py-3 rounded-lg bg-gray-850/60 border border-gray-800/40">
            <p className="text-[10px] text-gray-500 mb-0.5 uppercase font-bold tracking-wider">Admin Account</p>
            <p className="text-xs text-gray-200 font-medium truncate" title={user.email}>{user.email || '-'}</p>
          </div>

          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-left cursor-pointer"
          >
            <IconLogout />
            Logout
          </button>
        </div>
      </aside>

      {/* Main viewport area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden text-gray-400 hover:text-white focus:outline-none"
            >
              <IconMenu />
            </button>

            {/* Breadcrumb */}
            <nav className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span className="text-gray-500">Admin</span>
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={bc.path}>
                  <span className="text-gray-750 font-normal">/</span>
                  {bc.isLast ? (
                    <span className="text-violet-400 font-bold">{bc.label}</span>
                  ) : (
                    <Link to={bc.path} className="hover:text-white transition-colors">{bc.label}</Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Admin Meta Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Administrator</p>
              <p className="text-xs text-gray-300 font-medium truncate max-w-xs">{user.email || 'Admin'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center font-bold text-violet-300 text-sm">
              {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
