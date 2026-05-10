import {
  backendPermissions,
  type AuthenticatedAccount,
  type BackendPermission,
  type BackendRoleCode,
} from '@znkfxt/contracts';
import type { RequestHandler } from 'express';
import { ForbiddenError, UnauthenticatedError } from '../errors/api-error.ts';
import { getAuthenticatedAccount } from './authenticated-account.ts';

const adminPermissions = new Set<BackendPermission>(backendPermissions);

const permissionsByRole: Record<BackendRoleCode, ReadonlySet<BackendPermission>> = {
  admin: adminPermissions,
  knowledge_operator: new Set<BackendPermission>([
    'knowledge:read',
    'knowledge:write',
    'conversation:read',
    'metrics:read',
  ]),
  agent: new Set<BackendPermission>(['conversation:handle']),
};

export function getBackendPermissionsForRoles(
  roles: readonly BackendRoleCode[],
): BackendPermission[] {
  const grantedPermissions = new Set<BackendPermission>();

  for (const role of roles) {
    for (const permission of permissionsByRole[role]) {
      grantedPermissions.add(permission);
    }
  }

  return backendPermissions.filter((permission) => grantedPermissions.has(permission));
}

export function hasBackendPermission(
  account: AuthenticatedAccount,
  permission: BackendPermission,
): boolean {
  return getBackendPermissionsForRoles(account.roles).includes(permission);
}

export function createRequireBackendPermissionMiddleware(
  permission: BackendPermission,
): RequestHandler {
  return (request, _response, next) => {
    try {
      const account = getAuthenticatedAccount(request);

      if (!account) {
        throw new UnauthenticatedError();
      }

      if (!hasBackendPermission(account, permission)) {
        throw new ForbiddenError();
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
