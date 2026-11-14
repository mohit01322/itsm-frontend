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

  // On the cloud the free server may be asleep. Wake it up as soon as this page opens.
  useEffect(() => {
    let cancelled = false
    api.wakeUp({ onWaiting: () => !cancelled && setServer('waking'), isCancelled: () => cancelled })
      .then((awake) => !cancelled && setServer(awake ? 'up' : 'down'))
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

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>Log in</h2>
      <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus /></label>
      <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {server === 'waking' && (
        <p className="muted">
          <strong>Waking up the server...</strong> The free cloud server sleeps after 15 minutes with no visitors and
          takes about 2 minutes to start. Please wait; the Log in button turns on by itself.
        </p>
      )}
      {server === 'down' && <p className="bad">Cannot reach the server right now. Try again in a minute.</p>}
      {error && <p className="bad">{error}</p>}
      <button className="btn" disabled={busy || server === 'waking'}>
        {busy ? 'Logging in...' : server === 'waking' ? 'Waiting for the server...' : 'Log in'}
      </button>
      <p className="muted">Demo users: employee / employee123, technician / tech123, admin / admin123</p>
      <p>New employee? <Link to="/register">Register</Link></p>
    </form>
  )
}
