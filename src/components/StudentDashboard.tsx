import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000/api';

interface Module {
  _id: string;
  code: string;
  name: string;
  credits: number;
}

interface AttendanceRecord {
  _id: string;
  lectureId: {
    _id: string;
    moduleId: Module;
    startTime: string;
    location: string;
    type: string;
  };
  status: string;
  timestamp: string;
  remarks?: string;
}

interface ModuleSummary {
  module: Module;
  totalLectures: number;
  attendedLectures: number;
  percentage: number;
  meets80Percent: boolean;
  status: string;
}

const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'records'>('summary');
  const [summary, setSummary] = useState<ModuleSummary[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  
  // Filters
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [user] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  useEffect(() => {
    fetchSummary();
    fetchAttendanceRecords();
  }, []);

  useEffect(() => {
    let filtered = [...attendanceRecords];

    if (selectedModule) {
      filtered = filtered.filter(
        record => record.lectureId?.moduleId?._id === selectedModule
      );
    }

    if (startDate) {
      filtered = filtered.filter(
        record => new Date(record.timestamp) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        record => new Date(record.timestamp) <= new Date(endDate)
      );
    }

    setFilteredRecords(filtered);
  }, [selectedModule, startDate, endDate, attendanceRecords]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/attendance/student/summary`, {
        withCredentials: true
      });
      setSummary(response.data.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load attendance summary';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const response = await axios.get(`${API_URL}/attendance/student/my-attendance`, {
        withCredentials: true
      });
      setAttendanceRecords(response.data.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load attendance records';
      setError(errorMessage);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setSelectedModule('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-linear-to-r from-indigo-600 to-blue-500 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Student Attendance Dashboard</h1>
          <p className="text-indigo-100 mt-1">
            Welcome back, {user?.name} • {user?.indexNumber}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'summary'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Attendance Summary
              </button>
              <button
                onClick={() => setActiveTab('records')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'records'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📅 Attendance Records
              </button>
            </nav>
          </div>

          {/* Error Display */}
          {error && (
            <div className="m-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Module-wise Attendance</h2>
                <button
                  onClick={fetchSummary}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  🔄 Refresh
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  <p className="text-gray-600 mt-4">Loading attendance data...</p>
                </div>
              ) : summary.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No modules enrolled yet.</p>
                  <p className="text-gray-400 text-sm mt-2">Contact your lecturer for enrollment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {summary.map((moduleSummary) => (
                    <div
                      key={moduleSummary.module._id}
                      className={`border-2 rounded-lg p-6 transition-all hover:shadow-lg ${
                        moduleSummary.meets80Percent
                          ? 'border-green-300 bg-green-50'
                          : 'border-red-300 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {moduleSummary.module.code}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {moduleSummary.module.name}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            moduleSummary.meets80Percent
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {moduleSummary.meets80Percent ? '✓ Pass' : '✗ Below 80%'}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-sm text-gray-700 mb-1">
                            <span>Attendance</span>
                            <span className="font-bold">{moduleSummary.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                moduleSummary.percentage >= 80
                                  ? 'bg-green-500'
                                  : moduleSummary.percentage >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${moduleSummary.percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="pt-3 border-t border-gray-300 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Attended:</span>
                            <span className="font-semibold text-gray-800">
                              {moduleSummary.attendedLectures} / {moduleSummary.totalLectures}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Credits:</span>
                            <span className="font-semibold text-gray-800">
                              {moduleSummary.module.credits}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span
                              className={`font-semibold ${
                                moduleSummary.meets80Percent ? 'text-green-700' : 'text-red-700'
                              }`}
                            >
                              {moduleSummary.status}
                            </span>
                          </div>
                        </div>

                        {/* Warning */}
                        {!moduleSummary.meets80Percent && (
                          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                            ⚠️ Warning: Below 80% attendance requirement
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Records Tab */}
          {activeTab === 'records' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Attendance Records</h2>

              {/* Filters */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter Records</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Module</label>
                    <select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">All Modules</option>
                      {summary.map((s) => (
                        <option key={s.module._id} value={s.module._id}>
                          {s.module.code} - {s.module.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  Showing {filteredRecords.length} of {attendanceRecords.length} records
                </div>
              </div>

              {/* Records Table */}
              {filteredRecords.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No attendance records found.</p>
                  <p className="text-gray-400 text-sm mt-2">Adjust filters or attend lectures to see records here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date & Time</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Module</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr key={record._id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {formatDateTime(record.lectureId?.startTime)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <span className="font-semibold text-gray-800">
                                {record.lectureId?.moduleId?.code}
                              </span>
                              <br />
                              <span className="text-xs text-gray-500">
                                {record.lectureId?.moduleId?.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {record.lectureId?.type}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {record.lectureId?.location}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                record.status
                              )}`}
                            >
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.remarks || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
