// components/settings/NotificationSettings.tsx
import { useState } from 'react';
import { FaBell, FaEnvelope, FaMobile } from 'react-icons/fa';

interface NotificationSettingsProps {
  showMessage: (type: string, text: string) => void;
}

export function NotificationSettings({ showMessage }: NotificationSettingsProps) {
  const [notifications, setNotifications] = useState({
    email: {
      newComplaints: true,
      systemAlerts: true,
      reports: false,
      security: true,
    },
    push: {
      newComplaints: true,
      urgentIssues: true,
      systemUpdates: false,
    },
    sms: {
      criticalAlerts: true,
      downtime: false,
    }
  });

  const handleSave = () => {
    // Save notification preferences
    showMessage('success', 'Notification preferences updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
          <p className="text-gray-600">Manage how you receive notifications</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FaBell className="mr-2" />
          Save Preferences
        </button>
      </div>

      {/* Email Notifications */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FaEnvelope className="text-blue-600 mr-3 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
        </div>
        <div className="space-y-3">
          {Object.entries(notifications.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    email: { ...notifications.email, [key]: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FaMobile className="text-green-600 mr-3 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
        </div>
        <div className="space-y-3">
          {Object.entries(notifications.push).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    push: { ...notifications.push, [key]: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}