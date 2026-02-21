import { type FC, useState, useEffect } from 'react';
import { Card, Badge, Loading, Alert } from '../atoms';
import { attendanceApi } from '../../services/api';
import { type Attendance, type AttendanceStats } from '../../types';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

export interface AttendanceViewProps {
  lectureId?: string;
  studentId?: string;
}

const AttendanceView: FC<AttendanceViewProps> = ({ lectureId, studentId }) => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [lectureId, studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      if (lectureId) {
        const data = await attendanceApi.getAllAttendance({ lectureId });
        setAttendance(data.data);
      } else if (studentId) {
        const data = await attendanceApi.getStudentAttendance(studentId);
        setAttendance(data.data);
        setStats(data.stats);
      } else {
        const data = await attendanceApi.getAllAttendance();
        setAttendance(data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) return <Loading text="Loading attendance..." />;

  return (
    <div className="space-y-6">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Stats Card - Only for student view */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.present_count}</div>
                <div className="text-sm text-gray-500">Present</div>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.absent_count}</div>
                <div className="text-sm text-gray-500">Absent</div>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.late_count}</div>
                <div className="text-sm text-gray-500">Late</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Attendance Records */}
      <Card title="Attendance Records">
        {attendance.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No attendance records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {!studentId && <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Student</th>}
                  {!lectureId && <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Lecture</th>}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Check-in Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    {!studentId && record.student && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{record.student.name}</div>
                        <div className="text-gray-500">{record.student.index_number}</div>
                      </td>
                    )}
                    {!lectureId && record.lecture && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{record.lecture.title}</div>
                        <div className="text-gray-500">
                          {record.lecture.module?.code}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(record.marked_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {formatTime(record.marked_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          record.status === 'present'
                            ? 'success'
                            : record.status === 'late'
                              ? 'warning'
                              : 'error'
                        }
                      >
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info" size="sm">
                        {record.marked_by_rfid ? 'RFID' : 'Manual'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AttendanceView;
