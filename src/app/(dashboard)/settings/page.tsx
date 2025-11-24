// app/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaShieldAlt, 
  FaBell, 
  FaPalette, 
  FaDatabase, 
  FaCog,
  FaSave,
  FaSync,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { adminAPI } from '@/lib/api';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: FaUser },
    { id: 'security', name: 'Security', icon: FaShieldAlt },
    { id: 'notifications', name: 'Notifications', icon: FaBell },
    // { id: 'appearance', name: 'Appearance', icon: FaPalette },
    // { id: 'system', name: 'System', icon: FaCog },
  ];

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account and system preferences</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <FaCheckCircle className="mr-3 text-green-500" />
              ) : (
                <FaExclamationTriangle className="mr-3 text-red-500" />
              )}
              {message.text}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="lg:flex">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 bg-gray-900 text-white p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="mr-3 text-lg" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
              {activeTab === 'profile' && <ProfileSettings showMessage={showMessage} />}
              {activeTab === 'security' && <SecuritySettings showMessage={showMessage} />}
              {activeTab === 'notifications' && <NotificationSettings showMessage={showMessage} />}
              {/* {activeTab === 'appearance' && <AppearanceSettings showMessage={showMessage} />} */}
              {/* {activeTab === 'system' && <SystemSettings showMessage={showMessage} />} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}