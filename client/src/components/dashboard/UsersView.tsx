/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { User, CapabilityType } from '../../types';
import { formatPKR } from './StatisticsCards';
import { 
  Users, Phone, MapPin, DollarSign, Calendar, ShieldCheck, Mail, Plus, Search, 
  Filter, MoreVertical, Edit2, Trash2, Eye, Key, X, Check, EyeOff, UserCheck, 
  UserMinus, Shield, Award, ClipboardList, CheckCircle2, AlertTriangle, Sparkles,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';

export const UsersView: React.FC = () => {
  const { addNotification, currentUser, orders } = useDashboard();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAllUsers,
  });

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification('success', 'User created successfully');
      setIsAddModalOpen(false);
    },
    onError: (error: any) => {
      addNotification('error', error.response?.data?.message || 'Failed to create user');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; user: Partial<User> }) => userService.updateUser(data.id, data.user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification('success', 'User updated successfully');
      setIsAddModalOpen(false);
      setIsDrawerOpen(false);
    },
    onError: (error: any) => {
      addNotification('error', error.response?.data?.message || 'Failed to update user');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification('success', 'User deleted successfully');
      setIsDrawerOpen(false);
    },
    onError: (error: any) => {
      addNotification('error', error.response?.data?.message || 'Failed to delete user');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (data: { id: number; isActive: boolean }) => userService.toggleStatus(data.id, data.isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification('success', 'User status updated');
    },
    onError: (error: any) => {
      addNotification('error', error.response?.data?.message || 'Failed to update status');
    }
  });

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [capabilityFilter, setCapabilityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Selected User state for View Drawer / Edit Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: 'staff123',
    address: '',
    salary: 50000,
    joining_date: new Date().toISOString().split('T')[0],
    status: 'Active' as 'Active' | 'Inactive',
    photo: '',
    capabilities: [] as CapabilityType[],
    last_active: 'Never'
  });

  // Role Capability Options
  const capabilityOptions: CapabilityType[] = ['Admin', 'Manager', 'Cashier', 'Kitchen', 'Bar', 'Waiter', 'Rider'];

  const getCapabilityBadge = (cap: CapabilityType) => {
    switch (cap) {
      case 'Cashier':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Kitchen':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Bar':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'Waiter':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Rider':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCapabilityDotColor = (cap: CapabilityType) => {
    switch (cap) {
      case 'Cashier':
        return 'bg-purple-500';
      case 'Kitchen':
        return 'bg-orange-500';
      case 'Bar':
        return 'bg-pink-500';
      case 'Waiter':
        return 'bg-blue-500';
      case 'Rider':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-500';
    }
  };

  // Quick statistics calculation
  const totalUsers = users.length;
  const activeCount = users.filter(u => u.status === 'Active').length;
  const inactiveCount = users.filter(u => u.status === 'Inactive').length;

  const getCapabilityCount = (cap: CapabilityType) => {
    return users.filter(u => u.capabilities.includes(cap)).length;
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCapability = capabilityFilter === 'All' || u.capabilities.includes(capabilityFilter as CapabilityType);
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

    return matchesSearch && matchesCapability && matchesStatus;
  });

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      address: user.address,
      salary: user.salary,
      joining_date: user.joining_date,
      status: user.status,
      photo: user.photo,
      capabilities: [...user.capabilities],
      last_active: user.last_active || 'Never'
    });
    setIsEditMode(true);
    setIsAddModalOpen(true);
    setActiveDropdownId(null);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      password: 'staff123',
      address: '',
      salary: 45000,
      joining_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      photo: '',
      capabilities: [],
      last_active: 'Never'
    });
    setIsEditMode(false);
    setIsAddModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone || !formData.email) {
      alert('Full Name, Phone, and Email are required.');
      return;
    }
    if (formData.capabilities.length === 0) {
      alert('Please select at least one capability role.');
      return;
    }

    if (isEditMode && selectedUser) {
      updateMutation.mutate({
        id: selectedUser.id,
        user: formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Handle Capability checkbox change
  const handleCapabilityChange = (cap: CapabilityType) => {
    setFormData(prev => {
      const alreadyChecked = prev.capabilities.includes(cap);
      const updated = alreadyChecked 
        ? prev.capabilities.filter(c => c !== cap) 
        : [...prev.capabilities, cap];
      return { ...prev, capabilities: updated };
    });
  };

  // Handle Reset Password (production-ready)
  const handleResetPassword = (user: User) => {
    setActiveDropdownId(null);
    updateMutation.mutate({
      id: user.id,
      user: { password: 'StaffPassword123!' } as any
    }, {
      onSuccess: () => {
        addNotification('success', `Password for ${user.full_name} has been reset to "StaffPassword123!".`);
        alert(`Security credentials reset successfully.\nThe new temporary password for ${user.full_name} is: StaffPassword123!`);
      }
    });
  };

  // Handle Delete user
  const handleDelete = (userId: number) => {
    if (confirm('Are you sure you want to remove this user from the restaurant record? This is irreversible.')) {
      deleteMutation.mutate(userId);
      setActiveDropdownId(null);
    }
  };

  // Open View Profile Drawer
  const handleOpenDrawer = (user: User) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
    setActiveDropdownId(null);
  };

  // Generate initials for profile fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Query recent assigned orders from the database
  const getRecentAssignedOrders = (user: User) => {
    const userOrders = (orders || []).filter(o => 
      o.waiter_id === user.id || 
      o.delivery_rider_id === user.id || 
      o.assigned_staff_id === user.id
    ).slice(0, 5);

    if (userOrders.length === 0) {
      return [
        { id: 'N/A', date: 'No activity logged yet', type: 'No assigned orders', amount: 0, status: 'Completed' }
      ];
    }

    return userOrders.map(o => ({
      id: o.order_number,
      date: new Date(o.created_at).toLocaleString(),
      type: `${o.order_type} ${o.table_number ? `(Table ${o.table_number})` : ''}`,
      amount: o.total_amount,
      status: o.status
    }));
  };

  const canMutate = true; // Always allow adding and editing staff members
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div id="users-module-container" className="space-y-6">
      
      {/* 1. Quick Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Employees</p>
              <h3 className="font-display text-2xl font-black text-slate-800 mt-1">{totalUsers}</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-bold">
              {activeCount} Active
            </span>
            <span>&bull;</span>
            <span className="text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md font-bold">
              {inactiveCount} On Leave
            </span>
          </div>
        </div>

        {/* Front-of-House Waiters / Riders */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service & Dispatch</p>
              <h3 className="font-display text-2xl font-black text-slate-800 mt-1">
                {getCapabilityCount('Waiter') + getCapabilityCount('Rider')}
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex gap-3 text-xs text-slate-500 font-semibold">
            <span className="text-blue-600">{getCapabilityCount('Waiter')} Waiters</span>
            <span className="text-emerald-600">{getCapabilityCount('Rider')} Riders</span>
          </div>
        </div>

        {/* Back-of-House Kitchen & Bar */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Culinary & Beverages</p>
              <h3 className="font-display text-2xl font-black text-slate-800 mt-1">
                {getCapabilityCount('Kitchen') + getCapabilityCount('Bar')}
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex gap-3 text-xs text-slate-500 font-semibold">
            <span className="text-orange-600">{getCapabilityCount('Kitchen')} Kitchen</span>
            <span className="text-pink-600">{getCapabilityCount('Bar')} Bar staff</span>
          </div>
        </div>

        {/* Finance & Cashier */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">POS & Management</p>
              <h3 className="font-display text-2xl font-black text-slate-800 mt-1">{getCapabilityCount('Cashier')}</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg font-bold w-fit">
            <Sparkles className="h-3 w-3" /> Cashier Accounts
          </div>
        </div>
      </div>

      {/* 2. Controls & List View Container */}
      <div id="users-table-card" className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        
        {/* Table/Section Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-black text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Staff & Employee Management ({filteredUsers.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Define employee security roles (Waiters, Delivery Riders, Cashiers, Chefs, Managers), manage credentials & salary</p>
          </div>

          <button 
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add New Staff Member
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-white">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {/* Capability Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={capabilityFilter}
                onChange={(e) => setCapabilityFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-600 focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Capabilities</option>
                {capabilityOptions.map(opt => (
                  <option key={`filter-cap-${opt}`} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-600 focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/30 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Avatar & Full Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">System Capabilities</th>
                <th className="px-6 py-4">Employment Status</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4">Joining Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-medium">
                    No restaurant users found matching your search and filter options.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr 
                    key={`user-row-${user.id}`} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDrawer(user)}
                  >
                    {/* Avatar & Name */}
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        {user.photo ? (
                          <img 
                            src={user.photo} 
                            alt={user.full_name} 
                            className="h-10 w-10 rounded-full border border-slate-200 object-cover shadow-xs shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-black text-sm border border-orange-200 shadow-xs">
                            {getInitials(user.full_name)}
                          </div>
                        )}
                        <div>
                          <p className="font-display text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                            {user.full_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                            Employee ID: #{user.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="px-6 py-4.5 text-xs text-slate-600">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{user.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Capabilities Badges */}
                    <td className="px-6 py-4.5">
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {user.capabilities.map(cap => (
                          <span 
                            key={`badge-cap-${user.id}-${cap}`}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-display text-[9px] font-bold ${getCapabilityBadge(cap)}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${getCapabilityDotColor(cap)}`} />
                            {cap}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        user.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {user.status === 'Active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Last Active */}
                    <td className="px-6 py-4.5 text-xs text-slate-600 font-medium">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold ${
                        user.last_active === 'Active Now'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-slate-50 text-slate-600 border border-slate-150'
                      }`}>
                        {user.last_active === 'Active Now' && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                        )}
                        {user.last_active || 'Never'}
                      </span>
                    </td>

                    {/* Joining Date */}
                    <td className="px-6 py-4.5 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{user.joining_date}</span>
                      </div>
                    </td>

                    {/* Actions dropdown */}
                    <td className="px-6 py-4.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setActiveDropdownId(activeDropdownId === user.id ? null : user.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="h-4.5 w-4.5" />
                        </button>

                        {activeDropdownId === user.id && (
                          <>
                            {/* Overlay shield to detect clicking out */}
                            <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                            
                            <div className="absolute right-0 mt-1 w-48 rounded-xl border border-slate-200 bg-white shadow-lg z-50 py-1.5 text-left text-xs text-slate-700 font-semibold animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={() => handleOpenDrawer(user)}
                                className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-50 transition-colors text-slate-600"
                              >
                                <Eye className="h-4 w-4 text-slate-400" /> View Profile Details
                              </button>
                              <button
                                onClick={() => handleOpenEdit(user)}
                                className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-50 transition-colors text-slate-600"
                              >
                                <Edit2 className="h-4 w-4 text-slate-400" /> Edit Credentials
                              </button>
                              <button
                                onClick={() => handleResetPassword(user)}
                                className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-50 transition-colors text-slate-600"
                              >
                                <Key className="h-4 w-4 text-slate-400" /> Reset Password
                              </button>
                              <button
                                onClick={() => {
                                  toggleStatusMutation.mutate({ id: user.id, isActive: user.status !== 'Active' });
                                  setActiveDropdownId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-50 transition-colors text-slate-600"
                              >
                                {user.status === 'Active' ? (
                                  <>
                                    <UserMinus className="h-4 w-4 text-slate-400" /> Deactivate Access
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 text-slate-400" /> Activate Access
                                  </>
                                )}
                              </button>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-red-50 text-red-600 transition-colors"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" /> Delete Record
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Sliding Profile Details Drawer */}
      {isDrawerOpen && selectedUser && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-orange-500" />
                  <span className="font-display font-black text-sm text-slate-800 uppercase tracking-wide">POS Security File</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
                {/* Large Photo & Primary details */}
                <div className="flex flex-col items-center text-center space-y-3 pb-5 border-b border-slate-100">
                  {selectedUser.photo ? (
                    <img 
                      src={selectedUser.photo} 
                      alt={selectedUser.full_name} 
                      className="h-24 w-24 rounded-full border-2 border-orange-100 shadow-md object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-black text-3xl border-2 border-orange-200 shadow-md">
                      {getInitials(selectedUser.full_name)}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-display text-lg font-extrabold text-slate-800">{selectedUser.full_name}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">System ID: #{selectedUser.id}</p>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    selectedUser.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedUser.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {selectedUser.status === 'Active' ? 'Active Status' : 'Suspended Status'}
                  </span>
                </div>

                {/* Assigned System Capabilities */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Capabilities</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.capabilities.map(cap => (
                      <span 
                        key={`drawer-cap-${cap}`}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-xs font-bold ${getCapabilityBadge(cap)}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${getCapabilityDotColor(cap)}`} />
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Personal & Account Details */}
                <div className="space-y-3 bg-slate-50 p-4.5 rounded-2xl border border-slate-150">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Profile & HR Info</h4>
                  
                  {/* Email */}
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-medium">Email Address</span>
                    <span className="text-slate-800 font-bold">{selectedUser.email}</span>
                  </div>

                  {/* Phone */}
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-medium">Phone Number</span>
                    <span className="text-slate-800 font-bold">{selectedUser.phone}</span>
                  </div>

                  {/* Monthly Salary */}
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-medium">Monthly Salary</span>
                    <span className="text-slate-800 font-mono font-bold">{formatPKR(selectedUser.salary)}</span>
                  </div>

                  {/* Joining Date */}
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-medium">Hiring Date</span>
                    <span className="text-slate-800 font-bold">{selectedUser.joining_date}</span>
                  </div>

                  {/* Last Active Status */}
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-medium">Last Active Status</span>
                    <span className={`inline-flex items-center gap-1.5 font-bold ${
                      selectedUser.last_active === 'Active Now' ? 'text-emerald-700' : 'text-slate-700'
                    }`}>
                      {selectedUser.last_active === 'Active Now' && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                      )}
                      {selectedUser.last_active || 'Never'}
                    </span>
                  </div>

                  {/* Residential Address */}
                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-slate-400 font-medium shrink-0">Residential Address</span>
                    <span className="text-slate-800 font-medium text-right ml-4">{selectedUser.address}</span>
                  </div>
                </div>

                {/* Simulated Recent Dispatch Orders / Activity */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Operational Activity</h4>
                  <div className="space-y-2">
                    {getRecentAssignedOrders(selectedUser).map(order => (
                      <div key={order.id} className="flex items-center justify-between border border-slate-100 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{order.type}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{order.date} &bull; {order.id}</p>
                        </div>
                        <div className="text-right">
                          {order.amount > 0 && <p className="text-xs font-mono font-bold text-slate-700">{formatPKR(order.amount)}</p>}
                          <span className={`inline-block text-[9px] font-black uppercase tracking-wider mt-0.5 ${
                            order.status === 'Completed' ? 'text-emerald-500' : 'text-orange-500'
                          }`}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOpenEdit(selectedUser)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white py-2.5 font-display text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-400" /> Edit Profile
              </button>
              <button
                onClick={() => toggleStatusMutation.mutate({ id: selectedUser.id, isActive: selectedUser.status !== 'Active' })}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-display text-xs font-bold text-white transition-all cursor-pointer ${
                  selectedUser.status === 'Active' 
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-100' 
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-100'
                }`}
              >
                {selectedUser.status === 'Active' ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" /> Suspend User
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" /> Enable User
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleResetPassword(selectedUser)}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 py-2.5 font-display text-xs font-bold text-white transition-all cursor-pointer shadow-sm shadow-orange-100 mt-1"
              >
                <Key className="h-3.5 w-3.5" /> Dispatch Password Reset Hook
              </button>
            </div>
          </div>
        </>
      )}

      {/* 4. Add User / Edit User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wide">
                  {isEditMode ? 'Modify Employee Profile' : 'Register New Employee Access'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Photo Input (Optional URL) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Profile Photo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... (leave empty for initials)"
                  value={formData.photo}
                  onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Ahmed Ali"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Registered Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="E.g. ahmed@bubblepos.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Phone & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. +92 300 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>
                {!isEditMode && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Login Password / PIN *</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter password..."
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Joining Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Hiring / Joining Date</label>
                  <input
                    type="date"
                    required
                    value={formData.joining_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, joining_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Employment Access Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Active">Active Access</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  placeholder="E.g. House #14, Street 2, Gulberg III, Lahore"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Multi-capabilities Checkbox Group */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Account Capabilities / Security Roles * <span className="text-[9px] text-slate-400 font-normal lowercase">(select one or more)</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {capabilityOptions.map(cap => {
                    const checked = formData.capabilities.includes(cap);
                    return (
                      <button
                        type="button"
                        key={`form-cap-checkbox-${cap}`}
                        onClick={() => handleCapabilityChange(cap)}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs text-left transition-all cursor-pointer ${
                          checked 
                            ? 'bg-orange-50/55 border-orange-300 text-orange-950 font-bold shadow-xs' 
                            : 'bg-slate-50/40 border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                          checked ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {checked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span>{cap}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 font-display text-xs font-bold text-white shadow-md shadow-orange-100 transition-all cursor-pointer"
                >
                  {isEditMode ? 'Commit Upgrades' : 'Provision User Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
