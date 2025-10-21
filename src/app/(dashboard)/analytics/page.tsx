"use client";

import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaDownload,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaFilePdf,
  FaFileCsv,
  FaFileImage,
} from "react-icons/fa";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Import api service
import { analyticsAPI } from "@/lib/api";

// Define TypeScript interfaces matching your backend
interface ChartDataItem {
  name: string;
  totalComplaints: number;
  resolved: number;
  pending: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface TechnicianPerformance {
  name: string;
  completed: number;
  efficiency: string;
  avgTime: string;
}

interface DashboardOverview {
  stats: {
    totalComplaints: number;
    resolvedComplaints: number;
    resolutionRate: number;
    avgDailyComplaints: number;
    totalTechnicians: number;
    totalResidents: number;
  };
  chartData: ChartDataItem[];
}

interface ComprehensiveAnalytics {
  stats: {
    totalComplaints: number;
    resolvedComplaints: number;
    resolutionRate: number;
    avgDailyComplaints: number;
    totalTechnicians: number;
    totalResidents: number;
  };
  chartData: ChartDataItem[];
  byCategory: CategoryData[];
  byStatus: StatusData[];
  topTechnicians: TechnicianPerformance[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}

interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
}

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState<number>(30);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<ComprehensiveAnalytics | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const fetchAnalyticsData = async (days: number = 30) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the comprehensive analytics endpoint from your backend
      const data = await analyticsAPI.getComprehensiveAnalytics(days);
      console.log('Analytics Data:', data)
      setAnalyticsData(data);
      
    } catch (error) {
      setError('Failed to fetch analytics data');
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData(timeRange);
  }, [timeRange]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error: </strong> {error}
          </div>
          <button
            onClick={() => fetchAnalyticsData(timeRange)}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600">No analytics data available</h2>
        </div>
      </div>
    );
  }

  // Destructure data from backend response
  const {
    stats,
    chartData,
    byCategory,
    byStatus,
    topTechnicians
  } = analyticsData;

  // Custom tooltip for the line chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-md">
          <p className="font-bold">{label}</p>
          <p className="text-blue-500">Total: {payload.find(p => p.dataKey === 'totalComplaints')?.value}</p>
          <p className="text-green-500">Resolved: {payload.find(p => p.dataKey === 'resolved')?.value}</p>
          <p className="text-yellow-500">Pending: {payload.find(p => p.dataKey === 'pending')?.value}</p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: PieLabelProps) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Export data as CSV
  const exportCSV = () => {
    const headers = "Date,Total Complaints,Resolved,Pending\n";
    const csvContent = chartData.reduce((csv: string, row: ChartDataItem) => {
      return csv + `${row.name},${row.totalComplaints},${row.resolved},${row.pending}\n`;
    }, headers);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `complaints_analytics_${timeRange}_days.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportOptions(false);
  };

  // Export dashboard as PNG image
  const exportPNG = async () => {
    if (dashboardRef.current) {
      try {
        const canvas = await html2canvas(dashboardRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `complaints_dashboard_${timeRange}_days.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error exporting PNG:', error);
        alert('Failed to export dashboard as image.');
      }
    }
    setShowExportOptions(false);
  };

  // Export dashboard as PDF
  const exportPDF = async () => {
    if (dashboardRef.current) {
      try {
        const canvas = await html2canvas(dashboardRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 10;
        
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`complaints_dashboard_${timeRange}_days.pdf`);
      } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Failed to export dashboard as PDF.');
      }
    }
    setShowExportOptions(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6" ref={dashboardRef}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Complaints Analytics</h1>
            <p className="text-gray-600">Visual insights and performance metrics</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0 relative">
            <div className="flex items-center border rounded-md bg-white pr-2">
              <FaCalendarAlt className="text-gray-400 ml-2" />
              <select
                className="border-0 py-2 pl-2 pr-8 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
              >
                <option value={7}>Last 7 days</option>
                <option value={15}>Last 15 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            
            {/* Export button with dropdown */}
            <div className="relative">
              <button 
                className="bg-white border rounded-md px-3 py-2 flex items-center hover:bg-gray-50"
                onClick={() => setShowExportOptions(!showExportOptions)}
              >
                <FaDownload className="text-gray-600 mr-1" />
                <span>Export</span>
              </button>
              
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <button
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={exportCSV}
                  >
                    <FaFileCsv className="mr-2 text-green-600" />
                    Export as CSV
                  </button>
                  <button
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={exportPNG}
                  >
                    <FaFileImage className="mr-2 text-blue-600" />
                    Export as PNG
                  </button>
                  <button
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={exportPDF}
                  >
                    <FaFilePdf className="mr-2 text-red-600" />
                    Export as PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Total Complaints</p>
                <p className="text-2xl font-bold">{stats.totalComplaints.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaExclamationTriangle className="text-blue-600 text-xl" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Last {timeRange} days</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Resolved</p>
                <p className="text-2xl font-bold">{stats.resolvedComplaints.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Successful closures</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Resolution Rate</p>
                <p className="text-2xl font-bold">{stats.resolutionRate}%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FaChartLine className="text-purple-600 text-xl" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Efficiency metric</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Avg. Daily</p>
                <p className="text-2xl font-bold">{stats.avgDailyComplaints.toFixed(1)}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaClock className="text-yellow-600 text-xl" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Complaints per day</p>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Complaints Overview</h2>
            <div className="flex items-center text-sm text-gray-500">
              <FaChartLine className="mr-1" />
              <span>Last {timeRange} days</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  axisLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                  iconSize={10}
                />
                <Line
                  type="monotone"
                  dataKey="totalComplaints"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Total Complaints"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Resolved"
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Pending"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Complaints by Category */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">By Category</h2>
              <div className="flex items-center text-sm text-gray-500">
                <FaChartPie className="mr-1" />
                <span>Distribution</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={true}
                  >
                    {byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} complaints`, 'Count']} />
                  <Legend 
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    formatter={(value, entry, index) => (
                      <span className="text-sm">
                        {value}: {byCategory[index]?.value || 0}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Complaints by Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">By Status</h2>
              <div className="flex items-center text-sm text-gray-500">
                <FaChartBar className="mr-1" />
                <span>Current state</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byStatus}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    axisLine={false}
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="value" name="Complaints">
                    {byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Performers Section */}
        <div className="bg-white p-6 rounded-lg shadow">
  <h2 className="text-lg font-semibold mb-4">Top Performing Technicians</h2>
  {/* {console.log('Top Technicians:', topTechnicians)} Debug log */}
  {topTechnicians && topTechnicians.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {topTechnicians.map((tech, index) => (
        <div key={index} className="border rounded-lg p-4">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-semibold">
                {tech.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h3 className="font-medium">{tech.name}</h3>
              <p className="text-sm text-gray-500">Technician</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold">{tech.completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div>
              <p className="text-lg font-bold">{tech.efficiency}</p>
              <p className="text-xs text-gray-500">Efficiency</p>
            </div>
            <div>
              <p className="text-lg font-bold">{tech.avgTime}</p>
              <p className="text-xs text-gray-500">Avg. Time</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-gray-500 text-center">No top performing technicians available for the selected time range.</p>
  )}
</div>
      </div>
    </div>
  );
};

export default AnalyticsPage;