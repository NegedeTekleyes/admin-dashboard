// components/TechnicianPerformance.tsx
'use client';
import { useState, useEffect } from 'react';
import { techniciansAPI } from '../lib/api';
import { TechnicianStats } from '../app/types/technician';

export default function TechnicianPerformance() {
  const [stats, setStats] = useState<TechnicianStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await techniciansAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching technician stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <div>Loading performance data...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Technician Performance</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.map((tech) => (
          <div key={tech.id} className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-xl font-semibold mb-4">{tech.name}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{tech.totalTasks}</div>
                <div className="text-sm text-blue-800">Total Tasks</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{tech.completedTasks}</div>
                <div className="text-sm text-green-800">Completed</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="text-2xl font-bold text-purple-600">{tech.efficiency}%</div>
                <div className="text-sm text-purple-800">Efficiency</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded">
                <div className="text-2xl font-bold text-orange-600">{tech.avgResolutionTime}h</div>
                <div className="text-sm text-orange-800">Avg. Resolution</div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>Speciality: {tech.speciality || 'Not specified'}</p>
              <p className={`inline-block px-2 py-1 rounded ${
                tech.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                Status: {tech.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}