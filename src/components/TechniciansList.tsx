// components/TechniciansList.tsx
'use client';
import { useState, useEffect } from 'react';
import { techniciansAPI } from '../lib/api';
import { Technician, PaginatedTechnicians } from '../app/types/technician';

export default function TechniciansList() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchTechnicians = async (page: number = 1, status?: string) => {
    try {
      setLoading(true);
      const data: PaginatedTechnicians = await techniciansAPI.getAll(page, 10, status);
      setTechnicians(data.technicians);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  if (loading) return <div>Loading technicians...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Technicians</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {technicians.map((tech) => (
          <div key={tech.id} className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold">{tech.user.name}</h3>
            <p className="text-gray-600">{tech.user.email}</p>
            <p className="text-sm text-gray-500">Speciality: {tech.speciality || 'Not specified'}</p>
            <p className={`text-sm ${
              tech.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
            }`}>
              Status: {tech.status}
            </p>
            
            {tech.stats && (
              <div className="mt-3 pt-3 border-t">
                <h4 className="font-medium">Performance</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Total Tasks: {tech.stats.totalTasks}</span>
                  <span>Completed: {tech.stats.completedTasks}</span>
                  <span>Active: {tech.stats.activeTasks}</span>
                  <span>Efficiency: {tech.stats.efficiency}%</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => fetchTechnicians(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        
        <span>Page {pagination.page} of {pagination.pages}</span>
        
        <button
          onClick={() => fetchTechnicians(pagination.page + 1)}
          disabled={pagination.page >= pagination.pages}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}