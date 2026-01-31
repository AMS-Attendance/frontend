import { type FC, useState, useEffect } from 'react';
import { Card, Button, Modal, Loading, Alert } from '../atoms';
import { ModuleForm, ModuleCard } from '../molecules';
import { moduleApi, userApi } from '../../services/api';
import { type Module, type User, type ModuleFormData } from '../../types';
import { Plus, Search } from 'lucide-react';
import Input from '../atoms/Input';

const ModulesList: FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [modulesRes, lecturersRes] = await Promise.all([
        moduleApi.getAllModules(),
        userApi.getLecturers(),
      ]);
      const modulesData = modulesRes.data;
      const lecturersData = lecturersRes.data;
      setModules(modulesData);
      setLecturers(lecturersData);
    } catch (err: any) {
      setError((err as Error).message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: ModuleFormData) => {
    await moduleApi.createModule(data);
    setShowCreateModal(false);
    await loadData();
  };

  const handleUpdate = async (data: ModuleFormData) => {
    if (!editingModule) return;
    await moduleApi.updateModule(editingModule.id, data);
    setEditingModule(null);
    await loadData();
  };

  const filteredModules = modules.filter(
    (module) =>
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading text="Loading modules..." />;

  return (
    <div className="space-y-6">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <div className="flex items-center justify-between gap-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search modules..."
            leftIcon={<Search className="w-4 h-4" />}
            className="max-w-md"
          />
          <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus />}>
            Create Module
          </Button>
        </div>
      </Card>

      {filteredModules.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">No modules found</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onClick={() => setEditingModule(module)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Module"
        size="md"
      >
        <ModuleForm
          lecturers={lecturers}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingModule}
        onClose={() => setEditingModule(null)}
        title="Edit Module"
        size="md"
      >
        {editingModule && (
          <ModuleForm
            initialData={{
              code: editingModule.code,
              name: editingModule.name,
              lecturer_id: editingModule.lecturer_id,
            }}
            lecturers={lecturers}
            onSubmit={handleUpdate}
            onCancel={() => setEditingModule(null)}
            isEdit
          />
        )}
      </Modal>
    </div>
  );
};

export default ModulesList;
