import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, homeFor } from '../auth/AuthContext'
import { api, errorMessage } from '../api/client'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [server, setServer] = useState('checking') // checking | waking | up | down

  // Preserve the existing cloud-server wake-up flow.
  useEffect(() => {
    let cancelled = false
    api.wakeUp({ onWaiting: () => !cancelled && setServer('waking'), isCancelled: () => cancelled })
      .then((awake) => !cancelled && setServer(awake ? 'up' : 'down'))
      .catch(() => !cancelled && setServer('down'))
    return () => { cancelled = true }
  }, [])

  if (user) return <Navigate to={homeFor(user.role)} replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await login(username, password)
      navigate(homeFor(u.role))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const demo = [['Employee', 'employee', 'employee123'], ['Technician', 'technician', 'tech123'], ['Admin', 'admin', 'admin123']]

  return (
    <div className="auth">
      <div className="auth-side">
        <div>
          <p className="auth-kicker">INCIDENT MANAGEMENT</p>
          <h2>Report it. Track it. Get it fixed.</h2>
        </div>
        <p>Every incident gets a priority and a deadline, so the urgent ones are never lost in the queue.</p>
        <span className="auth-mark" aria-hidden="true">I-ITSM</span>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <div>
          <p className="auth-kicker">WELCOME BACK</p>
          <h2>Log in</h2>
          <p className="muted">Sign in to continue to your workspace.</p>
        </div>
        <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
        {server === 'waking' && (
          <p className="muted server-message">
            <strong>Waking up the server...</strong> The cloud server may take a minute or two to start. Please wait; the Log in button will be available when it responds.
          </p>
        )}
        {server === 'down' && <p className="bad">Cannot reach the server right now. Try again in a minute.</p>}
        {error && <p className="bad">{error}</p>}
        <button className="btn" disabled={busy || server === 'waking'}>
          {busy ? 'Logging in...' : server === 'waking' ? 'Waiting for the server...' : 'Log in'}
        </button>
        <div>
          <p className="muted demo-label">Try a demo account</p>
          <div className="demo">
            {demo.map(([label, u, p]) => (
              <button type="button" className="chip" key={u} onClick={() => { setUsername(u); setPassword(p) }}>{label}</button>
            ))}
          </div>
        </div>
        <p className="muted register-prompt">New employee? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  )
}
