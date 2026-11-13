import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth, homeFor } from '../auth/AuthContext'
import { errorMessage } from '../api/client'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
      {error && <p className="bad">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
      <p className="muted">Demo users: employee / employee123, technician / tech123, admin / admin123</p>
    </form>
  )
}
