'use client';
import { useState, useEffect } from 'react';
import { MoreVertical, Eye, UserX, Wrench, X } from 'lucide-react';
import { complaintsAPI } from '../lib/api';

interface ComplaintActionsProps {
  complaint: any;
  onView: (complaint: any) => void;
  onReload: () => void;
}

export default function ComplaintActions({ complaint, onView, onReload }: ComplaintActionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTech, setSelectedTech] = useState<string>('');

  // ✅ Fetch all available technicians
  useEffect(() => {
    if (showModal) {
      fetch('http://localhost:3000/technicians') // adjust URL if needed
        .then((res) => res.json())
        .then(setTechnicians)
        .catch((err) => console.error('Failed to load technicians:', err));
    }
  }, [showModal]);

  // ✅ Assign Technician with modal
  const handleAssignTechnician = async () => {
    if (!selectedTech) {
      alert('Please select a technician.');
      return;
    }
    try {
      setLoading(true);
      await complaintsAPI.assignTechnician(complaint.id, Number(selectedTech));
      alert('Technician assigned successfully ✅');
      setShowModal(false);
      onReload();
    } catch (error) {
      alert('Failed to assign technician ❌');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 🚫 Block Reporter
  const handleBlockReporter = async () => {
    if (!confirm(`Block reporter ${complaint.user.email}?`)) return;
    try {
      setLoading(true);
      await fetch(`http://localhost:3000/users/block/${complaint.user.id}`, { method: 'PUT' });
      alert('Reporter blocked ✅');
      onReload();
    } catch (error) {
      alert('Failed to block reporter ❌');
      console.error(error);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Options Button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-gray-100 transition"
        disabled={loading}
      >
        <MoreVertical size={18} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              onView(complaint);
              setOpen(false);
            }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50"
          >
            <Eye size={16} /> View Complaint
          </button>

          <button
            onClick={() => {
              setShowModal(true);
              setOpen(false);
            }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50"
          >
            <Wrench size={16} /> Assign Technician
          </button>

          <button
            onClick={handleBlockReporter}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
          >
            <UserX size={16} /> Block Reporter
          </button>
        </div>
      )}

      {/* Assign Technician Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-xl shadow-xl w-96 p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-semibold mb-4">Assign Technician</h2>

            <label className="block text-sm text-gray-700 mb-1">Select Technician</label>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring focus:ring-blue-100"
            >
              <option value="">-- Select Technician --</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.user?.name || 'Unnamed'} ({tech.user?.email})
                </option>
              ))}
            </select>

            <button
              onClick={handleAssignTechnician}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign Technician'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
