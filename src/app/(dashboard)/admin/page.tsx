// app/admin/page.tsx
'use client';
import { useState } from 'react';
import TechniciansList from '../../../components/TechniciansList';
import TechnicianPerformance from '../../../components/TechnicianPerformance';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'technicians' | 'performance'>('technicians');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
        {/* Tab Navigation */}
        <div className="mb-6 border-b">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('technicians')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'technicians'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Technicians
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'performance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Performance
            </button>
          </nav>
        </div>

        <div>
          {activeTab === 'technicians' && <TechniciansList />}
          {activeTab === 'performance' && <TechnicianPerformance />}
        </div>
      </div>
    </div>
  );
}