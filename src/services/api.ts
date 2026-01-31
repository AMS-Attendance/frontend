import axios, { AxiosError } from 'axios';
import type {
  User,
  Module,
  Lecture,
  Attendance,
  ApiResponse,
  LoginResponse,
  RegisterData,
  ModuleFormData,
  LectureFormData,
  AttendanceFormData,
  AttendanceSummary,
  AttendanceStats,
} from '../types';

const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000/api';

// Configure axios defaults
axios.defaults.withCredentials = true;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    return axiosError.response?.data?.message || axiosError.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};

// ==================== AUTH APIs ====================
export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const res = await api.post<LoginResponse>('/auth/login', data);
    return res.data.user;
  },

  register: async (userData: RegisterData) => {
    const { data } = await api.post<ApiResponse<User>>('/auth/register', userData);
    return data.data;
  },

  logout: async () => {
    const { data } = await api.post('/auth/logout');
    return data;
  },
};

// ==================== USER APIs ====================
export const userApi = {
  getAllUsers: async (params?: {
    role?: string;
    batch?: number;
    degree?: string;
    search?: string;
  }) => {
    const { data } = await api.get<ApiResponse<User[]>>('/users', { params });
    return data;
  },

  getStudents: async (params?: { batch?: number; degree?: string }) => {
    const { data } = await api.get<ApiResponse<User[]>>('/users/students', { params });
    return data;
  },

  getLecturers: async () => {
    const { data } = await api.get<ApiResponse<User[]>>('/users/lecturers');
    return data;
  },

  getUserById: async (id: string) => {
    const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
    return data;
  },

  createUser: async (userData: RegisterData) => {
    const { data } = await api.post<ApiResponse<User>>('/users', userData);
    return data;
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    const { data } = await api.put<ApiResponse<User>>(`/users/${id}`, userData);
    return data;
  },

  deleteUser: async (id: string) => {
    const { data } = await api.delete<ApiResponse<void>>(`/users/${id}`);
    return data;
  },
};

// ==================== MODULE APIs ====================
export const moduleApi = {
  getAllModules: async (params?: {
    lecturerId?: string;
    semester?: number;
    isActive?: boolean;
    search?: string;
  }) => {
    const { data } = await api.get<ApiResponse<Module[]>>('/modules', { params });
    return data;
  },

  getMyModules: async () => {
    const { data } = await api.get<ApiResponse<Module[]>>('/modules/my-modules');
    return data;
  },

  getModuleById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Module>>(`/modules/${id}`);
    return data;
  },

  createModule: async (moduleData: ModuleFormData) => {
    const { data } = await api.post<ApiResponse<Module>>('/modules', moduleData);
    return data;
  },

  updateModule: async (id: string, moduleData: Partial<ModuleFormData>) => {
    const { data } = await api.put<ApiResponse<Module>>(`/modules/${id}`, moduleData);
    return data;
  },

  deleteModule: async (id: string) => {
    const { data } = await api.delete<ApiResponse<void>>(`/modules/${id}`);
    return data;
  },

  addStudents: async (module_id: string, studentIds: string[]) => {
    const { data } = await api.post<ApiResponse<Module>>(`/modules/${module_id}/students`, {
      studentIds,
    });
    return data;
  },

  removeStudent: async (module_id: string, student_id: string) => {
    const { data } = await api.delete<ApiResponse<void>>(
      `/modules/${module_id}/students/${student_id}`
    );
    return data;
  },
};

// ==================== LECTURE APIs ====================
export const lectureApi = {
  getAllLectures: async (params?: {
    moduleId?: string;
    startDate?: string;
    endDate?: string;
    isCompleted?: boolean;
    isCancelled?: boolean;
  }) => {
    const { data } = await api.get<ApiResponse<Lecture[]>>('/lectures', { params });
    return data;
  },

  getUpcomingLectures: async () => {
    const { data } = await api.get<ApiResponse<Lecture[]>>('/lectures/upcoming');
    return data;
  },

  getTodayLectures: async () => {
    const { data } = await api.get<ApiResponse<Lecture[]>>('/lectures/today');
    return data;
  },

  getLectureById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Lecture>>(`/lectures/${id}`);
    return data;
  },

  createLecture: async (lectureData: LectureFormData) => {
    const { data } = await api.post<ApiResponse<Lecture>>('/lectures', lectureData);
    return data;
  },

  updateLecture: async (id: string, lectureData: Partial<LectureFormData>) => {
    const { data } = await api.put<ApiResponse<Lecture>>(`/lectures/${id}`, lectureData);
    return data;
  },

  deleteLecture: async (id: string) => {
    const { data } = await api.delete<ApiResponse<void>>(`/lectures/${id}`);
    return data;
  },
};

// ==================== ATTENDANCE APIs ====================
export const attendanceApi = {
  getAllAttendance: async (params?: {
    lectureId?: string;
    studentId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const { data } = await api.get<ApiResponse<Attendance[]>>('/attendance', { params });
    return data;
  },

  getLectureAttendance: async (lecture_id: string) => {
    const { data } = await api.get<
      ApiResponse<{
        lecture: Lecture;
        summary: AttendanceSummary[];
        stats: AttendanceStats;
      }>
    >(`/attendance/lecture/${lecture_id}`);
    return data;
  },

  getStudentAttendance: async (student_id: string) => {
    const { data } = await api.get<ApiResponse<Attendance[]> & { stats: AttendanceStats }>(
      `/attendance/student/${student_id}`
    );
    return data;
  },

  markAttendance: async (attendanceData: AttendanceFormData) => {
    const { data } = await api.post<ApiResponse<Attendance | Attendance[]>>(
      '/attendance',
      attendanceData
    );
    return data;
  },

  markAttendanceByRFID: async (lecture_id: string, rfid: string) => {
    const { data } = await api.post<ApiResponse<Attendance>>('/attendance/rfid', {
      lecture_id,
      rfid,
    });
    return data;
  },

  updateAttendance: async (id: string, updates: { status?: string; remarks?: string }) => {
    const { data } = await api.put<ApiResponse<Attendance>>(`/attendance/${id}`, updates);
    return data;
  },

  deleteAttendance: async (id: string) => {
    const { data } = await api.delete<ApiResponse<void>>(`/attendance/${id}`);
    return data;
  },
};

export default api;
