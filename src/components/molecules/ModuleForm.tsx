import { type FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input, Select, Button, Alert } from '../atoms';
import { type ModuleFormData, type User } from '../../types';

export interface ModuleFormProps {
  initialData?: Partial<ModuleFormData>;
  lecturers: User[];
  onSubmit: (data: ModuleFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

const ModuleForm: FC<ModuleFormProps> = ({
  initialData,
  lecturers,
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ModuleFormData>({
    defaultValues: initialData,
  });

  const [error, setError] = useState<string>('');

  const onSubmitHandler = async (data: ModuleFormData) => {
    try {
      setError('');
      await onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'Failed to save module');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}

      <Input
        {...register('code', { required: 'Module code is required' })}
        label="Module Code"
        placeholder="e.g., CS101"
        error={errors.code?.message}
        fullWidth
        required
      />

      <Input
        {...register('name', { required: 'Module name is required' })}
        label="Module Name"
        placeholder="e.g., Introduction to Programming"
        error={errors.name?.message}
        fullWidth
        required
      />

      <Select
        {...register('lecturer_id', { required: 'Lecturer is required' })}
        label="Lecturer"
        placeholder="Select a lecturer"
        options={lecturers.map((lec) => ({
          value: lec.id,
          label: lec.name,
        }))}
        error={errors.lecturer_id?.message}
        fullWidth
        required
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Update Module' : 'Create Module'}
        </Button>
      </div>
    </form>
  );
};

export default ModuleForm;
