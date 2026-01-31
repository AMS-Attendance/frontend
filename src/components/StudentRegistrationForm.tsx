import { useState, type FC } from 'react';
import axios from 'axios';
import { X, Loader2, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Alert } from './atoms';

const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000/api';

interface StudentRegistrationFormProps {
  open: boolean;
  onClose: () => void;
  rfid: string;
  onSuccess: (student: any) => void;
}

const StudentRegistrationForm: FC<StudentRegistrationFormProps> = ({
  open,
  onClose,
  rfid,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    indexNumber: '',
    degree: '',
    batch: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.indexNumber) {
      setError('Name, email, password, and index number are required');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.batch && (parseInt(formData.batch) < 20 || parseInt(formData.batch) > 30)) {
      setError('Batch must be between 20 and 30');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/users`,
        {
          name: formData.name,
          email: formData.email.toLowerCase(),
          password: formData.password,
          role: 'student',
          rfid: rfid,
          indexNumber: formData.indexNumber,
          degree: formData.degree || null,
          batch: formData.batch ? parseInt(formData.batch) : null,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        onSuccess(response.data.data);
        resetForm();
        onClose();
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      indexNumber: '',
      degree: '',
      batch: '',
    });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5" />
            Register New Student
          </DialogTitle>
          <DialogDescription>
            Register a new student with RFID: <span className="font-mono font-semibold text-blue-600">{rfid}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <Alert type="error">
              {error}
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="A.L.P.Perera.."
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g., john.doe@example.com"
              disabled={loading}
              required
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Index Number <span className="text-red-500">*</span>
            </label>
            <Input
              name="indexNumber"
              value={formData.indexNumber}
              onChange={handleChange}
              placeholder="e.g., 224187F"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </label>
            <Input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              disabled={loading}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Degree
              </label>
              <Input
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                placeholder="IT,ITM.."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Batch
              </label>
              <Input
                name="batch"
                type="number"
                value={formData.batch}
                onChange={handleChange}
                placeholder="22,21.."
                min="20"
                max="30"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register Student
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentRegistrationForm;
