// app/notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { FaBell, FaPlus, FaFileCsv, FaFilePdf, FaSearch, FaUsers, FaSync } from "react-icons/fa";
import { jsPDF } from "jspdf";
import { notificationsAPI, socketService } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  date: string;
  targetUserType?: string;
  specificUsers?: string[];
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  type: 'resident' | 'technician';
  email: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    sentToday: 0
  });

  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "GENERAL",
    targetUserType: "ALL" as "ALL" | "RESIDENT" | "TECHNICIAN" | "SPECIFIC",
    specificUsers: [] as string[],
  });

  // Initialize socket and load data
  useEffect(() => {
    // Initialize socket connection as admin
    const socket = socketService.connectAsAdmin();
    
    // Set up connection status listener
    const checkConnection = () => {
      setIsConnected(socketService.getConnectionStatus());
    };

    // Check connection initially and set up interval
    checkConnection();
    const interval = setInterval(checkConnection, 2000);

    // Load initial data
    loadNotifications();
    loadUsers();
    loadStats();

    // Listen for real-time notifications
    const handleNewNotification = (notification: any) => {
      console.log(' Real-time notification received:', notification);
      const newNotif: Notification = {
        ...notification,
        id: notification.id.toString(),
        date: new Date(notification.createdAt).toISOString().slice(0, 10),
        status: notification.status || "Sent",
      };
      setNotifications(prev => [newNotif, ...prev]);
      
      // Update stats in real-time
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        sentToday: prev.sentToday + 1
      }));
    };

    const handleAdminNotification = (data: any) => {
      console.log(' Admin notification update:', data);
      // Refresh data when other admins send notifications
      loadNotifications();
      loadStats();
    };

    // Use the new event listener methods
    socketService.on('new-notification', handleNewNotification);
    socketService.on('admin-notification', handleAdminNotification);
    socketService.on('notification-sent', (data: any) => {
      console.log(' Notification sent successfully:', data);
      // Refresh data after sending notification
      loadNotifications();
      loadStats();
    });

    return () => {
      clearInterval(interval);
      socketService.off('new-notification', handleNewNotification);
      socketService.off('admin-notification', handleAdminNotification);
      socketService.disconnect();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      // Format dates for display
      const formattedNotifications = (response.notifications || response).map((notif: any) => ({
        ...notif,
        date: new Date(notif.createdAt).toISOString().slice(0, 10),
        target: notif.targetUserType || 'All'
      }));
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await notificationsAPI.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      // Fallback mock data
      setUsers([
        { id: '1', name: 'John Resident', type: 'resident', email: 'john@example.com' },
        { id: '2', name: 'Jane Resident', type: 'resident', email: 'jane@example.com' },
        { id: '3', name: 'Mike Technician', type: 'technician', email: 'mike@example.com' },
        { id: '4', name: 'Sarah Technician', type: 'technician', email: 'sarah@example.com' },
      ]);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await notificationsAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback stats based on current notifications
      const today = new Date().toISOString().slice(0, 10);
      setStats({
        total: notifications.length,
        unread: notifications.filter(n => n.status === 'unread').length,
        read: notifications.filter(n => n.status === 'read').length,
        sentToday: notifications.filter(n => n.date === today).length,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Export as CSV
  const exportCSV = () => {
    const headers = "Title,Message,Date,Type,Status,Target\n";
    const csvContent = notifications.reduce((csv, n) => {
      return csv + `"${n.title}","${n.message}",${n.date},${n.type},${n.status},${n.targetUserType || 'All'}\n`;
    }, headers);

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export as PDF
  const exportPDF = async () => {
    const pdf = new jsPDF("portrait", "mm", "a4");
    pdf.setFontSize(16);
    pdf.text("Notifications Report", 10, 10);
    pdf.setFontSize(10);
    
    let y = 20;
    notifications.forEach((n, index) => {
      if (y > 280) {
        pdf.addPage();
        y = 10;
      }
      
      const title = `${index + 1}. ${n.title}`;
      const message = `Message: ${n.message}`;
      const details = `Type: ${n.type} | Status: ${n.status} | Date: ${n.date} | Target: ${n.targetUserType || 'All'}`;
      
      pdf.text(title, 10, y);
      pdf.text(message, 10, y + 4);
      pdf.text(details, 10, y + 8);
      
      y += 15;
    });
    
    pdf.save(`notifications-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Send notification
  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      alert("Please fill in title and message");
      return;
    }

    try {

      const payload = {
      title: newNotification.title,
      message: newNotification.message,
      type: newNotification.type, // keep as-is (your API likely accepts uppercase here)
      targetUserType: (newNotification.targetUserType || "ALL").toLowerCase() as
        | "all"
        | "resident"
        | "technician"
        | "specific",
      specificUsers: newNotification.specificUsers || [],
    };
      // Send via API
      await notificationsAPI.create(payload);

      // Also send via WebSocket for real-time delivery
      if (isConnected) {
        // Convert specificUsers from string[] to number[] for WebSocket
        const targetUserIds = newNotification.targetUserType === 'SPECIFIC' 
          ? newNotification.specificUsers.map(id => parseInt(id))
          : []; // In real app, you'd get user IDs based on targetUserType
        
        socketService.sendNotification({
          targetUserIds,
          title: newNotification.title,
          message: newNotification.message,
          audience: newNotification.targetUserType.toUpperCase() as 'ALL' | 'RESIDENT' | 'TECHNICIAN'
        });
      }

      // Reset form
      setShowModal(false);
      setNewNotification({
        title: "",
        message: "",
        type: "GENERAL",
        targetUserType: "ALL",
        specificUsers: [],
      });

      // Reload notifications
      await loadNotifications();
      await loadStats();

      alert('Notification sent successfully!');

    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error sending notification: ' + (error as Error).message);
    }
  };

  const handleUserSelection = (userId: string, isSelected: boolean) => {
    setNewNotification(prev => ({
      ...prev,
      specificUsers: isSelected
        ? [...prev.specificUsers, userId]
        : prev.specificUsers.filter(id => id !== userId)
    }));
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([loadNotifications(), loadStats(), loadUsers()]);
    setLoading(false);
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Connection Status */}
      {/* <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-white text-sm z-50 ${
        isConnected ? 'bg-green-500' : 'bg-red-500'
      }`}>
        {/* {isConnected ? '🟢 Connected' : '🔴 Disconnected'} */}
      {/* </div> */} 

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaBell className="text-blue-500" /> Notifications
          </h1>
          <p className="text-gray-600">Manage and send system alerts to users</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> 
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="mr-2" /> New Notification
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            <FaFileCsv className="mr-2" /> CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
          >
            <FaFilePdf className="mr-2" /> PDF
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-white rounded-lg p-3 shadow mb-6">
        <FaSearch className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search notifications..."
          className="flex-1 outline-none bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-500 text-sm">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-500 text-sm">Unread</p>
          <p className="text-2xl font-bold">{stats.unread}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-500 text-sm">Read</p>
          <p className="text-2xl font-bold">{stats.read}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-500 text-sm">Sent Today</p>
          <p className="text-2xl font-bold">{stats.sentToday}</p>
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No notifications match your search' : 'No notifications found'}
          </div>
        ) : (
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-200 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Message</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.map((n) => (
                <tr key={n.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{n.title}</td>
                  <td className="px-4 py-3 max-w-md truncate">{n.message}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      n.type === 'ALERT' ? 'bg-red-100 text-red-700' :
                      n.type === 'SYSTEM' ? 'bg-purple-100 text-purple-700' :
                      n.type === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {n.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center capitalize">{n.targetUserType || 'All'}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        n.status === "Unread" || n.status === "unread"
                          ? "bg-yellow-100 text-yellow-700"
                          : n.status === "Read" || n.status === "read"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {n.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{n.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaBell className="text-blue-500" /> Create Notification
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target Audience</label>
                <select
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newNotification.targetUserType}
                  onChange={(e) => setNewNotification({ 
                    ...newNotification, 
                    targetUserType: e.target.value as any 
                  })}
                >
                  <option value="ALL">All Users</option>
                  <option value="RESIDENT">Residents Only</option>
                  <option value="TECHNICIAN">Technicians Only</option>
                  <option value="SPECIFIC">Specific Users</option>
                </select>
              </div>

              {newNotification.targetUserType === "SPECIFIC" && (
                <div className="max-h-48 overflow-y-auto border p-3 rounded">
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <FaUsers className="text-gray-500" /> Select Users:
                  </label>
                  <div className="space-y-2">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={newNotification.specificUsers.includes(user.id)}
                          onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                          className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`user-${user.id}`} className="text-sm flex-1">
                          <span className="font-medium">{user.name}</span>
                          <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                            user.type === 'resident' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.type}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Notification title"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  placeholder="Notification message"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
                >
                    <option value="GENERAL">General</option>
                    <option value="SYSTEM">System</option>
                    <option value="ALERT">Alert</option>
                    <option value="UPDATE">Update</option>
                    <option value="REPORT">Report</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaBell /> Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;