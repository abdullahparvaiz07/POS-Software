/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuthUser {
  id: number;
  fullName: string;
  phone: string;
  roles: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}
