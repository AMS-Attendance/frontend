import { type FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input, Select, Textarea, Button, Alert } from '../atoms';
import { type LectureFormData, type Module } from '../../types';

export interface LectureFormProps {
  initialData?: Partial<LectureFormData>;
  modules: Module[];
  onSubmit: (data: LectureFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

const LectureForm: FC<LectureFormProps> = ({
  initialData,
  modules,
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LectureFormData>({
    defaultValues: initialData,
  });

  const [error, setError] = useState<string>('');

  const onSubmitHandler = async (data: LectureFormData) => {
    try {
      setError('');
      await onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'Failed to save lecture');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}

      <Input
        {...register('title', { required: 'Title is required' })}
        label="Lecture Title"
        placeholder="e.g., Introduction to Variables"
        error={errors.title?.message}
        fullWidth
        required
      />

      <Select
        {...register('module_id', { required: 'Module is required' })}
        label="Module"
        placeholder="Select a module"
        options={modules.map((mod) => ({
          value: mod.id,
          label: `${mod.code} - ${mod.name}`,
        }))}
        error={errors.module_id?.message}
        fullWidth
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register('scheduled_date', { required: 'Date is required' })}
          label="Date"
          type="date"
          error={errors.scheduled_date?.message}
          fullWidth
          required
        />

        <Input
          {...register('scheduled_time', { required: 'Time is required' })}
          label="Time"
          type="time"
          error={errors.scheduled_time?.message}
          fullWidth
          required
        />
      </div>

      <Input
        {...register('duration', {
          required: 'Duration is required',
          valueAsNumber: true,
          min: { value: 15, message: 'Minimum duration is 15 minutes' },
        })}
        label="Duration (minutes)"
        type="number"
        placeholder="60"
        error={errors.duration?.message}
        fullWidth
        required
      />

      <Input
        {...register('location')}
        label="Location"
        placeholder="e.g., Lab 101"
        error={errors.location?.message}
        fullWidth
      />

      <Textarea
        {...register('description')}
        label="Description"
        placeholder="Brief description of the lecture..."
        rows={4}
        error={errors.description?.message}
        fullWidth
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Update Lecture' : 'Create Lecture'}
        </Button>
      </div>
    </form>
  );
};

export default LectureForm;
