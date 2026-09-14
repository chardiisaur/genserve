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
  const authResult = await requireAdmin();
  if (isNextResponse(authResult)) return authResult;

  const { id } = await params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, updatedAt: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    console.error('[GET USER ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch user.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if (isNextResponse(authResult)) return authResult;

  const { id } = await params;
  try {
    const body = await req.json();
    const { name, email, role, status, newPassword, confirmPassword } = body as {
      name?: string;
      email?: string;
      role?: string;
      status?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (!email.trim()) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
      const emailLower = email.toLowerCase().trim();
      if (emailLower !== existing.email) {
        const emailConflict = await prisma.user.findUnique({ where: { email: emailLower } });
        if (emailConflict) return NextResponse.json({ error: 'Email already exists.' }, { status: 409 });
      }
      updateData.email = emailLower;
    }

    if (role !== undefined) {
      const validRoles = ['ADMIN', 'MANAGER', 'FIELD_TECHNICIAN'];
      if (!validRoles.includes(role)) return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
      updateData.role = role;
    }

    if (status !== undefined) {
      if (!['ACTIVE', 'INACTIVE'].includes(status)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
      // Prevent deactivating the last admin
      if (status === 'INACTIVE' && existing.role === 'ADMIN') {
        const activeAdmins = await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
        if (activeAdmins <= 1) {
          return NextResponse.json({ error: 'Cannot deactivate the last active administrator.' }, { status: 400 });
        }
      }
      updateData.status = status;
    }

    if (newPassword !== undefined && newPassword.trim()) {
      if (newPassword.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
      if (newPassword !== confirmPassword) return NextResponse.json({ error: 'Password confirmation does not match.' }, { status: 400 });
      updateData.passwordHash = await hashPw(newPassword);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, updatedAt: true },
    });

    // If the session user updated their own info, refresh session
    const session = await getSession();
    if (session.user?.id === id) {
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
    console.error('[PATCH USER ERROR]', err);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if (isNextResponse(authResult)) return authResult;

  const { id } = await params;
  try {
    const session = await getSession();
    if (session.user?.id === id) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    // Prevent deleting the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last active administrator.' }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE USER ERROR]', err);
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}
