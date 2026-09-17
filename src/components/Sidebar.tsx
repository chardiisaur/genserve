'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { getAuthUser, AuthUser } from '@/lib/auth';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  badgeKey?: 'openJobs' | 'pmsDue' | 'lowStockParts';
  children?: NavItem[];
}

const adminNavGroups: { group: string; items: NavItem[] }[] = [
  {
    group: '',
    items: [
      { id: 'nav-dashboard', label: 'Dashboard', icon: 'ChartBarSquareIcon', href: '/' },
    ],
  },
  {
    group: 'Clients & Sites',
    items: [
      { id: 'nav-clients', label: 'Clients', icon: 'BuildingOffice2Icon', href: '/clients' },
      { id: 'nav-sites', label: 'Sites', icon: 'MapPinIcon', href: '/sites' },
    ],
  },
  {
    group: 'Assets',
    items: [
      { id: 'nav-generators', label: 'Generators', icon: 'BoltIcon', href: '/generators' },
    ],
  },
  {
    group: 'Workforce',
    items: [
      { id: 'nav-technicians', label: 'Manpower', icon: 'UsersIcon', href: '/technicians' },
      { id: 'nav-deployments', label: 'Deployments', icon: 'TruckIcon', href: '/deployments' },
    ],
  },
  {
    group: 'Service',
    items: [
      { id: 'nav-service-jobs', label: 'Service Jobs', icon: 'WrenchScrewdriverIcon', href: '/service-job-management', badgeKey: 'openJobs' },
      { id: 'nav-pms', label: 'PMS Schedule', icon: 'CalendarDaysIcon', href: '/pms', badgeKey: 'pmsDue' },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { id: 'nav-parts-inventory', label: 'Parts Inventory', icon: 'ArchiveBoxIcon', href: '/parts-inventory', badgeKey: 'lowStockParts' },
      { id: 'nav-parts-used', label: 'Parts Used', icon: 'WrenchIcon', href: '/parts-used' },
    ],
  },
  {
    group: 'Finance',
    items: [
      { id: 'nav-billing', label: 'Billing & Invoicing', icon: 'DocumentCurrencyDollarIcon', href: '/billing' },
    ],
  },
  {
    group: 'Configuration',
    items: [
      { id: 'nav-user-management', label: 'User Management', icon: 'UserGroupIcon', href: '/user-management' },
    ],
  },
];

interface BadgeCounts {
  openJobs: number;
  pmsDue: number;
  lowStockParts: number;
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  currentPath: string;
}

export default function Sidebar({ collapsed, mobileOpen, onMobileClose, currentPath }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['', 'Service', 'Inventory', 'Finance']);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [badges, setBadges] = useState<BadgeCounts>({ openJobs: 0, pmsDue: 0, lowStockParts: 0 });

  useEffect(() => {
    const user = getAuthUser();
    setAuthUser(user);
  }, []);

  useEffect(() => {
    // Fetch real badge counts from the dashboard API
    fetch('/api/dashboard')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.kpis) return;
        const { openJobs, inProgressJobs, pmsDue, pmsOverdue, lowStockParts } = data.kpis;
        setBadges({
          openJobs: (openJobs ?? 0) + (inProgressJobs ?? 0),
          pmsDue: (pmsDue ?? 0) + (pmsOverdue ?? 0),
          lowStockParts: lowStockParts ?? 0,
        });
      })
      .catch(() => {
        // Silently fail — badges just won't show
      });
  }, []);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col bg-card border-r border-border sidebar-transition flex-shrink-0
          ${collapsed ? 'w-16' : 'w-60'}
        `}
      >
        <SidebarContent
          collapsed={collapsed}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
          isActive={isActive}
          navGroups={adminNavGroups}
          authUser={authUser}
          badges={badges}
        />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`
          lg:hidden fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-40
          transition-transform duration-300 ease-in-out flex flex-col
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AppLogo size={28} />
            <span className="font-semibold text-sm text-foreground">GenServe GSMS</span>
          </div>
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <Icon name="XMarkIcon" size={18} />
          </button>
        </div>
        <SidebarContent
          collapsed={false}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
          isActive={isActive}
          navGroups={adminNavGroups}
          authUser={authUser}
          badges={badges}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  collapsed,
  expandedGroups,
  toggleGroup,
  isActive,
  navGroups,
  authUser,
  badges,
}: {
  collapsed: boolean;
  expandedGroups: string[];
  toggleGroup: (g: string) => void;
  isActive: (href?: string) => boolean;
  navGroups: { group: string; items: NavItem[] }[];
  authUser: AuthUser | null;
  badges: BadgeCounts;
}) {
  const displayName = authUser?.name ?? 'Guest';
  const displayRole = authUser?.role ?? '';
  const displayInitials = authUser?.initials ?? (displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2));

  const roleLabel = displayRole === 'ADMIN' ? 'Admin'
    : displayRole === 'MANAGER' ? 'Manager'
    : displayRole === 'FIELD_TECHNICIAN' ? 'Field Technician'
    : displayRole;

  return (
    <>
      {/* Logo */}
      {!collapsed && (
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
          <AppLogo size={30} />
          <div>
            <span className="font-semibold text-sm text-foreground leading-tight block">GenServe GSMS</span>
            <span className="text-2xs text-muted-foreground">Indentrade Systems Corp.</span>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex items-center justify-center py-4 border-b border-border">
          <AppLogo size={28} />
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {navGroups.map(({ group, items }) => (
          <div key={`group-${group || 'main'}`} className="mb-1">
            {group && !collapsed && (
              <button
                onClick={() => toggleGroup(group)}
                className="flex items-center justify-between w-full px-2 py-1.5 mb-0.5 group"
              >
                <span className="text-2xs font-600 uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                  {group}
                </span>
                <Icon
                  name="ChevronDownIcon"
                  size={12}
                  className={`text-muted-foreground transition-transform duration-200 ${expandedGroups.includes(group) ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>
            )}
            {(collapsed || !group || expandedGroups.includes(group)) && items.map((item) => (
              <NavItemRow
                key={item.id}
                item={item}
                collapsed={collapsed}
                active={isActive(item.href)}
                badge={item.badgeKey ? badges[item.badgeKey] : undefined}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* User profile */}
      {!collapsed && (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-muted transition-colors cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-600 flex-shrink-0">
              {displayInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-500 text-foreground truncate">{displayName}</p>
              <p className="text-2xs text-muted-foreground truncate">{roleLabel}</p>
            </div>
            <Icon name="EllipsisVerticalIcon" size={14} className="text-muted-foreground" />
          </div>
        </div>
      )}
      {collapsed && (
        <div className="border-t border-border p-2 flex justify-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-600 cursor-pointer" title={displayName}>
            {displayInitials}
          </div>
        </div>
      )}
    </>
  );
}

function NavItemRow({ item, collapsed, active, badge }: { item: NavItem; collapsed: boolean; active: boolean; badge?: number }) {
  return (
    <Link
      href={item.href || '#'}
      title={collapsed ? item.label : undefined}
      className={`
        flex items-center gap-2.5 px-2 py-2 rounded-md mb-0.5 transition-all duration-150 group relative
        ${active
          ? 'bg-primary/10 text-primary' :'text-secondary-foreground hover:bg-muted hover:text-foreground'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
    >
      <Icon
        name={item.icon as Parameters<typeof Icon>[0]['name']}
        size={16}
        className={`flex-shrink-0 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
      />
      {!collapsed && (
        <>
          <span className="text-xs font-500 flex-1 truncate">{item.label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-2xs font-600 flex items-center justify-center tabular-nums">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-accent text-accent-foreground text-2xs font-700 flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}