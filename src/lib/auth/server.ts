import { NextRequest, NextResponse } from 'next/server';
import { db, Profile } from '@/lib/data/storage';

export interface ServerSession {
  actualUser: Profile | null;
  effectiveUser: Profile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  isSuspended: boolean;
  isImpersonating: boolean;
}

export function getServerSession(req: NextRequest): ServerSession {
  const userIdCookie = req.cookies.get('tatadana_user_id')?.value;
  const authHeader = req.headers.get('authorization');
  let tokenUserId = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    tokenUserId = authHeader.substring(7).trim();
  }

  const userId = tokenUserId || userIdCookie;

  if (!userId) {
    return {
      actualUser: null,
      effectiveUser: null,
      isAuthenticated: false,
      isAdmin: false,
      isApproved: false,
      isPending: false,
      isRejected: false,
      isSuspended: false,
      isImpersonating: false,
    };
  }

  const actualUser = db.getProfile(userId) || null;

  if (!actualUser) {
    return {
      actualUser: null,
      effectiveUser: null,
      isAuthenticated: false,
      isAdmin: false,
      isApproved: false,
      isPending: false,
      isRejected: false,
      isSuspended: false,
      isImpersonating: false,
    };
  }

  const isAdmin = (actualUser.role === 'admin' || actualUser.role === 'superadmin') && actualUser.approval_status === 'approved';

  // Check if admin is impersonating a user
  let effectiveUser = actualUser;
  let isImpersonating = false;

  const impersonatedUserId = req.cookies.get('tatadana_impersonated_user_id')?.value;
  if (isAdmin && impersonatedUserId && impersonatedUserId !== actualUser.id) {
    const targetUser = db.getProfile(impersonatedUserId);
    if (targetUser) {
      effectiveUser = targetUser;
      isImpersonating = true;
    }
  }

  return {
    actualUser,
    effectiveUser,
    isAuthenticated: true,
    isAdmin,
    isApproved: effectiveUser.approval_status === 'approved',
    isPending: effectiveUser.approval_status === 'pending',
    isRejected: effectiveUser.approval_status === 'rejected',
    isSuspended: effectiveUser.approval_status === 'suspended',
    isImpersonating,
  };
}
