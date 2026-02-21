import { useState, useEffect, type FC } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { X, Wifi, UserCheck, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000/api';
const SOCKET_URL = 'http://localhost:8000'; // Adjust if different from API_URL

interface LiveAttendanceMonitorProps {
    lectureId: string;
    lectureTitle: string;
    onClose: () => void;
}

interface AttendanceRecord {
    id: string;
    status: string;
    student: {
        id: string;
        name: string;
        index_number: string;
    };
    timestamp: string;
}

const LiveAttendanceMonitor: FC<LiveAttendanceMonitorProps> = ({ lectureId, lectureTitle, onClose }) => {
    const [, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [sessionActive, setSessionActive] = useState(false);
    const [sessionError, setSessionError] = useState('');

    // Initial fetch of existing attendance
    useEffect(() => {
        fetchAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lectureId]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/attendance/lecture/${lectureId}`, {
                withCredentials: true
            });

            // Map summary to get present students
            const present = response.data.data.summary
                .filter((item: any) => item.attendance)
                .map((item: any) => ({
                    id: item.attendance.id,
                    status: item.attendance.status,
                    student: item.student,
                    timestamp: item.attendance.timestamp
                }));

            setAttendances(present);
            addLog(`Loaded ${present.length} existing records.`);
        } catch (error) {
            console.error("Failed to fetch attendance:", error);
            addLog("Error loading existing attendance.");
        } finally {
            setLoading(false);
        }
    };

    const addLog = (message: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 50));
    };

    const startSession = async () => {
        try {
            setSessionError('');
            await axios.post(`${API_URL}/attendance/session/start`, { lectureId }, { withCredentials: true });
            setSessionActive(true);
            addLog('Session started');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to start session';
            setSessionError(msg);
            setSessionActive(false);
            addLog(msg);
        }
    };

    const endSession = async (withLog = true) => {
        try {
            await axios.post(`${API_URL}/attendance/session/end`, {}, { withCredentials: true });
            if (withLog) addLog('Session ended');
        } catch (error: any) {
            if (withLog) {
                const msg = error.response?.data?.message || 'Failed to end session';
                addLog(msg);
            }
        } finally {
            setSessionActive(false);
        }
    };

    useEffect(() => {
        startSession();
        return () => {
            void endSession(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lectureId]);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            withCredentials: true,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            setConnected(true);
            addLog('Connected to real-time server');
            newSocket.emit('join:lecture', lectureId);
        });

        newSocket.on('disconnect', () => {
            setConnected(false);
            addLog('Disconnected from server');
        });

        // Listen for GLOBAL RFID scans (from ESP32)
        newSocket.on('rfid:batch', (data: { rfids: string[]; lectureId?: string | null }) => {
            if (data.lectureId && data.lectureId !== lectureId) return;
            addLog(`Received batch of ${data.rfids.length} RFIDs`);
        });

        // Listen for attendance updates (successful marks)
        newSocket.on('attendance:marked', (newRecords: any[]) => {
            setAttendances(prev => {
                const existingIds = new Set(prev.map(p => p.student.id));
                const uniqueNew = newRecords.filter(r => !existingIds.has(r.student_id));

                if (uniqueNew.length > 0) {
                    fetchAttendance();
                    addLog(`Marked ${uniqueNew.length} new students Present!`);
                }
                return prev;
            });
        });

        return () => {
            newSocket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lectureId]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Wifi className={`w-5 h-5 ${connected ? 'text-green-600' : 'text-red-500'}`} />
                            Live Attendance: {lectureTitle}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {connected ? 'Listening for RFID scans...' : 'Connecting to server...'}
                        </p>
                        {sessionError && (
                            <p className="text-xs text-red-600 mt-1">{sessionError}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={sessionActive ? 'destructive' : 'secondary'}
                            onClick={() => endSession()}
                            disabled={!sessionActive}
                        >
                            {sessionActive ? 'End Session' : 'Session Ended'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                void endSession(false);
                                onClose();
                            }}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3">

                    {/* Recent Logs / Status */}
                    <div className="border-r bg-slate-50 p-4 flex flex-col gap-4 overflow-hidden">
                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                            <div className="text-sm font-medium text-slate-500 mb-1">Total Present</div>
                            <div className="text-4xl font-bold text-green-600">{attendances.length}</div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            <h3 className="text-sm font-semibold mb-2 text-slate-700">Live Logs</h3>
                            <div className="flex-1 bg-white border rounded-md p-2 overflow-y-auto">
                                <div className="space-y-1">
                                    {logs.map((log, i) => (
                                        <div key={i} className="text-xs font-mono text-slate-600 border-b border-slate-100 last:border-0 pb-1 mb-1">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Students List */}
                    <div className="col-span-2 p-6 overflow-hidden flex flex-col">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-blue-500" />
                            Marked Present
                        </h3>

                        {loading ? (
                            <div className="flex items-center justify-center flex-1">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2">
                                {attendances.length === 0 ? (
                                    <div className="text-center text-slate-400 py-10">
                                        No students marked yet.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {attendances.map((record) => (
                                            <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                    {record.student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{record.student.name}</div>
                                                    <div className="text-xs text-slate-500">{record.student.index_number}</div>
                                                </div>
                                                <span className="ml-auto inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-700 hover:bg-green-100">
                                                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LiveAttendanceMonitor;
