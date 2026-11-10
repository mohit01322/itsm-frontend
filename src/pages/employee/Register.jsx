import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../../api/client'

// MOHIY: this page is yours. Needs POST /api/auth/register on the backend (requested).
export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      await api.register({ username, password })
      setDone(true)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (done) return <div className="card narrow"><h2>Account created</h2><p><Link to="/login">Go to log in</Link></p></div>

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>Register (employee)</h2>
      <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
      <label>Password (min 6 characters)<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {error && <p className="bad">{error}</p>}
      <button className="btn">Create account</button>
    </form>
  )
}
