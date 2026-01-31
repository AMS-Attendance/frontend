import { type FC } from 'react';
import { AttendanceView } from '../components/organisms';

const AttendancePage: FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-2">Track and manage student attendance records</p>
      </div>
      <AttendanceView />
    </div>
  );
};

export default AttendancePage;
