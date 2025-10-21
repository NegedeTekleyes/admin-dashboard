// app/admin/complaints/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { complaintsAPI, techniciansAPI } from '@/lib/api';
import { Complaint, ComplaintStats } from '../../types/complaint';
import { storage } from '@/lib/storage';

const STATUS_OPTIONS = [
  'SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'
];

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'EMERGENCY', label: 'Emergency', color: 'bg-red-100 text-red-800' },
];

interface Technician {
  id: number;
  userId: number;
  user: {
    name: string;
    email: string;
  };
  speciality: string | null;
  status: string;
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    urgency: '',
    category: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | ''>('');
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

  // Fetch data
  useEffect(() => {
    fetchComplaints();
    fetchStats();
    fetchTechnicians();
  }, [filters]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await complaintsAPI.getAll(
        filters.page, 
        filters.limit, 
        filters.status || undefined,
        filters.urgency || undefined,
        filters.category || undefined
      );
      setComplaints(data.complaints || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      });
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await complaintsAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const data = await techniciansAPI.getAll(1, 100);
      setTechnicians(data.technicians || []);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

 const updateStatus = async (complaintId: number, newStatus: string, technicianId?: number, adminNotes?: string) => {
  try {
    await complaintsAPI.updateStatus(complaintId, newStatus, adminNotes);
    if (newStatus === 'ASSIGNED' && technicianId) {
      await complaintsAPI.assignTechnician(complaintId, technicianId);
    }
    await Promise.all([fetchComplaints(), fetchStats()]); // Refresh in parallel
    alert(`Status updated to ${newStatus}${technicianId ? ' and technician assigned' : ''}`);
  } catch (error: any) {
    console.error('Error updating status:', error);
    alert(`Failed to update status: ${error.message || 'Unknown error'}`);
  }
};

  const assignTechnician = async (complaintId: number, technicianId: number) => {
    try {
      setAssignLoading(true);
      await complaintsAPI.assignTechnician(complaintId, technicianId);
      setShowAssignModal(false);
      setSelectedComplaint(null);
      setSelectedTechnicianId('');
      fetchComplaints(); // Refresh list
      fetchStats(); // Refresh stats
      alert('Technician assigned successfully!');
    } catch (error: any) {
      console.error('Error assigning technician:', error);
      alert(error.message || 'Failed to assign technician');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setSelectedTechnicianId('');
    setShowAssignModal(true);
    setActionMenuOpen(null);
  };

  const handleViewClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowViewModal(true);
    setActionMenuOpen(null);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      SUBMITTED: 'bg-yellow-100 text-yellow-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-orange-100 text-orange-800',
      RESOLVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency: string) => {
    const urgencyOption = URGENCY_OPTIONS.find(u => u.value === urgency);
    return urgencyOption?.color || 'bg-gray-100 text-gray-800';
  };

  // Safe category formatter
  const formatCategory = (category: string | undefined | null): string => {
    if (!category) return 'Unknown';
    return category.replace(/_/g, ' ').toLowerCase();
  };

