import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isNextResponse } from '@/lib/rbac';
import { getSession } from '@/lib/session';

async function hashPw(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const mod = (bcrypt as any).default ?? bcrypt;
  return mod.hash(password, 12);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log('[GET /api/users/:id] id:', id);

  const authResult = await requireAdmin();
  if (isNextResponse(authResult)) {
    console.warn('[GET /api/users/:id] Auth failed');
    return authResult;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, updatedAt: true },
    });
    if (!user) {
      console.warn('[GET /api/users/:id] Not found:', id);
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    console.log('[GET /api/users/:id] Found user:', user.email);
    return NextResponse.json({ user });
  } catch (err) {
    console.error('[GET /api/users/:id] Database error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to fetch user: ${message}` }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log('[PATCH /api/users/:id] id:', id);

  const authResult = await requireAdmin();
  if (isNextResponse(authResult)) {
    console.warn('[PATCH /api/users/:id] Auth failed');
    return authResult;
  }
  console.log('[PATCH /api/users/:id] Auth OK — admin:', authResult.id);

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error('[PATCH /api/users/:id] Failed to parse body:', err);
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { name, email, role, status, newPassword, confirmPassword } = body as {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  console.log('[PATCH /api/users/:id] Fields received:', {
    name,
    email,
    role,
    status,
    newPassword: newPassword ? '[REDACTED]' : undefined,
    confirmPassword: confirmPassword ? '[REDACTED]' : undefined,
  });

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      console.warn('[PATCH /api/users/:id] User not found:', id);
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    console.log('[PATCH /api/users/:id] Existing user:', existing.email, existing.role, existing.status);

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (!name.trim()) {
        console.warn('[PATCH /api/users/:id] Validation failed: empty name');
        return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
      }
      updateData.name = name.trim();
      console.log('[PATCH /api/users/:id] Will update name to:', updateData.name);
    }

    if (email !== undefined) {
      if (!email.trim()) {
        console.warn('[PATCH /api/users/:id] Validation failed: empty email');
        return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
      }
      const emailLower = email.toLowerCase().trim();
      if (emailLower !== existing.email) {
        const emailConflict = await prisma.user.findUnique({ where: { email: emailLower } });
        if (emailConflict) {
          console.warn('[PATCH /api/users/:id] Email conflict:', emailLower);
          return NextResponse.json({ error: 'Email already exists.' }, { status: 409 });
        }
      }
      updateData.email = emailLower;
      console.log('[PATCH /api/users/:id] Will update email to:', updateData.email);
    }

    if (role !== undefined) {
      const validRoles = ['ADMIN', 'MANAGER', 'FIELD_TECHNICIAN'];
      if (!validRoles.includes(role)) {
        console.warn('[PATCH /api/users/:id] Invalid role:', role);
        return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
      }
      // Prevent demoting the last active admin
      if (existing.role === 'ADMIN' && role !== 'ADMIN') {
        const activeAdmins = await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
        if (activeAdmins <= 1) {
          console.warn('[PATCH /api/users/:id] Cannot demote last active admin');
          return NextResponse.json({ error: 'Cannot change the role of the last active administrator.' }, { status: 400 });
        }
      }
      updateData.role = role;
      console.log('[PATCH /api/users/:id] Will update role to:', role);
    }

    if (status !== undefined) {
      if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        console.warn('[PATCH /api/users/:id] Invalid status:', status);
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
      }
      // Prevent deactivating the last active admin
      if (status === 'INACTIVE' && existing.role === 'ADMIN') {
        const activeAdmins = await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
        if (activeAdmins <= 1) {
          console.warn('[PATCH /api/users/:id] Cannot deactivate last active admin');
          return NextResponse.json({ error: 'Cannot deactivate the last active administrator.' }, { status: 400 });
        }
      }
      updateData.status = status;
      console.log('[PATCH /api/users/:id] Will update status to:', status);
    }

    if (newPassword !== undefined && newPassword.trim()) {
      if (newPassword.length < 6) {
        console.warn('[PATCH /api/users/:id] Password too short');
        return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
      }
      if (newPassword !== confirmPassword) {
        console.warn('[PATCH /api/users/:id] Password confirmation mismatch');
        return NextResponse.json({ error: 'Password confirmation does not match.' }, { status: 400 });
      }
      console.log('[PATCH /api/users/:id] Hashing new password...');
      updateData.passwordHash = await hashPw(newPassword);
      console.log('[PATCH /api/users/:id] Password hashed successfully');
    }

    if (Object.keys(updateData).length === 0) {
      console.warn('[PATCH /api/users/:id] No fields to update');
      return NextResponse.json({ error: 'No fields provided to update.' }, { status: 400 });
    }

    console.log('[PATCH /api/users/:id] Updating user in database, fields:', Object.keys(updateData));
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, updatedAt: true },
    });
    console.log('[PATCH /api/users/:id] User updated successfully:', updated.id, updated.email);

    // If the session user updated their own info, refresh session
    const session = await getSession();
    if (session.user?.id === id) {
      console.log('[PATCH /api/users/:id] Refreshing session for current user');
      session.user = {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
      };
      await session.save();
    }

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('[PATCH /api/users/:id] Database error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to update user: ${message}` }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log('[DELETE /api/users/:id] id:', id);

  const authResult = await requireAdmin();
  if (isNextResponse(authResult)) {
    console.warn('[DELETE /api/users/:id] Auth failed');
    return authResult;
  }
  console.log('[DELETE /api/users/:id] Auth OK — admin:', authResult.id);

  try {
    const session = await getSession();
    if (session.user?.id === id) {
      console.warn('[DELETE /api/users/:id] Attempted self-delete by:', id);
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      console.warn('[DELETE /api/users/:id] User not found:', id);
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    console.log('[DELETE /api/users/:id] Target user:', user.email, user.role);

    // Prevent deleting the last active admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
      console.log('[DELETE /api/users/:id] Active admin count:', adminCount);
      if (adminCount <= 1) {
        console.warn('[DELETE /api/users/:id] Cannot delete last active admin');
        return NextResponse.json({ error: 'Cannot delete the last active administrator.' }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id } });
    console.log('[DELETE /api/users/:id] User deleted successfully:', id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/users/:id] Database error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to delete user: ${message}` }, { status: 500 });
  }
}
