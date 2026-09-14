'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Field Technician';
  initials: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

const initialUsers: User[] = [
  { id: 1, name: 'Ana Reyes', email: 'admin@indentrade.com.ph', role: 'Admin', initials: 'AR', status: 'Active', createdAt: '2025-01-10' },
  { id: 2, name: 'Marco Santos', email: 'manager@indentrade.com.ph', role: 'Manager', initials: 'MS', status: 'Active', createdAt: '2025-02-14' },
  { id: 3, name: 'Rico Dela Cruz', email: 'technician@indentrade.com.ph', role: 'Field Technician', initials: 'RD', status: 'Active', createdAt: '2025-03-05' },
];

const ROLES: User['role'][] = ['Admin', 'Manager', 'Field Technician'];

const roleColors: Record<User['role'], string> = {
  Admin: 'bg-red-500/10 text-red-400',
  Manager: 'bg-blue-500/10 text-blue-400',
  'Field Technician': 'bg-green-500/10 text-green-400',
};

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

interface UserFormData {
  name: string;
  email: string;
  role: User['role'];
  password: string;
  status: User['status'];
}

const emptyForm: UserFormData = {
  name: '',
  email: '',
  role: 'Field Technician',
  password: '',
  status: 'Active',
};

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formError, setFormError] = useState('');

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, password: '', status: user.status });
    setFormError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (!form.email.trim()) { setFormError('Email is required.'); return; }
    if (!editingUser && !form.password.trim()) { setFormError('Password is required for new users.'); return; }

    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id
        ? { ...u, name: form.name, email: form.email, role: form.role, status: form.status, initials: getInitials(form.name) }
        : u
      ));
    } else {
      const newUser: User = {
        id: Date.now(),
        name: form.name,
        email: form.email,
        role: form.role,
        initials: getInitials(form.name),
        status: form.status,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUsers(prev => [...prev, newUser]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-600 text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage system accounts — create, edit, or remove users and assign roles.</p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Icon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-500 rounded-md hover:bg-primary/90 transition-colors"
          >
            <Icon name="PlusIcon" size={15} />
            Add User
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Users', value: users.length, icon: 'UsersIcon', color: 'text-blue-400' },
            { label: 'Active', value: users.filter(u => u.status === 'Active').length, icon: 'CheckCircleIcon', color: 'text-green-400' },
            { label: 'Inactive', value: users.filter(u => u.status === 'Inactive').length, icon: 'XCircleIcon', color: 'text-muted-foreground' },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <Icon name={stat.icon as Parameters<typeof Icon>[0]['name']} size={20} className={stat.color} />
              <div>
                <p className="text-lg font-600 text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-600 text-muted-foreground uppercase tracking-wider">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No users found.</td>
                </tr>
              )}
              {filtered.map(user => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-600 flex-shrink-0">
                        {user.initials}
                      </div>
                      <span className="font-500 text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-500 ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-500 ${user.status === 'Active' ? 'text-green-400' : 'text-muted-foreground'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-400' : 'bg-muted-foreground'}`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit user"
                      >
                        <Icon name="PencilIcon" size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Delete user"
                      >
                        <Icon name="TrashIcon" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-600 text-foreground">{editingUser ? 'Edit User' : 'Create New User'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors">
                <Icon name="XMarkIcon" size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-xs">
                  <Icon name="ExclamationCircleIcon" size={14} />
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Juan dela Cruz"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@indentrade.com.ph"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as User['role'] }))}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 pr-10 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={15} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as User['status'] }))}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground font-500 rounded-md hover:bg-primary/90 transition-colors"
              >
                {editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Icon name="TrashIcon" size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-600 text-foreground">Delete User</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete <span className="font-500 text-foreground">{users.find(u => u.id === deleteConfirm)?.name}</span>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-500 text-white font-500 rounded-md hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