  // Safe status formatter
  const formatStatus = (status: string | undefined | null): string => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ');
  };

  // Safe urgency formatter
  const formatUrgency = (urgency: string | undefined | null): string => {
    if (!urgency) return 'Unknown';
    return urgency.toLowerCase();
  };

  // Fixed formatDate function - properly typed and returns string
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
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

  if (loading && complaints.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Complaints Management</h1>
          <p className="text-gray-600 mt-2">Manage and assign complaints to technicians</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Complaints</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.submitted}</div>
              <div className="text-sm text-gray-600">Submitted</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-blue-600">{stats.byStatus.assigned}</div>
              <div className="text-sm text-gray-600">Assigned</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-orange-600">{stats.byStatus.in_progress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-green-600">{stats.byStatus.resolved}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-red-600">{stats.byStatus.rejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
              <select
                value={filters.urgency}
                onChange={(e) => handleFilterChange('urgency', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Urgencies</option>
                {URGENCY_OPTIONS.map(urgency => (
                  <option key={urgency.value} value={urgency.value}>
                    {urgency.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="WATER_QUALITY">Water Quality</option>
                <option value="PIPE_LEAK">Pipe Leak</option>
                <option value="LOW_PRESSURE">Low Pressure</option>
                <option value="NO_WATER">No Water</option>
                <option value="SEWAGE_ISSUE">Sewage Issue</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', urgency: '', category: '', page: 1, limit: 10 })}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Complaint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {complaint.title || 'No Title'}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {complaint.description || 'No description'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'Unknown date'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {complaint.user?.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {complaint.user?.email || 'No email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCategory(complaint.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getUrgencyColor(complaint.urgency)
                      }`}>
                        {formatUrgency(complaint.urgency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={complaint.status || ''}
                        onChange={(e) => updateStatus(complaint.id, e.target.value)}
                        className={`text-sm font-medium rounded border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(complaint.status || 'SUBMITTED')}`}
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {complaint.tasks?.[0]?.technician?.user.name || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div 
                        ref={(el) => setActionMenuRef(complaint.id, el)}
                        className="relative inline-block text-left"
                      >
                        {/* Action Menu Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleActionMenu(complaint.id, e)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <span>Actions</span>
                          <svg 
                            className={`w-4 h-4 transition-transform ${actionMenuOpen === complaint.id ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {actionMenuOpen === complaint.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewClick(complaint);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition text-left"
                              >
                                <span className="text-green-600">👁️</span>
                                View Details
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssignClick(complaint);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition text-left"
                              >
                                <span className="text-blue-600">👤</span>
                                Assign Technician
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Are you sure you want to update the status?')) {
                                    const newStatus = prompt('Enter new status (SUBMITTED, ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED):');
                                    if (newStatus && STATUS_OPTIONS.includes(newStatus)) {
                                      updateStatus(complaint.id, newStatus);
                                    } else if (newStatus) {
                                      alert('Invalid status');
                                    }
                                  }
                                  setActionMenuOpen(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition text-left"
                              >
                                <span className="text-yellow-600">✏️</span>
                                Update Status
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {complaints.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
              <p className="text-gray-500">No complaints match your current filters.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFilterChange('page', (filters.page - 1).toString())}
                    disabled={filters.page <= 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleFilterChange('page', (filters.page + 1).toString())}
                    disabled={filters.page >= pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View Complaint Details Modal */}
        {showViewModal && selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Complaint Details</h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Basic Information */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Title</label>
                          <p className="text-gray-900 font-medium">{selectedComplaint.title || 'No Title'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Description</label>
                          <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedComplaint.description || 'No description'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Category</label>
                          <p className="text-gray-900 capitalize">{formatCategory(selectedComplaint.category)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Status & Urgency</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Status</span>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedComplaint.status || 'SUBMITTED')}`}>
                            {formatStatus(selectedComplaint.status)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Urgency</span>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(selectedComplaint.urgency)}`}>
                            {formatUrgency(selectedComplaint.urgency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - User & Assignment Info */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">User Information</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Name</label>
                          <p className="text-gray-900">{selectedComplaint.user?.name || 'Unknown User'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Email</label>
                          <p className="text-gray-900">{selectedComplaint.user?.email || 'No email'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Phone</label>
                          <p className="text-gray-900">{selectedComplaint.user?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Assignment Information</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Assigned Technician</label>
                          <p className="text-gray-900">
                            {selectedComplaint.tasks?.[0]?.technician?.user.name || 'Not assigned'}
                          </p>
                          {selectedComplaint.tasks?.[0]?.technician?.speciality && (
                            <p className="text-sm text-gray-600">
                              Speciality: {selectedComplaint.tasks[0].technician.speciality}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Created Date</label>
                          <p className="text-gray-900">
                            {selectedComplaint.createdAt ? formatDate(selectedComplaint.createdAt) : 'Unknown date'}
                          </p>
                        </div>
                        {selectedComplaint.updatedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Last Updated</label>
                            <p className="text-gray-900">{formatDate(selectedComplaint.updatedAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks History */}
                {selectedComplaint.tasks && selectedComplaint.tasks.length > 0 && (
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Task History</h4>
                    <div className="space-y-3">
                      {selectedComplaint.tasks.map((task, index) => (
                        <div key={task.id} className="border-l-4 border-blue-500 pl-4 py-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                Task #{index + 1} - {formatStatus(task.status)}
                              </p>
                              {task.technician && (
                                <p className="text-sm text-gray-600">
                                  Technician: {task.technician.user.name}
                                </p>
                              )}
                              {task.notes && (
                                <p className="text-sm text-gray-600 mt-1">Notes: {task.notes}</p>
                              )}
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <p>Created: {formatDate(task.createdAt)}</p>
                              {task.updatedAt && task.updatedAt !== task.createdAt && (
                                <p>Updated: {formatDate(task.updatedAt)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleAssignClick(selectedComplaint);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Assign Technician
                  </button>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Technician Modal */}
        {showAssignModal && selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Assign Technician</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Complaint:</p>
                <p className="font-medium">{selectedComplaint.title || 'No Title'}</p>
                <p className="text-sm text-gray-500">{selectedComplaint.description || 'No description'}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Technician
                </label>
                <select
                  value={selectedTechnicianId}
                  onChange={(e) => setSelectedTechnicianId(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a technician...</option>
                  {technicians
                    .filter(tech => tech.status === 'ACTIVE')
                    .map(tech => (
                      <option key={tech.id} value={tech.id}>
                        {tech.user.name} - {tech.speciality || 'General'}
                      </option>
                    ))
                  }
                </select>
                {technicians.filter(tech => tech.status === 'ACTIVE').length === 0 && (
                  <p className="text-sm text-red-500 mt-1">No active technicians available</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTechnicianId('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedTechnicianId) {
                      assignTechnician(selectedComplaint.id, selectedTechnicianId);
                    } else {
                      alert('Please select a technician');
                    }
                  }}
                  disabled={assignLoading || !selectedTechnicianId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assignLoading ? 'Assigning...' : 'Assign Technician'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}