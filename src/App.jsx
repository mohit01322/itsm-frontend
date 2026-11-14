import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, homeFor } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import Navbar from './components/Navbar'

import Login from './pages/Login'
import Register from './pages/employee/Register'
import MyIncidents from './pages/employee/MyIncidents'
import ReportIncident from './pages/employee/ReportIncident'
import IncidentDetail from './pages/employee/IncidentDetail'
import Notifications from './pages/employee/Notifications'
import AssignedIncidents from './pages/technician/AssignedIncidents'
import Dashboard from './pages/admin/Dashboard'
import AllIncidents from './pages/admin/AllIncidents'
import Technicians from './pages/admin/Technicians'
import AuditLog from './pages/admin/AuditLog'

const ALL = ['EMPLOYEE', 'TECHNICIAN', 'ADMINISTRATOR']

export default function App() {
  const { user } = useAuth()
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Navigate to={user ? homeFor(user.role) : '/login'} replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Employee area (Mohiy) */}
          <Route path="/employee" element={<ProtectedRoute roles={['EMPLOYEE']}><MyIncidents /></ProtectedRoute>} />
          <Route path="/employee/report" element={<ProtectedRoute roles={['EMPLOYEE']}><ReportIncident /></ProtectedRoute>} />
          <Route path="/incidents/:id" element={<ProtectedRoute roles={ALL}><IncidentDetail /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute roles={ALL}><Notifications /></ProtectedRoute>} />

          {/* Technician area (partner) */}
          <Route path="/technician" element={<ProtectedRoute roles={['TECHNICIAN', 'ADMINISTRATOR']}><AssignedIncidents /></ProtectedRoute>} />

          {/* Admin area (partner) */}
          <Route path="/admin" element={<ProtectedRoute roles={['ADMINISTRATOR']}><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/incidents" element={<ProtectedRoute roles={['ADMINISTRATOR']}><AllIncidents /></ProtectedRoute>} />
          <Route path="/admin/technicians" element={<ProtectedRoute roles={['ADMINISTRATOR']}><Technicians /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute roles={['ADMINISTRATOR']}><AuditLog /></ProtectedRoute>} />

          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}
