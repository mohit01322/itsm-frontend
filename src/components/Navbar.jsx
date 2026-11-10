import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { USE_MOCK } from '../api/config'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const links =
    user?.role === 'EMPLOYEE'
      ? [['/employee', 'My incidents'], ['/employee/report', 'Report incident'], ['/notifications', 'Notifications']]
      : user?.role === 'TECHNICIAN'
      ? [['/technician', 'Assigned incidents'], ['/notifications', 'Notifications']]
      : user?.role === 'ADMINISTRATOR'
      ? [['/admin', 'Dashboard'], ['/admin/incidents', 'All incidents'], ['/admin/technicians', 'Technicians'], ['/admin/audit', 'Audit log'], ['/technician', 'Technician view'], ['/notifications', 'Notifications']]
      : []

  return (
    <header className="navbar">
      <strong className="brand">I-ITSM</strong>
      {USE_MOCK && <span className="tag">FAKE DATA</span>}
      <nav>
        {links.map(([to, label]) => (
          <Link key={to} to={to}>{label}</Link>
        ))}
      </nav>
      <span className="spacer" />
      {user ? (
        <>
          <span className="who">{user.username} ({user.role.toLowerCase()})</span>
          <button className="btn small" onClick={() => { logout(); navigate('/login') }}>Log out</button>
        </>
      ) : (
        <Link to="/login">Log in</Link>
      )}
    </header>
  )
}
