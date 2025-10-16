// src/app/(dashboard)/technicians/page.tsx
'use client';

import { apiRequest } from '@/lib/api';
import React, { useState, useEffect, useRef } from 'react';

interface Technician {
  id: number;
  userId: number;
  speciality: string;
  status: 'ACTIVE' | 'INACTIVE';
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    lastLogin: string;
    createdAt: string;
  };
  stats?: {
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    efficiency: number;
  };
}

interface CreateTechnicianData {
  name: string;
  email: string;
  password: string;
  phone: string;
  speciality: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const TechniciansManagement = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [formData, setFormData] = useState<CreateTechnicianData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    speciality: '',
    status: 'ACTIVE'
  });
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);
  const actionMenuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutsideAllMenus = Object.values(actionMenuRefs.current).every(
        (ref) => ref && !ref.contains(event.target as Node)
      );
      
      if (clickedOutsideAllMenus) {
        setActionMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch technicians
  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        ...(filters.status && { status: filters.status })
      });

      const data = await apiRequest(`/technicians?${params}`);
      setTechnicians(data.technicians || []);
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
      alert('Failed to fetch technicians');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, [filters]);

  // Create new technician with email and password
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      await apiRequest('/technicians', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      alert('Technician created successfully!');
      setModalVisible(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        speciality: '',
        status: 'ACTIVE'
      });
      fetchTechnicians();
    } catch (error: any) {
      alert(error.message || 'Failed to create technician');
    }
  };

  // Update technician (without changing password)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTechnician) return;

    try {
      const updateData = {
        speciality: formData.speciality,
        status: formData.status
      };

      await apiRequest(`/technicians/${selectedTechnician.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      alert('Technician updated successfully!');
      setModalVisible(false);
      setSelectedTechnician(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        speciality: '',
        status: 'ACTIVE'
      });
      fetchTechnicians();
    } catch (error: any) {
      alert(error.message || 'Failed to update technician');
    }
  };

  // Delete technician
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this technician?')) return;
    
    try {
      await apiRequest(`/technicians/${id}`, {
        method: 'DELETE'
      });

      alert('Technician deleted successfully');
      fetchTechnicians();
    } catch (error: any) {
      alert(error.message || 'Failed to delete technician');
    }
  };

  // Reset password for technician
  const handleResetPassword = async (technicianId: number) => {
    const newPassword = prompt('Enter new password for this technician:');
    
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      await apiRequest(`/technicians/${technicianId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password: newPassword })
      });

      alert('Password reset successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to reset password');
    }
  };

  // Stats calculation
  const stats = {
    total: technicians.length,
    active: technicians.filter(t => t.status === 'ACTIVE').length,
    averageEfficiency: technicians.length > 0 
      ? technicians.reduce((sum, t) => sum + (t.stats?.efficiency || 0), 0) / technicians.length 
      : 0,
    totalTasks: technicians.reduce((sum, t) => sum + (t.stats?.totalTasks || 0), 0)
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === 'ACTIVE' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {status}
      </span>
    );
  };

  const getSpecialityBadge = (speciality: string) => {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {speciality || 'GENERAL'}
      </span>
    );
  };

  // Toggle action menu
  const toggleActionMenu = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActionMenuOpen(actionMenuOpen === id ? null : id);
  };

  // Set ref for each action menu
  const setActionMenuRef = (id: number, el: HTMLDivElement | null) => {
    actionMenuRefs.current[id] = el;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technician Management</h1>
          <p className="text-gray-600">Manage and monitor your technical team</p>
        </div>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          onClick={() => {
            setSelectedTechnician(null);
            setFormData({
              name: '',
              email: '',
              password: '',
              phone: '',
              speciality: '',
              status: 'ACTIVE'
            });
            setModalVisible(true);
          }}
        >
          <span>+</span>
          Add Technician
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600">👤</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Technicians</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600">✅</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Technicians</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-orange-600">📈</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(stats.averageEfficiency)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600">⏰</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          
          <input
            type="text"
            placeholder="Search technicians..."
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          
          <button 
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            onClick={() => {
              setFilters({ status: '', search: '' });
              fetchTechnicians();
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Technicians Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technician
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Speciality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : technicians.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No technicians found
                  </td>
                </tr>
              ) : (
                technicians.map((technician) => (
                  <tr key={technician.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-gray-900">{technician.user.name}</div>
                        <div className="text-gray-500 text-sm">{technician.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {technician.user.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSpecialityBadge(technician.speciality)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(technician.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Efficiency:</span>
                          <span className="font-semibold">
                            {technician.stats?.efficiency || 0}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Tasks:</span>
                          <span>
                            {technician.stats?.completedTasks || 0}/{technician.stats?.totalTasks || 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {technician.user.lastLogin 
                        ? new Date(technician.user.lastLogin).toLocaleDateString() 
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div 
                        ref={(el) => setActionMenuRef(technician.id, el)}
                        className="relative inline-block text-left"
                      >
                        {/* Action Menu Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleActionMenu(technician.id, e)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <span>Actions</span>
                          <svg 
                            className={`w-4 h-4 transition-transform ${actionMenuOpen === technician.id ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {actionMenuOpen === technician.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTechnician(technician);
                                  setViewModalVisible(true);
                                  setActionMenuOpen(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition text-left"
                              >
                                <span className="text-gray-400">👁️</span>
                                View Details
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTechnician(technician);
                                  setFormData({
                                    name: technician.user.name,
                                    email: technician.user.email,
                                    password: '',
                                    phone: technician.user.phone || '',
                                    speciality: technician.speciality,
                                    status: technician.status
                                  });
                                  setModalVisible(true);
                                  setActionMenuOpen(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition text-left"
                              >
                                <span className="text-yellow-600">✏️</span>
                                Edit Technician
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResetPassword(technician.id);
                                  setActionMenuOpen(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition text-left"
                              >
                                <span className="text-green-600">🔑</span>
                                Reset Password
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(technician.id);
                                  setActionMenuOpen(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition text-left"
                              >
                                <span className="text-red-600">🗑️</span>
                                Delete Technician
                              </button>
                            </div>
                          </div>
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

      {/* Add/Edit Technician Modal */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedTechnician ? 'Edit Technician' : 'Add New Technician'}
            </h2>
            <form onSubmit={selectedTechnician ? handleUpdate : handleCreate} className="space-y-4">
              {!selectedTechnician ? (
                // Create form - with email and password
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter password (min 6 characters)"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </>
              ) : (
                // Edit form - show current info but don't allow changing email/password
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <p><strong>Name:</strong> {selectedTechnician.user.name}</p>
                  <p><strong>Email:</strong> {selectedTechnician.user.email}</p>
                  <p><strong>Phone:</strong> {selectedTechnician.user.phone || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    To change email or password, use the reset password feature.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Speciality
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.speciality}
                  onChange={(e) => setFormData(prev => ({ ...prev, speciality: e.target.value }))}
                  required
                >
                  <option value="">Select Speciality *</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="CARPENTRY">Carpentry</option>
                  <option value="PAINTING">Painting</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="GARDENING">Gardening</option>
                  <option value="GENERAL">General Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))}
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  onClick={() => {
                    setModalVisible(false);
                    setSelectedTechnician(null);
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      phone: '',
                      speciality: '',
                      status: 'ACTIVE'
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedTechnician ? 'Update Technician' : 'Create Technician'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Technician Details Modal */}
      {viewModalVisible && selectedTechnician && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Technician Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Personal Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {selectedTechnician.user.name}</p>
                    <p><strong>Email:</strong> {selectedTechnician.user.email}</p>
                    <p><strong>Phone:</strong> {selectedTechnician.user.phone || 'N/A'}</p>
                    <p><strong>User ID:</strong> {selectedTechnician.user.id}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Professional Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Speciality:</strong> {selectedTechnician.speciality || 'General'}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedTechnician.status)}</p>
                    <p><strong>Technician ID:</strong> {selectedTechnician.id}</p>
                    <p><strong>Member Since:</strong> {new Date(selectedTechnician.user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              {selectedTechnician.stats && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Performance Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{selectedTechnician.stats.totalTasks}</p>
                      <p className="text-sm text-gray-600">Total Tasks</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{selectedTechnician.stats.completedTasks}</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{selectedTechnician.stats.activeTasks}</p>
                      <p className="text-sm text-gray-600">Active</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{selectedTechnician.stats.efficiency}%</p>
                      <p className="text-sm text-gray-600">Efficiency</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 space-x-2">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                onClick={() => handleResetPassword(selectedTechnician.id)}
              >
                Reset Password
              </button>
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                onClick={() => setViewModalVisible(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechniciansManagement;