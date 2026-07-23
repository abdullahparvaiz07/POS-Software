/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { api } from './api';
import { AuthUser, LoginResponse } from '../types/auth';

const SESSION_KEY = 'bubble_pos_session';
const REMEMBER_KEY = 'bubble_pos_remember';

export const authService = {
  /**
   * Authenticate user with username (phone) and password against backend API
   */
  async login(username: string, password: string, rememberMe: boolean = false): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/login', { phone: username, password });
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Store session token and user details in both storages for reliability
        localStorage.setItem('token', token);
        sessionStorage.setItem('token', token);
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        
        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, username);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }

        return {
          success: true,
          user
        };
      }
      return {
        success: false,
        error: response.data.message || 'Login failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Invalid username or password.',
      };
    }
  },

  /**
   * Retrieve active session, checking both localStorage and sessionStorage
   */
  getCurrentUser(): AuthUser | null {
    const sessionStr = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr) as AuthUser;
    } catch {
      return null;
    }
  },

  /**
   * Sign out active session
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore logout API errors
    } finally {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
  },

  /**
   * Check if there's a pre-saved remembered username
   */
  getRememberedUsername(): string {
    return localStorage.getItem(REMEMBER_KEY) || '';
  }
};
