"use client";

import { useState, useEffect } from "react";
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaBan,
  FaTimes,
  FaUser,
  FaInbox,
  FaUserCheck,
} from "react-icons/fa";

interface Complaint {
  id: number;
  user: string;
  email: string;
  category: string;
  description: string;
  location: string;
  urgency: "Critical" | "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Resolved";
  date: string;
  photo: string;
  assignedTo: string;
}

export default function ComplaintsAdminDashboard() {
  // ----- Demo Data -----
  const initialComplaints: Complaint[] = [
    {
      id: 1,
      user: "John Doe",
      email: "john.doe@example.com",
      category: "Water Quality",
      description: "Brown water coming from taps",
      location: "Downtown District",
      urgency: "High",
      status: "Pending",
      date: "2023-10-15",
      photo: "/water-quality-issue.jpg",
      assignedTo: "",
    },
    {
      id: 2,
      user: "Jane Smith",
      email: "jane.smith@example.com",
      category: "Pipe Leak",
      description: "Water leaking from main pipe on 5th street",
      location: "5th Street, Central",
      urgency: "Medium",
      status: "In Progress",
      date: "2023-10-14",
      photo: "/pipe-leak.jpg",
      assignedTo: "Technician Alex",
    },
    {
      id: 3,
      user: "Robert Johnson",
      email: "robert.j@example.com",
      category: "Low Pressure",
      description: "Water pressure very low in morning hours",
      location: "Northwest Residential Area",
      urgency: "Medium",
      status: "Resolved",
      date: "2023-10-10",
      photo: "/low-pressure.jpg",
      assignedTo: "Technician Maria",
    },
    {
      id: 4,
      user: "Sarah Williams",
      email: "sarah.williams@example.com",
      category: "No Water",
      description: "No water supply for 2 days",
      location: "Eastern Suburbs",
      urgency: "High",
      status: "Pending",
      date: "2023-10-16",
      photo: "/no-water.jpg",
      assignedTo: "",
    },
    {
      id: 5,
      user: "Michael Brown",
      email: "michael.b@example.com",
      category: "Sewage Issue",
      description: "Sewage mixing with drinking water",
      location: "Old Town District",
      urgency: "Critical",
      status: "Pending",
      date: "2023-10-16",
      photo: "/sewage-issue.jpg",
      assignedTo: "",
    }
  ];

  const [complaints, setComplaints] = useState(initialComplaints);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredComplaints, setFilteredComplaints] = useState(initialComplaints);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [assignModal, setAssignModal] = useState<Complaint | null>(null);
  const [technicians] = useState<string[]>([
    "Technician Alex",
    "Technician Maria",
    "Technician David",
    "Technician Sophia",
  ]);

  // --- Filter by search term ---
  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFilteredComplaints(
      complaints.filter((c) =>
        [c.user, c.email, c.category, c.location, c.description]
          .join(" ")
          .toLowerCase()
          .includes(lower)
      )
    );
  }, [searchTerm, complaints]);

  // --- CRUD Handlers ---
  const handleEdit = (c: Complaint) => {
    setSelectedComplaint({ ...c });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this complaint?")) {
      setComplaints((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleBlock = (user: string, email: string) => {
    if (confirm(`Block ${user} (${email})?`)) {
      alert(`User ${user} has been blocked.`);
    }
  };

  const handleSave = (updated: Complaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    setShowModal(false);
    setSelectedComplaint(null);
  };
  
  const handleAssign = (c: Complaint) => {
    setAssignModal(c);
  }
  
  async function saveAssignment(c: Complaint) {
    // 1. Optimistic UI
    setComplaints(prev =>
      prev.map(x => (x.id === c.id ? { ...x, assignedTo: c.assignedTo, status: "In Progress" } : x))
    );
    setAssignModal(null);

    // 2. Persist to backend
    await fetch(`/api/complaints/${c.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technicianId: c.assignedTo }),
    });
  }

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gray-100 p-6 ">
      <h1 className="text-xl font-semibold mb-6">Water Complaints Management</h1>

      {/* Search and Actions */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-1/3 mb-4 md:mb-0">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            placeholder="Search complaints…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">Urgency</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Assigned To</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-400">
                  <FaInbox className="mx-auto text-3xl mb-2" />
                  No complaints found
                </td>
              </tr>
            ) : (
              filteredComplaints.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaUser className="text-blue-500" />
                      </div>
                      <div>
                        <div className="font-medium">{c.user}</div>
                        <div className="text-xs text-gray-500">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{c.category}</td>
                  <td className="p-3 max-w-xs truncate">{c.description}</td>
                  <td className="p-3">{c.location}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${c.urgency === 'Critical' ? 'bg-red-100 text-red-800' : 
                        c.urgency === 'High' ? 'bg-orange-100 text-orange-800' : 
                        c.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {c.urgency}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${c.status === 'Pending' ? 'bg-gray-100 text-gray-800' : 
                        c.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {c.assignedTo || (
                      <button 
                        onClick={() => handleAssign(c)}
                        className="text-green-600 hover:text-green-800 flex items-center"
                        title="Assign Technician"
                      >
                        <FaUserCheck className="mr-1" /> Assign
                      </button>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-3 text-lg">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                      <button
                        onClick={() => handleBlock(c.user, c.email)}
                        className="text-orange-500 hover:text-orange-700 p-1 rounded-full hover:bg-orange-100"
                        title="Block User"
                      >
                        <FaBan />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-xl relative">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg font-semibold">Edit Complaint</h2>
              <button onClick={() => setShowModal(false)}>
                <FaTimes className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <strong>User:</strong> {selectedComplaint.user}
              </div>
              <div>
                <strong>Email:</strong> {selectedComplaint.email}
              </div>
              <div>
                <strong>Category:</strong> {selectedComplaint.category}
              </div>
              <div>
                <strong>Description:</strong> {selectedComplaint.description}
              </div>
              <div>
                <strong>Location:</strong> {selectedComplaint.location}
              </div>

              <label className="block text-sm">
                Urgency
                <select
                  className="mt-1 w-full border rounded-md p-2"
                  value={selectedComplaint.urgency}
                  onChange={(e) =>
                    setSelectedComplaint({
                      ...selectedComplaint,
                      urgency: e.target.value as Complaint["urgency"],
                    })
                  }
                >
                  {["Critical", "High", "Medium", "Low"].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                Status
                <select
                  className="mt-1 w-full border rounded-md p-2"
                  value={selectedComplaint.status}
                  onChange={(e) =>
                    setSelectedComplaint({
                      ...selectedComplaint,
                      status: e.target.value as Complaint["status"],
                    })
                  }
                >
                  {["Pending", "In Progress", "Resolved"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                Assign Technician
                <select
                  className="mt-1 w-full border rounded-md p-2"
                  value={selectedComplaint.assignedTo}
                  onChange={(e) =>
                    setSelectedComplaint({
                      ...selectedComplaint,
                      assignedTo: e.target.value,
                    })
                  }
                >
                  <option value="">Unassigned</option>
                  {technicians.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedComplaint && handleSave(selectedComplaint)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Technician Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Assign Technician</h3>
              <button onClick={() => setAssignModal(null)}>
                <FaTimes className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <div className="mb-4">
              <div><strong>Complaint:</strong> {assignModal.category}</div>
              <div><strong>User:</strong> {assignModal.user}</div>
              <div><strong>Location:</strong> {assignModal.location}</div>
            </div>
            <select
              className="w-full border p-2 rounded-md mb-4"
              value={assignModal.assignedTo}
              onChange={(e) =>
                setAssignModal({ ...assignModal, assignedTo: e.target.value })
              }
            >
              <option value="">Select technician</option>
              {technicians.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAssignModal(null)}
                className="border px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => assignModal && saveAssignment(assignModal)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}