import { useState, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import {
  CreditCard,
  Search,
  UserPlus,
  UserCheck,
  AlertCircle,
  Loader2,
  LogOut,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Alert } from './atoms';
import StudentRegistrationForm from './StudentRegistrationForm';

const API_URL = import.meta.env.VITE_BASE_URL;
const SOCKET_URL = import.meta.env.VITE_BASE_URL;

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  rfid: string | null;
  index_number: string;
  degree: string;
  batch: number;
}

interface User {
  name: string;
  role: string;
  email: string;
}

interface RFIDLog {
  rfid: string;
  timestamp: string;
  status: 'exists' | 'registered' | 'pending';
  student?: Student;
}

const RFIDRegistration: FC = () => {
  const [connected, setConnected] = useState(false);
  const [currentRfid, setCurrentRfid] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [checkingRfid, setCheckingRfid] = useState(false);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [logs, setLogs] = useState<RFIDLog[]>([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [user] = useState<User | null>(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
      setConnected(false);
    });

    // Listen for RFID scans
    socket.on('rfid:batch', (data: { rfids: string[] }) => {
      console.log('Received RFID batch:', data);
      if (data.rfids && data.rfids.length > 0) {
        // Process the first RFID in the batch
        handleRfidScan(data.rfids[0]);
      }
    });

    socket.on('rfid:scanned', (data: { rfid: string }) => {
      console.log('RFID scanned:', data);
      handleRfidScan(data.rfid);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRfidScan = async (rfid: string) => {
    setCurrentRfid(rfid);
    setCheckingRfid(true);
    setSearchResults([]);
    setSearchQuery('');
    setSelectedStudent(null);

    try {
      const response = await axios.get(`${API_URL}/users/check-rfid/${rfid}`, {
        withCredentials: true,
      });

      if (response.data.exists) {
        // RFID already registered
        addLog(rfid, 'exists', response.data.data);
        setAlert({
          type: 'info',
          message: `RFID already registered to ${response.data.data.name} (${response.data.data.index_number})`,
        });
      } else {
        // RFID not found - ready for registration
        addLog(rfid, 'pending');
        setAlert({
          type: 'info',
          message: 'RFID not found. Search for the student or register a new student.',
        });
      }
    } catch (error: any) {
      console.error('Error checking RFID:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to check RFID',
      });
    } finally {
      setCheckingRfid(false);
    }
  };

  const handleManualRfidCheck = () => {
    if (currentRfid.trim()) {
      handleRfidScan(currentRfid.trim());
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setAlert({ type: 'error', message: 'Search query must be at least 2 characters' });
      return;
    }

    setSearching(true);
    setAlert(null);

    try {
      const response = await axios.get(`${API_URL}/users/search-student`, {
        params: { query: searchQuery.trim() },
        withCredentials: true,
      });

      setSearchResults(response.data.data);
      if (response.data.data.length === 0) {
        setAlert({ type: 'info', message: 'No students found. Register as a new student?' });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Search failed',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleAssignRfid = async (student: Student) => {
    if (!currentRfid) {
      setAlert({ type: 'error', message: 'No RFID to assign' });
      return;
    }

    if (student.rfid) {
      setAlert({
        type: 'error',
        message: `This student already has an RFID: ${student.rfid}`,
      });
      return;
    }

    setSelectedStudent(student);

    try {
      const response = await axios.patch(
        `${API_URL}/users/${student.id}/rfid`,
        { rfid: currentRfid },
        { withCredentials: true }
      );

      if (response.data.success) {
        addLog(currentRfid, 'registered', response.data.data);
        setAlert({
          type: 'success',
          message: `RFID successfully assigned to ${student.name}!`,
        });
        setSearchResults([]);
        setSearchQuery('');
        setCurrentRfid('');
        setSelectedStudent(null);
      }
    } catch (error: any) {
      console.error('Assign RFID error:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to assign RFID',
      });
    } finally {
      setSelectedStudent(null);
    }
  };

  const addLog = (rfid: string, status: 'exists' | 'registered' | 'pending', student?: Student) => {
    const log: RFIDLog = {
      rfid,
      timestamp: new Date().toLocaleTimeString(),
      status,
      student,
    };
    setLogs((prev) => [log, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  const handleRegistrationSuccess = (student: Student) => {
    addLog(currentRfid, 'registered', student);
    setAlert({
      type: 'success',
      message: `New student ${student.name} registered successfully with RFID!`,
    });
    setCurrentRfid('');
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-blue-600" />
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">Real-time attendance monitoring & management</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
                ></div>
                <span className="text-sm text-gray-600">{connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <Button onClick={handleLogout} className="bg-red-600 text-white hover:bg-red-700">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="mt-4 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                RFID Monitor
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/student-registration')}
              className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600 hover:text-blue-700"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Student Registration
              </div>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - RFID Input & Search */}
          <div className="lg:col-span-2 space-y-6">
            {/* RFID Scanner Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                RFID Scanner
              </h2>

              {alert && (
                <Alert type={alert.type} className="mb-4">
                  {alert.message}
                </Alert>
              )}

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={currentRfid}
                    onChange={(e) => setCurrentRfid(e.target.value)}
                    placeholder="Scan RFID"
                    className="flex-1 text-lg font-mono"
                    disabled={checkingRfid}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleManualRfidCheck();
                      }
                    }}
                  />
                  <Button
                    onClick={handleManualRfidCheck}
                    disabled={!currentRfid || checkingRfid}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {checkingRfid ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Check
                      </>
                    )}
                  </Button>
                </div>

                {checkingRfid && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Checking RFID...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Student Search Card */}
            {currentRfid && !checkingRfid && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  Search Student
                </h2>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or index number"
                      className="flex-1"
                      disabled={searching}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={!searchQuery || searching}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {searching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      <p className="text-sm text-gray-600 font-medium">
                        Found {searchResults.length} student(s):
                      </p>
                      {searchResults.map((student) => (
                        <div
                          key={student.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{student.name}</h3>
                              <p className="text-sm text-gray-600">Index: {student.index_number}</p>
                              <p className="text-sm text-gray-600">Email: {student.email}</p>
                              {student.degree && (
                                <p className="text-sm text-gray-600">
                                  {student.degree} - Batch {student.batch}
                                </p>
                              )}
                              {student.rfid && (
                                <p className="text-sm text-orange-600 mt-1">
                                  ⚠️ Already has RFID: {student.rfid}
                                </p>
                              )}
                            </div>
                            <Button
                              onClick={() => handleAssignRfid(student)}
                              disabled={!!student.rfid || selectedStudent?.id === student.id}
                              className={`${
                                student.rfid
                                  ? 'bg-gray-300 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-700'
                              } text-white`}
                            >
                              {selectedStudent?.id === student.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Assign RFID
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Register New Student Button */}
                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => setShowRegistrationForm(true)}
                      className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Register as New Student
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Activity Log */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Log</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity yet</p>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        log.status === 'registered'
                          ? 'bg-green-50 border-green-200'
                          : log.status === 'exists'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {log.status === 'registered' ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : log.status === 'exists' ? (
                          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">{log.timestamp}</p>
                          <p className="text-sm font-mono font-semibold text-gray-900 truncate">
                            {log.rfid}
                          </p>
                          {log.student && (
                            <p className="text-xs text-gray-700 mt-1">
                              {log.student.name} ({log.student.index_number})
                            </p>
                          )}
                          <p
                            className={`text-xs mt-1 font-medium ${
                              log.status === 'registered'
                                ? 'text-green-700'
                                : log.status === 'exists'
                                ? 'text-blue-700'
                                : 'text-yellow-700'
                            }`}
                          >
                            {log.status === 'registered'
                              ? '✓ Registered'
                              : log.status === 'exists'
                              ? 'Already exists'
                              : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Registration Form Dialog */}
      <StudentRegistrationForm
        open={showRegistrationForm}
        onClose={() => setShowRegistrationForm(false)}
        rfid={currentRfid}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
};

export default RFIDRegistration;
