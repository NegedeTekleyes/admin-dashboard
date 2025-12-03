"use client";

import { useEffect, useState, useCallback } from "react";
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
import { debounce } from "lodash"; // Import lodash for debouncing

// Type definitions based on backend responses
interface Technician {
  id: number;
  name: string;
  email: string;
  speciality: string;
  status: string;
  stats?: any;
}

interface AnalyticsReportData {
  period: { start: string; end: string };
  summary: {
    categories: any;
    totalComplaints: number;
    resolvedComplaints: number;
    resolutionRate: number;
    activeTechnicians: number;
    averageResolutionTime: number;
  };
}

interface TechnicianPerformanceData {
  technician: { id: number; name: string; email: string; speciality: string };
  performance: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    averageResolutionTime: number;
    efficiency: number;
  };
}

interface SavedReport {
  id: number;
  title: string;
  type: string;
  generatedByUser: { name: string };
  generatedAt: string;
}

interface ReportData {
  title: string;
  description: string;
  headers: string[];
  rows: string[][];
  period?: { start: string; end: string };
  summary?: AnalyticsReportData["summary"];
}

interface ReportConfig {
  title: string;
  type: string;
  filters: {
    startDate: string;
    endDate: string;
    status?: string;
    category?: string;
    urgency?: string;
    technicianId?: number;
  };
}

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0], // Today
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [technicianFilter, setTechnicianFilter] = useState("all");
  const [reportType, setReportType] = useState<"summary" | "analytics" | "performance" | "category">("summary");
  const [isLoading, setIsLoading] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [realReportData, setRealReportData] = useState<AnalyticsReportData | TechnicianPerformanceData | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [showSavedReports, setShowSavedReports] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch technicians
  useEffect(() => {
    fetchTechnicians();
  }, []);

  // Fetch report data when filters or report type change
  useEffect(() => {
    if (reportType === "summary" || reportType === "analytics") {
      fetchAnalyticsReport();
    }
  }, [dateRange, reportType]);

  const fetchTechnicians = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!techniciansAPI) {
        throw new Error("techniciansAPI not available");
      }
      const data = await techniciansAPI.getAll(1, 100);
      const techniciansData = data.technicians?.map((tech: any) => ({
        id: tech.id,
        name: tech.user?.name || "Unknown",
        email: tech.user?.email || "",
        speciality: tech.speciality || "N/A",
        status: tech.status || "N/A",
        stats: tech.stats,
      })) || [];
      setTechnicians(techniciansData);
      if (techniciansData.length === 0) {
        setError("No technicians found");
      }
    } catch (error) {
      console.error("Error fetching technicians:", error);
      setError("Failed to load technicians. Please try again later.");
      setTechnicians([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalyticsReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!reportsAPI) {
        throw new Error("reportsAPI not available");
      }
      const data = await reportsAPI.getAnalytics(dateRange.start, dateRange.end);
      setRealReportData(data);
      if (!data.summary || Object.keys(data.summary).length === 0) {
        setError("No analytics data available for the selected period");
      }
    } catch (error) {
      console.error("Error fetching analytics report:", error);
      setError("Failed to load analytics report. Please try again.");
      setRealReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTechnicianReport = useCallback(
    debounce(async (technicianId: number) => {
      try {
        setIsLoading(true);
        setError(null);
        if (!reportsAPI) {
          throw new Error("reportsAPI not available");
        }
        const data = await reportsAPI.getTechnicianPerformance(technicianId, dateRange.start, dateRange.end);
        setRealReportData(data);
        if (!data.performance || Object.keys(data.performance).length === 0) {
          setError(`No performance data available for technician ID ${technicianId}`);
        }
      } catch (error) {
        console.error("Error fetching technician report:", error);
        setError("Failed to load technician report. Please try again.");
        setRealReportData(null);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [dateRange.start, dateRange.end]
  );

  const generateNewReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const reportConfig: ReportConfig = {
        title: getReportTitle(),
        type: getReportType(),
        filters: {
          startDate: dateRange.start,
          endDate: dateRange.end,
          ...(statusFilter !== "all" && { status: statusFilter }),
          ...(categoryFilter !== "all" && { category: categoryFilter }),
          ...(urgencyFilter !== "all" && { urgency: urgencyFilter }),
          ...(technicianFilter !== "all" && { technicianId: parseInt(technicianFilter) }),
        },
      };

      const data = await reportsAPI.generate(reportConfig);
      setRealReportData(data.data);
      await fetchSavedReports();
      alert("Report generated and saved successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      setError("Failed to generate report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await reportsAPI.getSaved();
      setSavedReports(data.reports || []);
      if (!data.reports || data.reports.length === 0) {
        setError("No saved reports found");
      }
    } catch (error) {
      console.error("Error fetching saved reports:", error);
      setError("Failed to load saved reports. Please try again.");
      setSavedReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedReport = async (reportId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await reportsAPI.getById(reportId);
      setRealReportData(data.data);
      setShowSavedReports(false);
    } catch (error) {
      console.error("Error loading saved report:", error);
      setError("Failed to load saved report. Please try again.");
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
      category: "Category Analysis",
    };
    return `${typeMap[reportType]} Report - ${dateRange.start} to ${dateRange.end}`;
  };

  const getReportType = () => {
    const typeMap: { [key: string]: string } = {
      summary: "SUMMARY",
      analytics: "ANALYTICS",
      performance: "TECHNICIAN",
      category: "ANALYTICS",
    };
    return typeMap[reportType] || "ANALYTICS";
  };

  const formatRealReportData = (data: AnalyticsReportData | TechnicianPerformanceData | null): ReportData => {
    if (!data) {
      return {
        title: "No Data Available",
        description: "No report data available for the selected filters",
        headers: [],
        rows: [],
      };
    }

    switch (reportType) {
      case "summary":
      case "analytics":
        const analyticsData = data as AnalyticsReportData;
        return {
          title: analyticsData.period
            ? `Analytics Report - ${new Date(analyticsData.period.start).toLocaleDateString()} to ${new Date(analyticsData.period.end).toLocaleDateString()}`
            : "Analytics Report",
          description: "Comprehensive analysis of complaints and performance metrics",
          headers: ["Metric", "Value", "Details"],
          rows: [
            ["Total Complaints", analyticsData.summary?.totalComplaints?.toString() || "0", "All complaints in period"],
            ["Resolved Complaints", analyticsData.summary?.resolvedComplaints?.toString() || "0", "Successfully resolved"],
            ["Resolution Rate", analyticsData.summary?.resolutionRate ? `${analyticsData.summary.resolutionRate}%` : "0%", "Efficiency metric"],
            ["Active Technicians", analyticsData.summary?.activeTechnicians?.toString() || "0", "Available technicians"],
            ["Average Resolution Time", analyticsData.summary?.averageResolutionTime ? `${analyticsData.summary.averageResolutionTime}h` : "N/A", "Time to resolve complaints"],
          ],
          period: analyticsData.period,
          summary: analyticsData.summary,
        };

      case "performance":
        const performanceData = data as TechnicianPerformanceData;
        return {
          title: `Performance Report - ${performanceData.technician?.name || "Unknown"}`,
          description: `Performance metrics for ${performanceData.technician?.name || "technician"}`,
          headers: ["Metric", "Value", "Benchmark"],
          rows: [
            ["Total Tasks", performanceData.performance?.totalTasks?.toString() || "0", "≥ 15"],
            ["Completed Tasks", performanceData.performance?.completedTasks?.toString() || "0", "≥ 12"],
            ["Completion Rate", performanceData.performance?.completionRate ? `${performanceData.performance.completionRate}%` : "0%", "≥ 80%"],
            ["Avg Resolution Time", performanceData.performance?.averageResolutionTime ? `${performanceData.performance.averageResolutionTime}h` : "N/A", "≤ 24h"],
            ["Efficiency", performanceData.performance?.efficiency ? `${performanceData.performance.efficiency}%` : "0%", "≥ 85%"],
          ],
        };

      case "category":
        return {
          title: `Category Analysis - ${dateRange.start} to ${dateRange.end}`,
          description: "Analysis of complaints by category",
          headers: ["Category", "Total Complaints", "Resolved", "Resolution Rate"],
          rows: (data as AnalyticsReportData).summary?.categories?.map((cat: any) => [
            cat.name || "Unknown",
            cat.totalComplaints?.toString() || "0",
            cat.resolvedComplaints?.toString() || "0",
            cat.resolutionRate ? `${cat.resolutionRate}%` : "0%",
          ]) || [],
        };

      default:
        return {
          title: "Invalid Report Type",
          description: "Selected report type is not supported",
          headers: [],
          rows: [],
        };
    }
  };

  const exportReport = async (format: "csv" | "pdf" | "excel") => {
  try {
    setIsLoading(true);
    setError(null);

    // Determine the report ID safely
    let reportId: number | undefined;
    if ("technician" in (realReportData as TechnicianPerformanceData)) {
      // Technician performance report
      reportId = (realReportData as TechnicianPerformanceData).technician.id;
    } else if ("summary" in (realReportData as AnalyticsReportData)) {
      // Analytics report, assume ID comes from backend or savedReports
      reportId = savedReports[0]?.id; // fallback, you can adjust if backend returns ID differently
    }

    if (!reportId || isNaN(reportId) || reportId <= 0) {
      throw new Error("No report data available to export");
    }

    await reportsAPI.export(reportId, format);
    alert(`Report exported as ${format.toUpperCase()} successfully!`);
  } catch (error) {
    console.error(`Error exporting report as ${format}:`, error);
    setError(`Failed to export report as ${format.toUpperCase()}.`);
  } finally {
    setIsLoading(false);
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
      end: new Date().toISOString().split('T')[0],
    });
    setRealReportData(null);
    setError(null);
  };

  const handleTechnicianChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setTechnicianFilter(value);
      if (value !== "all" && reportType === "performance") {
        fetchTechnicianReport(parseInt(value));
      }
    },
    [fetchTechnicianReport, reportType]
  );

  const currentReport = formatRealReportData(realReportData);

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

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

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
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <FaSpinner className="animate-spin h-12 w-12 text-blue-500" />
                  </div>
                ) : savedReports.length === 0 ? (
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
                              Generated by {report.generatedByUser?.name || "Unknown"} on{" "}
                              {new Date(report.generatedAt).toLocaleDateString()}
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
                Refresh Saved Reports
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
                      reportType === key ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setReportType(key as typeof reportType)}
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
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
                <span className="self-center text-gray-500">to</span>
                <input
                  type="date"
                  className="border rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
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
                onChange={handleTechnicianChange}
              >
                <option value="all">All Technicians</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id.toString()}>
                    {tech.name} ({tech.speciality})
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
                onClick={() => exportReport("csv")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
                disabled={isLoading || !realReportData}
              >
                <FaFileCsv className="mr-2" />
                Export CSV
              </button>

              <button
                onClick={() => exportReport("pdf")}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
                disabled={isLoading || !realReportData}
              >
                <FaFilePdf className="mr-2" />
                Export PDF
              </button>

              <button
                onClick={() => exportReport("excel")}
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
          ) : !realReportData || currentReport.rows.length === 0 ? (
            <div className="text-center py-8">
              <FaExclamationTriangle className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-gray-500">{error || "No data available for the selected filters"}</p>
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
              {currentReport.summary && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Total Complaints</h3>
                    <p className="text-2xl font-bold text-blue-600">{currentReport.summary.totalComplaints || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800">Resolved</h3>
                    <p className="text-2xl font-bold text-green-600">{currentReport.summary.resolvedComplaints || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800">Resolution Rate</h3>
                    <p className="text-2xl font-bold text-purple-600">{currentReport.summary.resolutionRate || 0}%</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-800">Avg. Resolution Time</h3>
                    <p className="text-2xl font-bold text-orange-600">
                      {currentReport.summary.averageResolutionTime || "N/A"}h
                    </p>
                  </div>
                </div>
              )}

              {/* Report Summary */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Report Summary</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Report generated from real database data</li>
                  <li>• Data reflects period: {dateRange.start} to {dateRange.end}</li>
                  <li>
                    • Filters: Status: {statusFilter !== "all" ? statusFilter : "All"}, Category:{" "}
                    {categoryFilter !== "all" ? categoryFilter : "All"}, Urgency:{" "}
                    {urgencyFilter !== "all" ? urgencyFilter : "All"}, Technician:{" "}
                    {technicianFilter !== "all"
                      ? technicians.find((t) => t.id.toString() === technicianFilter)?.name || "Unassigned"
                      : "All"}
                  </li>
                  <li>• Export options available for further analysis</li>
                  {realReportData && <li>• Report has been saved to your account</li>}
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