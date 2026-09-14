'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { getAuthUser, saveAuthUser, clearAuthUser, getInitials, type AuthUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface TopbarProps {
  onMenuClick: () => void;
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
}

export default function Topbar({ onMenuClick, onSidebarToggle, sidebarCollapsed }: TopbarProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Load from localStorage immediately for fast render
    const cached = getAuthUser();
    if (cached) setCurrentUser(cached);

    // Then refresh from server to get latest name/role
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((json) => {
        if (json.user) {
          const fresh: AuthUser = {
            id: json.user.id,
            name: json.user.name,
            email: json.user.email,
            role: json.user.role,
            initials: getInitials(json.user.name),
          };
          saveAuthUser(fresh);
          setCurrentUser(fresh);
        }
      })
      .catch(() => {/* silently ignore */});
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {/* ignore */}
    clearAuthUser();
    router.push('/sign-up-login');
  };

  const notifications = [
    { id: 'notif-001', type: 'warning', message: '4 PMS records are overdue', time: '2h ago', icon: 'CalendarDaysIcon' },
    { id: 'notif-002', type: 'alert', message: '3 parts below minimum stock level', time: '3h ago', icon: 'ArchiveBoxIcon' },
    { id: 'notif-003', type: 'info', message: 'Job JO-2026-0091 completed by R. Dela Cruz', time: '4h ago', icon: 'WrenchScrewdriverIcon' },
    { id: 'notif-004', type: 'success', message: 'Invoice INV-2026-0047 marked as Paid', time: '6h ago', icon: 'BanknotesIcon' },
    { id: 'notif-005', type: 'warning', message: 'Technician M. Santos deployment return overdue', time: '1d ago', icon: 'TruckIcon' },
  ];

  const displayName = currentUser?.name ?? 'Guest';
  const displayInitials = currentUser?.initials ?? getInitials(displayName);
  const displayRole = currentUser?.role ?? '';

  const roleLabel = displayRole === 'ADMIN' ? 'Admin'
    : displayRole === 'MANAGER' ? 'Manager'
    : displayRole === 'FIELD_TECHNICIAN' ? 'Field Technician'
    : displayRole;

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 flex-shrink-0 z-20">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
        aria-label="Open menu"
      >
        <Icon name="Bars3Icon" size={20} />
      </button>

      {/* Desktop sidebar toggle */}
      <button
        onClick={onSidebarToggle}
        className="hidden lg:flex p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Icon name={sidebarCollapsed ? 'ChevronDoubleRightIcon' : 'ChevronDoubleLeftIcon'} size={16} />
      </button>

      {/* Breadcrumb / page context */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name="HomeIcon" size={13} />
        <Icon name="ChevronRightIcon" size={11} />
        <span className="text-foreground font-500">Operations</span>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 text-xs text-muted-foreground cursor-pointer hover:bg-secondary transition-colors w-48">
        <Icon name="MagnifyingGlassIcon" size={14} />
        <span>Search jobs, assets...</span>
        <span className="ml-auto text-2xs bg-background rounded px-1 py-0.5 border border-border font-mono">⌘K</span>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          aria-label="Notifications"
        >
          <Icon name="BellIcon" size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-dropdown z-40 scale-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-600 text-foreground">Notifications</span>
                <span className="text-2xs bg-accent text-accent-foreground rounded-full px-2 py-0.5 font-600">
                  {notifications.length} new
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors cursor-pointer border-b border-border last:border-0"
                  >
                    <div className={`mt-0.5 p-1.5 rounded-md flex-shrink-0 ${
                      n.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                      n.type === 'alert' ? 'bg-red-50 text-red-600' :
                      n.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <Icon name={n.icon as Parameters<typeof Icon>[0]['name']} size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-500 text-foreground leading-snug">{n.message}</p>
                      <p className="text-2xs text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-border">
                <button className="text-xs text-primary font-500 hover:underline">View all notifications</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User avatar with dropdown */}
      <div className="relative">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 cursor-pointer group hover:bg-muted rounded-md px-2 py-1 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-600">
            {displayInitials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-500 text-foreground leading-tight">{displayName}</p>
            <p className="text-2xs text-muted-foreground">{roleLabel}</p>
          </div>
          <Icon name="ChevronDownIcon" size={12} className="text-muted-foreground hidden sm:block" />
        </button>

        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-lg shadow-dropdown z-40 scale-in">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-600 text-foreground">{displayName}</p>
                <p className="text-2xs text-muted-foreground mt-0.5">{currentUser?.email ?? ''}</p>
                <span className="inline-block mt-1.5 text-2xs font-600 px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                  {roleLabel}
                </span>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Icon name="ArrowRightOnRectangleIcon" size={14} />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}