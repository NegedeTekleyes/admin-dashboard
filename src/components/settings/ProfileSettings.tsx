// components/settings/ProfileSettings.tsx
import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaSave, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import { adminAPI } from '@/lib/api';

interface ProfileSettingsProps {
  showMessage: (type: string, text: string) => void;
}

interface Admin {
  id: number;
  name: string;
  userId: number;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    lastLogin: string;
    createdAt: string;
  };
}

export function ProfileSettings({ showMessage }: ProfileSettingsProps) {
  const [admin, setAdmin] = useState<Admin>({
    id: 0,
    name: "",
    userId: 0,
  });
  
  const [updatedAdmin, setUpdatedAdmin] = useState<Admin>({
    id: 0,
    name: "",
    userId: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const adminData = await adminAPI.getProfile();
      setAdmin(adminData);
      setUpdatedAdmin(adminData);
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      const errorMessage = error.message || "Failed to load profile data";
      setError(errorMessage);
      showMessage('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Get current values
      const currentName = admin.user?.name || admin.name;
      const currentEmail = admin.user?.email || "";
      const currentPhone = admin.user?.phone || "";

      // Get updated values
      const updatedName = updatedAdmin.user?.name || updatedAdmin.name;
      const updatedEmail = updatedAdmin.user?.email || "";
      const updatedPhone = updatedAdmin.user?.phone || "";

      // Validate required fields
      if (!updatedName.trim()) {
        setError("Name is required");
        return;
      }

      // Email validation
      if (updatedEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updatedEmail)) {
          setError("Please enter a valid email address");
          return;
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (updatedName !== currentName) updateData.name = updatedName;
      if (updatedEmail !== currentEmail) updateData.email = updatedEmail;
      if (updatedPhone !== currentPhone) updateData.phone = updatedPhone;

      // Only send request if there are changes
      if (Object.keys(updateData).length > 0) {
        const updatedData = await adminAPI.updateProfile(updateData);
        setAdmin(updatedData);
        setSuccess("Profile updated successfully!");
        showMessage('success', 'Profile updated successfully!');
      } else {
        setSuccess("No changes detected.");
        showMessage('info', 'No changes detected.');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.message || "Failed to update profile";
      setError(errorMessage);
      showMessage('error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUpdatedAdmin(admin);
    setError("");
    setSuccess("");
  };

  const handleUserInputChange = (field: keyof NonNullable<Admin['user']>, value: string) => {
    setUpdatedAdmin(prev => ({
      ...prev,
      user: {
        ...prev.user,
        [field]: value,
        id: prev.user?.id || 0,
        name: prev.user?.name || "",
        email: prev.user?.email || "",
        phone: prev.user?.phone || "",
        lastLogin: prev.user?.lastLogin || "",
        createdAt: prev.user?.createdAt || ""
      }
    }));
  };

  // Helper functions to get display values
  const displayName = admin.user?.name || admin.name || "Unknown User";
  const displayEmail = admin.user?.email || "Not provided";
  const displayPhone = admin.user?.phone || "Not provided";

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
          <p className="text-gray-600">Manage your personal information</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchProfile}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 disabled:opacity-50"
          >
            <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaSave className="mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start">
          <FaExclamationTriangle className="mt-0.5 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={updatedAdmin.user?.name || updatedAdmin.name}
                onChange={(e) => handleUserInputChange('name', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                value={updatedAdmin.user?.email || ""}
                onChange={(e) => handleUserInputChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={updatedAdmin.user?.phone || ""}
                onChange={(e) => handleUserInputChange('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role
            </label>
            <div className="relative">
              <FaBuilding className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value="Administrator"
                readOnly
                className="w-full pl-10 pr-4 py-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <FaSave className="mr-2" /> 
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Current Profile Info */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg">
            <p className="text-sm text-gray-500">Name</p>
            <p className="text-gray-800 font-medium">{displayName}</p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-800 font-medium">{displayEmail}</p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <p className="text-sm text-gray-500">Phone</p>
            <p className="text-gray-800 font-medium">{displayPhone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}