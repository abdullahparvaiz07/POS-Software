import { api } from './api';
import { User, CapabilityType } from '../types';

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data.data.map((u: any) => ({
      ...u,
      full_name: u.fullName,
      status: u.status === 'ACTIVE' ? 'Active' : 'Inactive',
      joining_date: u.joiningDate,
      created_at: u.createdAt,
      capabilities: Array.isArray(u.userRoles) 
        ? u.userRoles.map((ur: any) => ur.role.name.charAt(0) + ur.role.name.slice(1).toLowerCase() as CapabilityType)
        : []
    }));
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    const u = response.data.data;
    return {
      ...u,
      full_name: u.fullName,
      status: u.status === 'ACTIVE' ? 'Active' : 'Inactive',
      joining_date: u.joiningDate,
      created_at: u.createdAt,
      capabilities: Array.isArray(u.userRoles) 
        ? u.userRoles.map((ur: any) => ur.role.name.charAt(0) + ur.role.name.slice(1).toLowerCase() as CapabilityType)
        : []
    };
  },

  createUser: async (data: Omit<User, 'id' | 'created_at'> & { password?: string }): Promise<User> => {
    // Map capability names to role IDs on backend
    // 1=ADMIN, 2=MANAGER, 3=CASHIER, 4=CHEF, 5=BARTENDER, 6=WAITER, 7=RIDER
    const roleMap: Record<string, number> = {
      'Admin': 1, 'Manager': 2, 'Cashier': 3, 'Chef': 4, 'Kitchen': 4, 
      'Bartender': 5, 'Bar': 5, 'Waiter': 6, 'Rider': 7
    };
    
    const payload = {
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      password: (data as any).password || "staff123", // default password if not provided
      salary: data.salary,
      address: data.address,
      joiningDate: data.joining_date,
      status: data.status.toUpperCase(),
      profilePhoto: data.photo,
      roles: data.capabilities.map(c => roleMap[c] || 6)
    };
    const response = await api.post('/users', payload);
    return response.data.data;
  },

  updateUser: async (id: number, data: Partial<User>): Promise<User> => {
    const roleMap: Record<string, number> = {
      'Admin': 1, 'Manager': 2, 'Cashier': 3, 'Chef': 4, 'Kitchen': 4, 
      'Bartender': 5, 'Bar': 5, 'Waiter': 6, 'Rider': 7
    };

    const payload: any = {};
    if (data.full_name) payload.fullName = data.full_name;
    if (data.email) payload.email = data.email;
    if (data.phone) payload.phone = data.phone;
    if (data.salary !== undefined) payload.salary = data.salary;
    if (data.address) payload.address = data.address;
    if (data.joining_date) payload.joiningDate = data.joining_date;
    if (data.photo) payload.profilePhoto = data.photo;
    
    if ((data as any).password) payload.password = (data as any).password;
    if (data.capabilities) payload.roles = data.capabilities.map(c => roleMap[c] || 6);
    if (data.status) payload.status = data.status.toUpperCase();
    
    const response = await api.patch(`/users/${id}`, payload);
    return response.data.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  toggleStatus: async (id: number, isActive: boolean): Promise<User> => {
    const response = await api.patch(`/users/${id}`, { status: isActive ? 'ACTIVE' : 'INACTIVE' });
    return response.data.data;
  }
};
