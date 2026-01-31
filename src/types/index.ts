// Type definitions for the Attendance Management System
// Note: All field names use snake_case to match Supabase schema

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'lecturer' | 'admin';
  rfid?: string | null;
  index_number?: string | null;
  degree?: string | null;
  batch?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  lecturer_id: string;
  lecturer?: User;
  students?: User[];
  student_count?: number;
  credits?: number | null;
  semester?: number | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lecture {
  id: string;
  module_id: string;
  module?: Module;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  location?: string | null;
  description?: string | null;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  lecture_id: string;
  lecture?: Lecture;
  student_id: string;
  student?: User;
  marked_at: string;
  status: 'present' | 'absent' | 'late';
  marked_by_rfid: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  student: User;
  attendance: Attendance | null;
  status: 'present' | 'absent' | 'late';
}

export interface AttendanceStats {
  student_id: string;
  total_lectures: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attendance_percentage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  stats?: AttendanceStats;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'lecturer' | 'admin';
  rfid?: string;
  indexNumber?: string;
  degree?: string;
  batch?: number;
}

export interface ModuleFormData {
  code: string;
  name: string;
  lecturer_id: string;
  credits?: number;
  semester?: number;
  description?: string;
}

export interface LectureFormData {
  title: string;
  module_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  location?: string;
  description?: string;
}

export interface AttendanceFormData {
  lecture_id: string;
  student_id?: string;
  student_ids?: string[];
  status?: 'present' | 'absent' | 'late';
  marked_by_rfid?: boolean;
}
