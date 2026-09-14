'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'FIELD_TECHNICIAN';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

const ROLES: { value: User['role']; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'FIELD_TECHNICIAN', label: 'Field Technician' },
];

const roleColors: Record<User['role'], string> = {
  ADMIN: 'bg-red-500/10 text-red-400',
  MANAGER: 'bg-blue-500/10 text-blue-400',
  FIELD_TECHNICIAN: 'bg-green-500/10 text-green-400',
};

const roleLabels: Record<User['role'], string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  FIELD_TECHNICIAN: 'Field Technician',
};

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface UserFormData {
  name: string;
  email: string;
  role: User['role'];
  password: string;
  status: User['status'];
}

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

const emptyForm: UserFormData = {
  name: '',
  email: '',
  role: 'FIELD_TECHNICIAN',
  password: '',
  status: 'ACTIVE',
};

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({ newPassword: '', confirmPassword: '' });
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setGlobalError('');
    try {
      let res = await fetch('/api/users');
      if (!res.ok) {
        const json = await res.json();
        setGlobalError(json.error ?? 'Failed to load users.');
        return;
      }
      const json = await res.json();
      setUsers(json.users ?? []);
    } catch {
      setGlobalError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      roleLabels[u.role].toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError('');
    setFormSuccess('');
    setShowPassword(false);
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, password: '', status: user.status });
    setFormError('');
    setFormSuccess('');
    setShowPassword(false);
    setShowModal(true);
  };

  const openChangePassword = (user: User) => {
    setPasswordTarget(user);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setShowNewPw(false);
    setShowConfirmPw(false);
    setShowPasswordModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    setFormSuccess('');
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (!form.email.trim()) { setFormError('Email is required.'); return; }
    if (!editingUser && !form.password.trim()) { setFormError('Password is required for new users.'); return; }

    setIsSaving(true);
    try {
      let res: Response;
      if (editingUser) {
        const body: Record<string, string> = {
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
        };
        res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            status: form.status,
          }),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? 'Failed to save user.');
        return;
      }

      setFormSuccess(editingUser ? 'User updated successfully.' : 'User created successfully.');
      await fetchUsers();
      setTimeout(() => setShowModal(false), 800);
    } catch {
      setFormError('Unable to connect to server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      let res = await fetch(`/api/users/${deleteConfirm.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        setGlobalError(json.error ?? 'Failed to delete user.');
        setDeleteConfirm(null);
        return;
      }
      await fetchUsers();
      setDeleteConfirm(null);
    } catch {
      setGlobalError('Unable to connect to server.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      let res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGlobalError(json.error ?? 'Failed to update status.');
        return;
      }
      await fetchUsers();
    } catch {
      setGlobalError('Unable to connect to server.');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordTarget) return;
    setPasswordError('');
    setPasswordSuccess('');
    if (!passwordForm.newPassword.trim()) { setPasswordError('New password is required.'); return; }
    if (passwordForm.newPassword.length < 6) { setPasswordError('Password must be at least 6 characters.'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPasswordError('Password confirmation does not match.'); return; }

    setIsSavingPassword(true);
    try {
      let res = await fetch(`/api/users/${passwordTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: passwordForm.newPassword, confirmPassword: passwordForm.confirmPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPasswordError(json.error ?? 'Failed to change password.');
        return;
      }
      setPasswordSuccess('Password changed successfully.');
      setTimeout(() => setShowPasswordModal(false), 800);
    } catch {
      setPasswordError('Unable to connect to server.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-600 text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage system accounts — create, edit, or remove users and assign roles.</p>
        </div>

        {/* Global error */}
        {globalError && (
          <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <Icon name="ExclamationCircleIcon" size={16} />
            {globalError}
            <button onClick={() => setGlobalError('')} className="ml-auto text-red-400 hover:text-red-300">
              <Icon name="XMarkIcon" size={14} />
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Icon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
            { label: 'Active', value: users.filter((u) => u.status === 'ACTIVE').length, icon: 'CheckCircleIcon', color: 'text-green-400' },
            { label: 'Inactive', value: users.filter((u) => u.status === 'INACTIVE').length, icon: 'XCircleIcon', color: 'text-muted-foreground' },
          ].map((stat) => (
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
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
              <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
              Loading users...
            </div>
          ) : (
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
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-600 flex-shrink-0">
                          {getInitials(user.name)}
                        </div>
                        <span className="font-500 text-foreground">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-500 ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        title={user.status === 'ACTIVE' ? 'Click to deactivate' : 'Click to activate'}
                        className={`inline-flex items-center gap-1 text-xs font-500 px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          user.status === 'ACTIVE' ?'text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20' :'text-muted-foreground border-border hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-400' : 'bg-muted-foreground'}`} />
                        {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(user.createdAt).toLocaleDateString('en-CA')}
                    </td>
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
                          onClick={() => openChangePassword(user)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Change password"
                        >
                          <Icon name="KeyIcon" size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user)}
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
          )}
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
              {formSuccess && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-md text-green-400 text-xs">
                  <Icon name="CheckCircleIcon" size={14} />
                  {formSuccess}
                </div>
              )}
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Juan dela Cruz"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="user@indentrade.com.ph"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as User['role'] }))}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-xs font-500 text-muted-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-10 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={15} />
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as User['status'] }))}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSaving}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground font-500 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {isSaving && <Icon name="ArrowPathIcon" size={13} className="animate-spin" />}
                {editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && passwordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-600 text-foreground">Change Password</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{passwordTarget.name}</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors">
                <Icon name="XMarkIcon" size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {passwordError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-xs">
                  <Icon name="ExclamationCircleIcon" size={14} />
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-md text-green-400 text-xs">
                  <Icon name="CheckCircleIcon" size={14} />
                  {passwordSuccess}
                </div>
              )}
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2 pr-10 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button type="button" onClick={() => setShowNewPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <Icon name={showNewPw ? 'EyeSlashIcon' : 'EyeIcon'} size={15} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-500 text-muted-foreground mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 pr-10 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button type="button" onClick={() => setShowConfirmPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <Icon name={showConfirmPw ? 'EyeSlashIcon' : 'EyeIcon'} size={15} />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <button onClick={() => setShowPasswordModal(false)} disabled={isSavingPassword} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isSavingPassword}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground font-500 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {isSavingPassword && <Icon name="ArrowPathIcon" size={13} className="animate-spin" />}
                Change Password
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
              Are you sure you want to delete{' '}
              <span className="font-500 text-foreground">{deleteConfirm.name}</span>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500 text-white font-500 rounded-md hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {isDeleting && <Icon name="ArrowPathIcon" size={13} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
