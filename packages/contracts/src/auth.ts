export const accountStatuses = ['enabled', 'disabled'] as const;
export type AccountStatus = (typeof accountStatuses)[number];

export const backendRoleCodes = ['admin', 'knowledge_operator', 'agent'] as const;
export type BackendRoleCode = (typeof backendRoleCodes)[number];

export const backendPermissions = [
  'account:manage',
  'knowledge:read',
  'knowledge:write',
  'conversation:read',
  'conversation:handle',
  'metrics:read',
] as const;
export type BackendPermission = (typeof backendPermissions)[number];

export interface LoginRequest {
  loginName: string;
  password: string;
}

export interface AuthenticatedAccount {
  id: string;
  loginName: string;
  displayName: string;
  status: AccountStatus;
  roles: BackendRoleCode[];
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  account: AuthenticatedAccount;
}
