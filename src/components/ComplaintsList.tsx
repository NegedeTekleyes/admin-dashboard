// // components/ComplaintsList.tsx
// 'use client';
// import { useState, useEffect } from 'react';
// import { complaintsAPI } from '@/lib/api';
// import { Complaint, PaginatedComplaints } from '@/types/complaint';

// const STATUS_COLORS = {
//   SUBMITTED: 'bg-yellow-100 text-yellow-800',
//   ASSIGNED: 'bg-blue-100 text-blue-800',
//   IN_PROGRESS: 'bg-orange-100 text-orange-800',
//   RESOLVED: 'bg-green-100 text-green-800',
//   REJECTED: 'bg-red-100 text-red-800',
// };

// const URGENCY_COLORS = {
//   LOW: 'bg-gray-100 text-gray-800',
//   MEDIUM: 'bg-blue-100 text-blue-800',
//   HIGH: 'bg-orange-100 text-orange-800',
//   EMERGENCY: 'bg-red-100 text-red-800',
// };

// export default function ComplaintsList({ userRole = 'user' }: { userRole?: 'user' | 'admin' | 'technician' }) {
//   const [complaints, setComplaints] = useState<Complaint[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [pagination, setPagination] = useState({
//     page: 1,
//     limit: 10,
//     total: 0,
//     pages: 0,
//   });
//   const [statusFilter, setStatusFilter] = useState('');

//   const fetchComplaints = async (page: number = 1) => {
//     try {
//       setLoading(true);
//       let data: PaginatedComplaints;
      
//       if (userRole === 'admin') {
//         data = await complaintsAPI.getAll(page, 10, statusFilter || undefined);
//       } else if (userRole === 'technician') {
//         data = await complaintsAPI.getAssignedComplaints(page, 10);
//       } else {
//         data = await complaintsAPI.getMyComplaints(page, 10);
//       }
      
//       setComplaints(data.complaints);
//       setPagination(data.pagination);
//     } catch (error) {
//       console.error('Error fetching complaints:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchComplaints();
//   }, [statusFilter, userRole]);

//   const updateStatus = async (complaintId: number, newStatus: string) => {
//     try {
//       await complaintsAPI.updateStatus(complaintId, newStatus);
//       fetchComplaints(pagination.page); // Refresh current page
//     } catch (error) {
//       console.error('Error updating status:', error);
//     }
//   };

//   if (loading) return <div className="flex justify-center py-8">Loading complaints...</div>;

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-800">
//           {userRole === 'admin' ? 'All Complaints' : 
//            userRole === 'technician' ? 'Assigned Complaints' : 'My Complaints'}
//         </h2>
        
//         {userRole === 'admin' && (
//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="border border-gray-300 rounded-md px-3 py-2"
//           >
//             <option value="">All Statuses</option>
//             <option value="SUBMITTED">Submitted</option>
//             <option value="ASSIGNED">Assigned</option>
//             <option value="IN_PROGRESS">In Progress</option>
//             <option value="RESOLVED">Resolved</option>
//             <option value="REJECTED">Rejected</option>
//           </select>
//         )}
//       </div>

//       <div className="space-y-4">
//         {complaints.map((complaint) => (
//           <div key={complaint.id} className="bg-white p-6 rounded-lg shadow border">
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-800">{complaint.title}</h3>
//                 <p className="text-gray-600 text-sm mt-1">{complaint.description}</p>
//               </div>
//               <div className="flex gap-2">
//                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[complaint.status]}`}>
//                   {complaint.status.replace('_', ' ')}
//                 </span>
//                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${URGENCY_COLORS[complaint.urgency]}`}>
//                   {complaint.urgency.toLowerCase()}
//                 </span>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
//               <div>
//                 <span className="font-medium">Category:</span> {complaint.category.replace('_', ' ').toLowerCase()}
//               </div>
//               <div>
//                 <span className="font-medium">Submitted:</span> {new Date(complaint.createdAt).toLocaleDateString()}
//               </div>
//               <div>
//                 <span className="font-medium">By:</span> {complaint.user.name}
//               </div>
//               <div>
//                 <span className="font-medium">Assigned To:</span> {complaint.tasks[0]?.technician?.user.name || 'Not assigned'}
//               </div>
//             </div>

//             {complaint.photos.length > 0 && (
//               <div className="mb-4">
//                 <h4 className="font-medium text-sm text-gray-700 mb-2">Photos:</h4>
//                 <div className="flex gap-2">
//                   {complaint.photos.map((photo, index) => (
//                     <img
//                       key={index}
//                       src={photo}
//                       alt={`Complaint photo ${index + 1}`}
//                       className="w-16 h-16 object-cover rounded border"
//                     />
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Admin/Technician Actions */}
//             {(userRole === 'admin' || userRole === 'technician') && (
//               <div className="flex gap-2 pt-4 border-t">
//                 {userRole === 'admin' && (
//                   <>
//                     <select
//                       value={complaint.status}
//                       onChange={(e) => updateStatus(complaint.id, e.target.value)}
//                       className="border border-gray-300 rounded px-2 py-1 text-sm"
//                     >
//                       <option value="SUBMITTED">Submitted</option>
//                       <option value="ASSIGNED">Assigned</option>
//                       <option value="IN_PROGRESS">In Progress</option>
//                       <option value="RESOLVED">Resolved</option>
//                       <option value="REJECTED">Rejected</option>
//                     </select>
                    
//                     <button
//                       onClick={() => {/* Implement assign technician modal */}}
//                       className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
//                     >
//                       Assign Technician
//                     </button>
//                   </>
//                 )}
                
//                 {userRole === 'technician' && complaint.status === 'ASSIGNED' && (
//                   <button
//                     onClick={() => updateStatus(complaint.id, 'IN_PROGRESS')}
//                     className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
//                   >
//                     Start Work
//                   </button>
//                 )}
                
//                 {userRole === 'technician' && complaint.status === 'IN_PROGRESS' && (
//                   <button
//                     onClick={() => updateStatus(complaint.id, 'RESOLVED')}
//                     className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
//                   >
//                     Mark Resolved
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Pagination */}
//       {pagination.pages > 1 && (
//         <div className="flex justify-between items-center mt-6">
//           <button
//             onClick={() => fetchComplaints(pagination.page - 1)}
//             disabled={pagination.page <= 1}
//             className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
//           >
//             Previous
//           </button>
          
//           <span className="text-sm text-gray-600">
//             Page {pagination.page} of {pagination.pages}
//           </span>
          
//           <button
//             onClick={() => fetchComplaints(pagination.page + 1)}
//             disabled={pagination.page >= pagination.pages}
//             className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
//           >
//             Next
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }