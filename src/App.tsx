import './App.css'
import { Route, BrowserRouter as Router, Routes, Navigate } from 'react-router-dom'
import { AuthProvider } from './context'
import Login from './components/Login'
import RFIDMonitor from './components/RFIDMonitor'
import RFIDRegistration from './components/RFIDRegistration'
import LecturerRegistration from './components/LecturerRegistration'
import LecturerDashboard from './components/LecturerDashboard'
import StudentDashboard from './components/StudentDashboard'
import { ModulesPage, AttendancePage, ModuleDetailPage } from './pages'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-lecturer" element={<LecturerRegistration />} />
          
          {/* Dashboard Routes */}
          <Route path="/lecturer-dashboard" element={<LecturerDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/admin" element={<RFIDMonitor />} />
          
          {/* Module Routes */}
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/modules/:id" element={<ModuleDetailPage />} />
          
          {/* Attendance Routes */}
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/rfid-monitor" element={<RFIDMonitor />} />
          <Route path="/admin/student-registration" element={<RFIDRegistration />} />
          
          <Route path="*" element={<div className="text-center mt-20 text-3xl font-bold">404 - Page Not Found</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
