import './App.css'
import { Route, BrowserRouter as Router, Routes, Navigate } from 'react-router-dom'
import Login from './components/Login'
import RFIDMonitor from './components/RFIDMonitor'
import LecturerRegistration from './components/LecturerRegistration'
import LecturerDashboard from './components/LecturerDashboard'
import StudentDashboard from './components/StudentDashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<RFIDMonitor />} />
        <Route path="/admin/register-lecturer" element={<LecturerRegistration />} />
        <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="*" element={<div className="text-center mt-20 text-3xl font-bold">404 - Page Not Found</div>} />
      </Routes>
    </Router>
  )
}

export default App
