import { type FC, useState, useEffect } from 'react';
import { Card, Button, Modal, Loading, Alert } from '../atoms';
import { StudentSelector } from '../molecules';
import { moduleApi, userApi } from '../../services/api';
import { type Module, type User } from '../../types';
import { Users, Plus, Trash2 } from 'lucide-react';

export interface StudentEnrollmentProps {
  moduleId: string;
}

const StudentEnrollment: FC<StudentEnrollmentProps> = ({ moduleId }) => {
  const [module, setModule] = useState<Module | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [moduleData, studentsData] = await Promise.all([
          moduleApi.getModuleById(moduleId),
          userApi.getStudents(),
        ]);
        setModule(moduleData.data);
        setEnrolledStudents(moduleData.data.students || []);
        setAllStudents(studentsData.data);
      } catch (err) {
        setError((err as Error).message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [moduleId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [moduleData, studentsData] = await Promise.all([
        moduleApi.getModuleById(moduleId),
        userApi.getStudents(),
      ]);
      setModule(moduleData.data);
      setEnrolledStudents(moduleData.data.students || []);
      setAllStudents(studentsData.data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudents = async () => {
    try {
      setSubmitting(true);
      setError('');
      await moduleApi.addStudents(moduleId, selectedStudents);
      setShowAddModal(false);
      setSelectedStudents([]);
      await loadData();
    } catch (err) {
      setError((err as Error).message || 'Failed to add students');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Remove this student from the module?')) return;
    try {
      setError('');
      await moduleApi.removeStudent(moduleId, studentId);
      await loadData();
    } catch (err) {
      setError((err as Error).message || 'Failed to remove student');
    }
  };

  const availableStudents = allStudents.filter(
    (s) => !enrolledStudents.some((es) => es.id === s.id)
  );

  if (loading) return <Loading text="Loading enrollment data..." />;
  if (!module) return <Alert type="error">Module not found</Alert>;

  return (
    <div className="space-y-6">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <Card
        title={`${module.code} - ${module.name}`}
        subtitle="Student Enrollment"
        action={
          <Button onClick={() => setShowAddModal(true)} leftIcon={<Plus />} size="sm">
            Add Students
          </Button>
        }
      >
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <Users className="w-5 h-5" />
          <span className="font-medium">
            {enrolledStudents.length} student{enrolledStudents.length !== 1 ? 's' : ''} enrolled
          </span>
        </div>

        {enrolledStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No students enrolled yet</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {enrolledStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">
                      {student.index_number} • {student.email}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  color="danger"
                  size="sm"
                  onClick={() => handleRemoveStudent(student.id)}
                  leftIcon={<Trash2 />}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Students Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedStudents([]);
        }}
        title="Add Students to Module"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setSelectedStudents([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStudents}
              loading={submitting}
              disabled={selectedStudents.length === 0}
            >
              Add {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
            </Button>
          </>
        }
      >
        {availableStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">All students are already enrolled</div>
        ) : (
          <StudentSelector
            students={availableStudents}
            selectedStudents={selectedStudents}
            onChange={setSelectedStudents}
          />
        )}
      </Modal>
    </div>
  );
};

export default StudentEnrollment;
