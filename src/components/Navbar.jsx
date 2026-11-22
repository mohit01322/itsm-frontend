import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { USE_MOCK } from '../api/config'

// The reference supplies the visual navigation pattern; these glyphs avoid adding
// a new runtime dependency just for icons.
const LINKS = {
  EMPLOYEE: [
    ['/employee', 'My incidents', 'Mine', '▣'],
    ['/employee/report', 'Report incident', 'Report', '+'],
    ['/notifications', 'Notifications', 'Alerts', '♢'],
  ],
  TECHNICIAN: [
    ['/technician', 'Assigned incidents', 'Mine', '⚒'],
    ['/notifications', 'Notifications', 'Alerts', '♢'],
  ],
  ADMINISTRATOR: [
    ['/admin', 'Dashboard', 'Home', '▦'],
    ['/admin/incidents', 'All incidents', 'Incidents', '☷'],
    ['/admin/technicians', 'Technicians', 'Team', '♙'],
    ['/admin/delegations', 'Delegations', 'Approve', '⇄'],
    ['/admin/audit', 'Audit log', 'Audit', '≡'],
    ['/admin/settings', 'Settings', 'Settings', '⚙'],
    ['/technician', 'Technician view', 'Tech', '⚒'],
    ['/notifications', 'Notifications', 'Alerts', '♢'],
  ],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = user ? LINKS[user.role] || [] : []

  return (
    <header className={'navbar ' + (user ? 'side' : 'guest')}>
      <Link to="/" className="brand" aria-label="I-ITSM Home" />
      {USE_MOCK && <span className="tag">FAKE DATA</span>}

      {user && (
        <nav aria-label="Main">
          {links.map(([to, long, short, glyph]) => (
            <NavLink key={to} to={to} end className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon" aria-hidden="true">{glyph}</span>
              <span className="long">{long}</span>
              <span className="short">{short}</span>
            </NavLink>
          ))}
        </nav>
      )}

      <span className="spacer" />

      {user ? (
        <div className="userbox">
          <span className="who">{user.username}<small>{user.role.toLowerCase()}</small></span>
          <Link to="/account" className="account-link">My account</Link>
          <button className="btn small" onClick={() => { logout(); navigate('/login') }}>
            <span aria-hidden="true">↪</span> Log out
          </button>
        </div>
      ) : (
        <Link to="/login">Log in</Link>
      )}
    </header>
  )
}
