import { type FC, useState } from 'react';
import { Input, Badge } from '../atoms';
import { type User } from '../../types';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';

export interface StudentSelectorProps {
  students: User[];
  selectedStudents: string[];
  onChange: (studentIds: string[]) => void;
  placeholder?: string;
}

const StudentSelector: FC<StudentSelectorProps> = ({
  students,
  selectedStudents,
  onChange,
  placeholder = 'Search students...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.index_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      onChange(selectedStudents.filter((id) => id !== studentId));
    } else {
      onChange([...selectedStudents, studentId]);
    }
  };

  const removeStudent = (studentId: string) => {
    onChange(selectedStudents.filter((id) => id !== studentId));
  };

  const selectedStudentsList = students.filter((s) => selectedStudents.includes(s.id));

  return (
    <div className="space-y-3">
      {/* Selected Students */}
      {selectedStudents.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          {selectedStudentsList.map((student) => (
            <Badge key={student.id} variant="info" className="pr-1">
              {student.name}
              <button
                type="button"
                onClick={() => removeStudent(student.id)}
                className="ml-1.5 hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search */}
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        leftIcon={<Search className="w-4 h-4" />}
        fullWidth
      />

      {/* Student List */}
      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
        {filteredStudents.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No students found</div>
        ) : (
          filteredStudents.map((student) => (
            <label
              key={student.id}
              className={clsx(
                'flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition',
                selectedStudents.includes(student.id) && 'bg-blue-50'
              )}
            >
              <input
                type="checkbox"
                checked={selectedStudents.includes(student.id)}
                onChange={() => toggleStudent(student.id)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{student.name}</div>
                <div className="text-sm text-gray-500">
                  {student.index_number} • {student.email}
                </div>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentSelector;
