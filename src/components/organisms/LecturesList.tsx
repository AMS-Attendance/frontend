import { type FC, useState, useEffect } from 'react';
import { Card, Button, Modal, Loading, Alert } from '../atoms';
import { LectureForm, LectureCard } from '../molecules';
import { lectureApi, moduleApi } from '../../services/api';
import { type Lecture, type Module, type LectureFormData } from '../../types';
import { Plus, Calendar, Clock } from 'lucide-react';

const LecturesList: FC = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'today'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [lecturesData, modulesData] = await Promise.all([
        filter === 'upcoming'
          ? lectureApi.getUpcomingLectures()
          : filter === 'today'
          ? lectureApi.getTodayLectures()
          : lectureApi.getAllLectures(),
        moduleApi.getAllModules(),
      ]);
      setLectures(lecturesData.data);
      setModules(modulesData.data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: LectureFormData) => {
    await lectureApi.createLecture(data);
    setShowCreateModal(false);
    await loadData();
  };

  const handleUpdate = async (data: LectureFormData) => {
    if (!editingLecture) return;
    await lectureApi.updateLecture(editingLecture.id, data);
    setEditingLecture(null);
    await loadData();
  };

  if (loading) return <Loading text="Loading lectures..." />;

  return (
    <div className="space-y-6">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'solid' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
              leftIcon={<Calendar />}
            >
              All
            </Button>
            <Button
              variant={filter === 'today' ? 'solid' : 'outline'}
              onClick={() => setFilter('today')}
              size="sm"
              leftIcon={<Clock />}
            >
              Today
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'solid' : 'outline'}
              onClick={() => setFilter('upcoming')}
              size="sm"
              leftIcon={<Calendar />}
            >
              Upcoming
            </Button>
          </div>
          <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus />}>
            Schedule Lecture
          </Button>
        </div>
      </Card>

      {lectures.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">No lectures found</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lectures.map((lecture) => (
            <LectureCard
              key={lecture.id}
              lecture={lecture}
              onClick={() => setEditingLecture(lecture)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule Lecture"
        size="lg"
      >
        <LectureForm
          modules={modules}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingLecture}
        onClose={() => setEditingLecture(null)}
        title="Edit Lecture"
        size="lg"
      >
        {editingLecture && (
          <LectureForm
            initialData={{
              title: editingLecture.title,
              module_id: editingLecture.module_id,
              scheduled_date: editingLecture.scheduled_date,
              scheduled_time: editingLecture.scheduled_time,
              duration: editingLecture.duration,
              location: editingLecture.location || '',
              description: editingLecture.description || '',
            }}
            modules={modules}
            onSubmit={handleUpdate}
            onCancel={() => setEditingLecture(null)}
            isEdit
          />
        )}
      </Modal>
    </div>
  );
};

export default LecturesList;
