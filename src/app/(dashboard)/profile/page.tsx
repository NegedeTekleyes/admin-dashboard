"use client";

import { useState, useEffect } from "react";
import { FaUserCircle, FaEdit, FaEnvelope, FaPhone, FaSave, FaTimes, FaLock, FaChartLine, FaComments, FaBell, FaSync, FaExclamationTriangle } from "react-icons/fa";
import { adminAPI } from '@/lib/api';

interface Admin {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  joinedDate: string;
  bio: string;
  avatar?: string;
}

interface AdminStats {
  totalReports: number;
  messagesSent: number;
  systemAlerts: number;
  resolvedComplaints: number;
}

const AdminProfilePage = () => {
  const [admin, setAdmin] = useState<Admin>({
    id: 0,
    name: "",
    email: "",
    phone: "",
    role: "",
    joinedDate: "",
    bio: "",
  });
  
  const [stats, setStats] = useState<AdminStats>({
    totalReports: 0,
    messagesSent: 0,
    systemAlerts: 0,
    resolvedComplaints: 0,
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [updatedAdmin, setUpdatedAdmin] = useState<Admin>(admin);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch admin data and stats
  useEffect(() => {
    fetchAdminData();
    fetchAdminStats();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError("");
      const adminData = await adminAPI.getProfile();
      setAdmin(adminData);
      setUpdatedAdmin(adminData);
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      setError(error.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const statsData = await adminAPI.getStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      // Don't set error for stats failure as it's secondary data
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Validate required fields
      if (!updatedAdmin.name.trim() || !updatedAdmin.email.trim()) {
        setError("Name and email are required");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updatedAdmin.email)) {
        setError("Please enter a valid email address");
        return;
      }

      // Prepare update data (only include changed fields)
      const updateData: any = {};
      if (updatedAdmin.name !== admin.name) updateData.name = updatedAdmin.name;
      if (updatedAdmin.email !== admin.email) updateData.email = updatedAdmin.email;
      if (updatedAdmin.phone !== admin.phone) updateData.phone = updatedAdmin.phone;
      if (updatedAdmin.bio !== admin.bio) updateData.bio = updatedAdmin.bio;

      // Only send request if there are changes
      if (Object.keys(updateData).length > 0) {
        const updatedData = await adminAPI.updateProfile(updateData);
        setAdmin(updatedData);
        setSuccess("Profile updated successfully!");
      } else {
        setSuccess("No changes detected.");
      }
      
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUpdatedAdmin(admin);
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleChangePassword = async () => {
    const newPassword = prompt("Enter new password:");
    if (newPassword) {
      if (newPassword.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
      }

      const confirmPassword = prompt("Confirm new password:");
      if (newPassword !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      try {
        await adminAPI.changePassword(newPassword);
        alert("Password changed successfully!");
      } catch (error: any) {
        alert(error.message || "Failed to change password");
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleInputChange = (field: keyof Admin, value: string) => {
    setUpdatedAdmin(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <FaUserCircle className="text-blue-500 text-2xl" />
              </div>
              Admin Profile
            </h1>
            <p className="text-gray-600 mt-2">Manage your account details and settings</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 disabled:opacity-50"
            >
              <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              disabled={loading}
              className={`flex items-center px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 ${
                isEditing 
                  ? "bg-gray-600 text-white hover:bg-gray-700" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isEditing ? (
                <>
                  <FaTimes className="mr-2" /> Cancel
                </>
              ) : (
                <>
                  <FaEdit className="mr-2" /> Edit Profile
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start">
            <FaExclamationTriangle className="mt-0.5 mr-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="md:flex">
            {/* Profile Picture & Basic Info */}
            <div className="md:w-1/3 bg-gradient-to-b from-blue-600 to-indigo-700 text-white p-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  {admin.avatar ? (
                    <img 
                      src={admin.avatar} 
                      alt={admin.name}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <FaUserCircle className="text-white/90" size={128} />
                  )}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <h2 className="mt-6 text-2xl font-bold">{admin.name || "Unknown User"}</h2>
                <p className="text-blue-100 mt-1">{admin.role || "Administrator"}</p>
                <p className="text-blue-200 text-sm mt-2">
                  Joined {admin.joinedDate ? formatDate(admin.joinedDate) : "Unknown date"}
                </p>

                <button 
                  onClick={handleChangePassword}
                  className="mt-6 flex items-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all w-full justify-center"
                >
                  <FaLock className="mr-2" /> Change Password
                </button>
              </div>
            </div>

            {/* Info Section */}
            <div className="md:w-2/3 p-8">
              {isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={updatedAdmin.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={updatedAdmin.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={updatedAdmin.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        value={updatedAdmin.role}
                        readOnly
                        className="w-full border border-gray-300 bg-gray-50 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={updatedAdmin.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-32"
                      placeholder="Tell us about yourself..."
                    ></textarea>
                    <p className="text-sm text-gray-500 mt-1">
                      {updatedAdmin.bio.length}/500 characters
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <FaSave className="mr-2" /> 
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <FaEnvelope className="text-blue-600 text-lg" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="text-gray-800 font-medium">{admin.email || "Not provided"}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <FaPhone className="text-green-600 text-lg" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="text-gray-800 font-medium">{admin.phone || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">About</h3>
                    <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                      <p className="text-gray-700 leading-relaxed">
                        {admin.bio || "No bio provided yet."}
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Activity Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center group hover:shadow-lg transition-all cursor-pointer">
                        <div className="p-3 bg-blue-500 rounded-lg w-12 h-12 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <FaChartLine className="text-white text-lg" />
                        </div>
                        <p className="text-sm text-blue-600 font-semibold">Total Reports</p>
                        <p className="text-2xl font-bold text-blue-700">{stats.totalReports.toLocaleString()}</p>
                      </div>
                      
                      <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center group hover:shadow-lg transition-all cursor-pointer">
                        <div className="p-3 bg-green-500 rounded-lg w-12 h-12 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <FaComments className="text-white text-lg" />
                        </div>
                        <p className="text-sm text-green-600 font-semibold">Messages</p>
                        <p className="text-2xl font-bold text-green-700">{stats.messagesSent.toLocaleString()}</p>
                      </div>
                      
                      <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-center group hover:shadow-lg transition-all cursor-pointer">
                        <div className="p-3 bg-orange-500 rounded-lg w-12 h-12 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <FaBell className="text-white text-lg" />
                        </div>
                        <p className="text-sm text-orange-600 font-semibold">Alerts</p>
                        <p className="text-2xl font-bold text-orange-700">{stats.systemAlerts.toLocaleString()}</p>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-center group hover:shadow-lg transition-all cursor-pointer">
                        <div className="p-3 bg-purple-500 rounded-lg w-12 h-12 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <FaUserCircle className="text-white text-lg" />
                        </div>
                        <p className="text-sm text-purple-600 font-semibold">Resolved</p>
                        <p className="text-2xl font-bold text-purple-700">{stats.resolvedComplaints.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;