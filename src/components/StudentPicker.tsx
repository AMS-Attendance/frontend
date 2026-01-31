import { type FC, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000/api';

interface Student {
  id: string;
  name: string;
  email: string;
  index_number: string;
  batch: number;
  degree: string;
}

interface StudentPickerProps {
  selectedStudents: string[];
  onStudentsChange: (studentIds: string[]) => void;
}

const StudentPicker: FC<StudentPickerProps> = ({ selectedStudents, onStudentsChange }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [degreeFilter, setDegreeFilter] = useState('');
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [availableDegrees, setAvailableDegrees] = useState<string[]>([]);

  // Selection mode
  const [selectMode, setSelectMode] = useState<'individual' | 'batch' | 'degree'>('individual');

  useEffect(() => {
    fetchAllStudents();
  }, []);

  useEffect(() => {
    let filtered = [...students];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          (s.index_number && s.index_number.toLowerCase().includes(query))
      );
    }

    if (batchFilter) {
      filtered = filtered.filter(s => s.batch === parseInt(batchFilter));
    }

    if (degreeFilter) {
      filtered = filtered.filter(s => s.degree === degreeFilter);
    }

    setFilteredStudents(filtered);
  }, [searchQuery, batchFilter, degreeFilter, students]);

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users?role=student`, {
        withCredentials: true
      });
      const studentData = response.data.data || [];
      setStudents(studentData);
      
      // Extract unique batches and degrees
      const batches = [...new Set(studentData.map((s: Student) => s.batch).filter(Boolean))] as string[];
      const degrees = [...new Set(studentData.map((s: Student) => s.degree).filter(Boolean))] as string[];
      setAvailableBatches(batches);
      setAvailableDegrees(degrees);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      onStudentsChange(selectedStudents.filter(id => id !== studentId));
    } else {
      onStudentsChange([...selectedStudents, studentId]);
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredStudents.map(s => s.id);
    onStudentsChange([...new Set([...selectedStudents, ...allIds])]);
  };

  const handleDeselectAll = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    onStudentsChange(selectedStudents.filter(id => !filteredIds.includes(id)));
  };

  const handleSelectByBatch = (batch: string) => {
    const batchStudents = students.filter(s => s.batch === parseInt(batch)).map(s => s.id);
    onStudentsChange([...new Set([...selectedStudents, ...batchStudents])]);
  };

  const handleSelectByDegree = (degree: string) => {
    const degreeStudents = students.filter(s => s.degree === degree).map(s => s.id);
    onStudentsChange([...new Set([...selectedStudents, ...degreeStudents])]);
  };

  const handleClearAll = () => {
    onStudentsChange([]);
  };

  const getSelectedCount = () => {
    return selectedStudents.length;
  };

  const getFilteredSelectedCount = () => {
    return filteredStudents.filter(s => selectedStudents.includes(s.id)).length;
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Select Students</h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-blue-600">{getSelectedCount()}</span> student(s) selected
          </div>
          {getSelectedCount() > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:text-red-700 underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Selection Mode */}
      {/* <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selection Mode</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectMode('individual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectMode === 'individual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Individual
          </button>
          <button
            type="button"
            onClick={() => setSelectMode('batch')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectMode === 'batch'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            By Batch
          </button>
          <button
            type="button"
            onClick={() => setSelectMode('degree')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectMode === 'degree'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            By Degree
          </button>
        </div>
      </div> */}

      {/* Batch/Degree Quick Selection */}
      {/* {selectMode === 'batch' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Select Entire Batch</h4>
          <div className="flex flex-wrap gap-2">
            {availableBatches.map(batch => (
              <button
                key={batch}
                type="button"
                onClick={() => handleSelectByBatch(batch)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
              >
                Batch {batch}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectMode === 'degree' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Select Entire Degree Program</h4>
          <div className="flex flex-wrap gap-2">
            {availableDegrees.map(degree => (
              <button
                key={degree}
                type="button"
                onClick={() => handleSelectByDegree(degree)}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
              >
                {degree}
              </button>
            ))}
          </div>
        </div>
      )} */}

      {/* Filters */}
      {selectMode === 'individual' && (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, email, or index..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Batch</label>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Batches</option>
                {availableBatches.map(batch => (
                  <option key={batch} value={batch}>
                    Batch {batch}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Degree</label>
              <select
                value={degreeFilter}
                onChange={(e) => setDegreeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Degrees</option>
                {availableDegrees.map(degree => (
                  <option key={degree} value={degree}>
                    {degree}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {(searchQuery || batchFilter || degreeFilter) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Showing {filteredStudents.length} of {students.length} students</span>
              {(searchQuery || batchFilter || degreeFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setBatchFilter('');
                    setDegreeFilter('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={handleSelectAll}
          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition shadow-sm"
        >
          ✓ Select All Filtered ({filteredStudents.length})
        </button>
        <button
          type="button"
          onClick={handleDeselectAll}
          className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-medium hover:bg-yellow-700 transition shadow-sm"
        >
          ✗ Deselect Filtered ({getFilteredSelectedCount()})
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition shadow-sm"
        >
          Clear All Selections
        </button>
      </div>

      {/* Student List */}
      <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg bg-white">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No students found matching filters.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredStudents.map(student => (
              <label
                key={student.id}
                className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => handleToggleStudent(student.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  <div className="text-xs text-gray-500">
                    {student.index_number} • {student.email}
                  </div>
                  <div className="text-xs text-gray-400">
                    Batch {student.batch} • {student.degree}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-3 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-900">
              {getSelectedCount() === 0 ? 'No students selected' : 
               getSelectedCount() === 1 ? '1 student will be enrolled' : 
               `${getSelectedCount()} students will be enrolled`}
            </p>
            {getSelectedCount() > 0 && filteredStudents.length > 0 && getFilteredSelectedCount() > 0 && (
              <p className="text-xs text-indigo-600 mt-1">
                ({getFilteredSelectedCount()} from current filter)
              </p>
            )}
          </div>
          {getSelectedCount() > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold">
                {getSelectedCount()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPicker;
