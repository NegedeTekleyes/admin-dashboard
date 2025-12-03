// // app/events/page.tsx
// "use client";
// import { useState } from "react";
// // import Calendar from "@/components/Calendar";
// // import EventsList from "@/components/EventsList";

// export default function EventsPage() {
//   const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');

//   return (
//     <div className="min-h-screen bg-gray-100 p-6">
//       <div className="max-w-7xl mx-auto">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-2xl font-bold">Events & Calendar</h1>
//           <div className="flex gap-2">
//             <button
//               onClick={() => setActiveTab('calendar')}
//               className={`px-4 py-2 rounded-lg ${
//                 activeTab === 'calendar' 
//                   ? 'bg-blue-600 text-white' 
//                   : 'bg-white text-gray-700 border'
//               }`}
//             >
//               Calendar View
//             </button>
//             <button
//               onClick={() => setActiveTab('list')}
//               className={`px-4 py-2 rounded-lg ${
//                 activeTab === 'list' 
//                   ? 'bg-blue-600 text-white' 
//                   : 'bg-white text-gray-700 border'
//               }`}
//             >
//               List View
//             </button>
//           </div>
//         </div>

//         {activeTab === 'calendar' ? <Calendar /> : <EventsList />}
//       </div>
//     </div>
//   );
// }