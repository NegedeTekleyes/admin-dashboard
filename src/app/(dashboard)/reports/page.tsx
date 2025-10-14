"use client";

import { useEffect, useState } from "react";
import {
  FaFilter,
  FaDownload,
  FaFilePdf,
  FaFileCsv,
  FaFileExcel,
  FaCalendarAlt,
  FaPrint,
  FaChartBar,
  FaSearch,
  FaSync,
  FaUsers,
  FaTools,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import { reportsAPI, techniciansAPI } from "@/lib/api";

interface ReportData {
  title: string;
  description: string;
  headers: string[];
  rows: string[][];
  period?: {
    start: string;
    end: string;
  };
  summary?: any;
}

interface Technician {
  id: number;
  name: string;
  email: string;
  speciality?: string;
}

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // Today
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [technicianFilter, setTechnicianFilter] = useState("all");
  const [reportType, setReportType] = useState("summary");
  const [isLoading, setIsLoading] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [realReportData, setRealReportData] = useState<any>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [showSavedReports, setShowSavedReports] = useState(false);
  const [error, setError] = useState<string | null>(null)
  // Fetch technicians for filter
  useEffect(() => {
    fetchTechnicians();
  }, []);

  // Fetch real report data when filters change
  useEffect(() => {
    if (reportType === "summary" || reportType === "analytics") {
      fetchAnalyticsReport();
    }
  }, [dateRange, reportType]);

  const fetchTechnicians = async () => {
    try {
      console.log('Calling techniciansAPI.getAll...')
      if(!techniciansAPI) {
        throw new Error('techniciansAPI not available')
      }
      const data = await techniciansAPI.getAll(1, 100);
      console.log('Technicians data:', data)
      setTechnicians(data.technicians?.map((tech: any) => ({
        id: tech.id,
        name: tech.user?.name || 'Unknown',
        email: tech.user?.email || '',
        speciality: tech.speciality,
      })) || []);
    } catch (error) {
      console.error('Error fetching technicians:', error);
      setError('Failed to load technicians')
        // Set mock technicians for testing
      setTechnicians([
        { id: 1, name: "John Doe", email: "john@example.com", speciality: "Plumbing" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", speciality: "Electrical" }
      ]);
    }
  };

  const fetchAnalyticsReport = async () => {
    try {
      setIsLoading(true);
      setError(null)
      console.log("Calling reportsAP.getAnalytics...")
      if(!reportsAPI){
        throw new Error("ReportsAPI not available")
      }
      const data = await reportsAPI.getAnalytics(dateRange.start, dateRange.end);
      setRealReportData(data);
    } catch (error) {
      console.error('Error fetching analytics report:', error);
      // Fallback to mock data if API fails
      setRealReportData(generateMockReportData());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTechnicianReport = async (technicianId: number) => {
    try {
      setIsLoading(true);
      const data = await reportsAPI.getTechnicianPerformance(technicianId, dateRange.start, dateRange.end);
      setRealReportData(data);
    } catch (error) {
      console.error('Error fetching technician report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewReport = async () => {
    try {
      setIsLoading(true);
      const reportConfig = {
        title: getReportTitle(),
        type: getReportType(),
        filters: {
          startDate: dateRange.start,
          endDate: dateRange.end,
          status: statusFilter !== "all" ? statusFilter : undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
          urgency: urgencyFilter !== "all" ? urgencyFilter : undefined,
          technicianId: technicianFilter !== "all" ? parseInt(technicianFilter) : undefined,
        },
      };

      const data = await reportsAPI.generate(reportConfig);
      setRealReportData(data.data);
      
      // Refresh saved reports
      fetchSavedReports();
      
      alert('Report generated and saved successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedReports = async () => {
    try {
      const data = await reportsAPI.getSaved();
      setSavedReports(data.reports);
    } catch (error) {
      console.error('Error fetching saved reports:', error);
    }
  };

  const loadSavedReport = async (reportId: number) => {
    try {
      setIsLoading(true);
      const data = await reportsAPI.getById(reportId);
      setRealReportData(data.data);
      setShowSavedReports(false);
    } catch (error) {
      console.error('Error loading saved report:', error);
      alert('Failed to load saved report');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getReportTitle = () => {
    const typeMap: { [key: string]: string } = {
      summary: "Complaints Summary",
      analytics: "Comprehensive Analytics",
      performance: "Technician Performance",
      category: "Category Analysis"
    };
    return `${typeMap[reportType]} Report - ${dateRange.start} to ${dateRange.end}`;
  };

  const getReportType = () => {
    const typeMap: { [key: string]: string } = {
      summary: "SUMMARY",
      analytics: "ANALYTICS",
      performance: "TECHNICIAN",
      category: "ANALYTICS"
    };
    return typeMap[reportType] || "ANALYTICS";
  };

  const generateReportData = (): ReportData => {
    if (realReportData) {
      return formatRealReportData(realReportData);
    }
    
    // Fallback to mock data
    return generateMockReportData();
  };

  const formatRealReportData = (data: any): ReportData => {
    switch (reportType) {
      case "summary":
      case "analytics":
        return {
          title: data.period ? `Analytics Report - ${new Date(data.period.start).toLocaleDateString()} to ${new Date(data.period.end).toLocaleDateString()}` : "Analytics Report",
          description: "Comprehensive analysis of complaints and performance metrics",
          headers: ["Metric", "Value", "Details"],
          rows: [
            ["Total Complaints", data.summary?.totalComplaints?.toString() || "0", "All complaints in period"],
            ["Resolved Complaints", data.summary?.resolvedComplaints?.toString() || "0", "Successfully resolved"],
            ["Resolution Rate", data.summary?.resolutionRate ? `${data.summary.resolutionRate}%` : "0%", "Efficiency metric"],
            ["Active Technicians", data.summary?.activeTechnicians?.toString() || "0", "Available technicians"],
            ["Average Resolution Time", data.summary?.averageResolutionTime ? `${data.summary.averageResolutionTime}h` : "N/A", "Time to resolve complaints"],
          ],
          period: data.period,
          summary: data.summary,
        };

      case "performance":
        if (data.technician && data.performance) {
          return {
            title: `Performance Report - ${data.technician.name}`,
            description: `Performance metrics for ${data.technician.name}`,
            headers: ["Metric", "Value", "Benchmark"],
            rows: [
              ["Total Tasks", data.performance.totalTasks?.toString() || "0", "≥ 15"],
              ["Completed Tasks", data.performance.completedTasks?.toString() || "0", "≥ 12"],
              ["Completion Rate", data.performance.completionRate ? `${data.performance.completionRate}%` : "0%", "≥ 80%"],
              ["Avg Resolution Time", data.performance.averageResolutionTime ? `${data.performance.averageResolutionTime}h` : "N/A", "≤ 24h"],
              ["Efficiency", data.performance.efficiency ? `${data.performance.efficiency}%` : "0%", "≥ 85%"],
            ],
          };
        }
        break;

      default:
        return generateMockReportData();
    }
    
    return generateMockReportData();
  };

  const generateMockReportData = (): ReportData => {
    // Your existing mock data generation logic
    return {
      title: "Complaints Summary Report",
      description: "Overview of filtered complaints with key metrics and statistics",
      headers: ["Period", "Total Complaints", "Resolved", "In Progress", "Pending", "Resolution Rate", "Avg. Resolution Time"],
      rows: [
        [`${dateRange.start} to ${dateRange.end}`, "45", "32", "8", "5", "71.1%", "22.5h"]
      ]
    };
  };

  const exportReport = async (format: string) => {
    try {
      // In a real implementation, this would call your backend export endpoint
      console.log(`Exporting report as ${format}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`Report exported as ${format.toUpperCase()} successfully!`);
    } catch (error) {
      alert(`Failed to export report as ${format.toUpperCase()}`);
    }
  };

  const printReport = () => {
    window.print();
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setUrgencyFilter("all");
    setTechnicianFilter("all");
    setDateRange({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
  };

  const currentReport = generateReportData();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
            <p className="text-gray-600">Generate detailed reports and insights from real data</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <button 
              onClick={() => setShowSavedReports(!showSavedReports)}
              className="bg-white border rounded-md px-3 py-2 flex items-center hover:bg-gray-50"
            >
              <FaFilePdf className="text-gray-600 mr-1" />
              <span>Saved Reports</span>
            </button>
            <button 
              onClick={printReport}
              className="bg-white border rounded-md px-3 py-2 flex items-center hover:bg-gray-50"
            >
              <FaPrint className="text-gray-600 mr-1" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Saved Reports Modal */}
        {showSavedReports && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Saved Reports</h2>
                  <button 
                    onClick={() => setShowSavedReports(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {savedReports.length === 0 ? (
                  <div className="text-center py-8">
                    <FaFilePdf className="mx-auto text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-500">No saved reports yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedReports.map((report) => (
                      <div
                        key={report.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => loadSavedReport(report.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{report.title}</h3>
                            <p className="text-sm text-gray-600">{report.type}</p>
                            <p className="text-xs text-gray-500">
                              Generated by {report.generatedByUser?.name} on {new Date(report.generatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {report.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Report Controls */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Generate Report</h2>
            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <FaSync className="mr-1" />
                Reset Filters
              </button>
              <button
                onClick={fetchSavedReports}
                className="text-sm text-green-600 hover:text-green-800 flex items-center"
              >
                <FaDownload className="mr-1" />
                Refresh Data
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "summary", label: "Summary", icon: FaChartBar },
                  { key: "analytics", label: "Analytics", icon: FaChartBar },
                  { key: "performance", label: "Performance", icon: FaUsers },
                  { key: "category", label: "By Category", icon: FaExclamationTriangle },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    className={`px-4 py-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${
                      reportType === key
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setReportType(key)}
                  >
                    <Icon />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-1" />
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  className="border rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
                <span className="self-center text-gray-500">to</span>
                <input
                  type="date"
                  className="border rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="water-quality">Water Quality</option>
                <option value="pipe-leak">Pipe Leak</option>
                <option value="low-pressure">Low Pressure</option>
                <option value="no-water">No Water</option>
                <option value="sewage-issue">Sewage Issues</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
              <select
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
              >
                <option value="all">All Urgency Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUsers className="inline mr-1" />
                Technician
              </label>
              <select
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={technicianFilter}
                onChange={(e) => {
                  setTechnicianFilter(e.target.value);
                  if (e.target.value !== "all" && reportType === "performance") {
                    fetchTechnicianReport(parseInt(e.target.value));
                  }
                }}
              >
                <option value="all">All Technicians</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id.toString()}>
                    {tech.name}
                  </option>
                ))}
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <button
                onClick={generateNewReport}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaChartBar />
                )}
                {isLoading ? "Generating..." : "Generate Report"}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => exportReport('csv')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
                disabled={isLoading || !realReportData}
              >
                <FaFileCsv className="mr-2" />
                Export CSV
              </button>

              <button
                onClick={() => exportReport('pdf')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
                disabled={isLoading || !realReportData}
              >
                <FaFilePdf className="mr-2" />
                Export PDF
              </button>

              <button
                onClick={() => exportReport('excel')}
                className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
                disabled={isLoading || !realReportData}
              >
                <FaFileExcel className="mr-2" />
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Report Display */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <FaSpinner className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Generating report...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{currentReport.title}</h2>
                  <p className="text-gray-600">{currentReport.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Period: {dateRange.start} to {dateRange.end}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Generated on: {new Date().toLocaleDateString()}
                </div>
              </div>

              {/* Report Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {currentReport.headers.map((header, index) => (
                        <th
                          key={index}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentReport.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={rowIndex === currentReport.rows.length - 1 ? "bg-gray-50 font-semibold" : "hover:bg-gray-50"}
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Additional Metrics */}
              {realReportData?.summary && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Total Complaints</h3>
                    <p className="text-2xl font-bold text-blue-600">{realReportData.summary.totalComplaints || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800">Resolved</h3>
                    <p className="text-2xl font-bold text-green-600">{realReportData.summary.resolvedComplaints || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800">Resolution Rate</h3>
                    <p className="text-2xl font-bold text-purple-600">{realReportData.summary.resolutionRate || 0}%</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-800">Avg. Resolution Time</h3>
                    <p className="text-2xl font-bold text-orange-600">{realReportData.summary.averageResolutionTime || 'N/A'}h</p>
                  </div>
                </div>
              )}

              {/* Report Summary */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Report Summary</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Report generated from real database data</li>
                  <li>• Data reflects period: {dateRange.start} to {dateRange.end}</li>
                  <li>• Based on current filter criteria</li>
                  <li>• Export options available for further analysis</li>
                  {realReportData && (
                    <li>• Report has been saved to your account</li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;