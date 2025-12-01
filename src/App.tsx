import './App.css'
import { Route, BrowserRouter as Router, Routes, Navigate } from 'react-router-dom'
import Login from './components/Login'
import RFIDMonitor from './components/RFIDMonitor'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<RFIDMonitor />} />
        <Route path="/lecturer/dashboard" element={<RFIDMonitor />} />
        <Route path="/student/dashboard" element={<RFIDMonitor />} />
        <Route path="*" element={<div className="text-center mt-20 text-3xl font-bold">404 - Page Not Found</div>} />
      </Routes>
    </Router>
  )
}

export default App
