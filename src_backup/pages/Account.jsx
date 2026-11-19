import { useEffect, useState } from 'react'
import { api, errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import useLoad from '../components/useLoad'
import ChangePassword from './ChangePassword'

// "My account" page for every logged-in user: the email address for notification emails, and the password.
// Backend: GET /api/me (shows the saved email), PUT /api/me/email with {email} (empty removes it)
const OK = { color: '#25612f', fontSize: 13, fontWeight: 600 }

const WHAT_YOU_GET = {
  EMPLOYEE: 'You get an email when you report an incident, when it is assigned, when its status changes, and if it misses its SLA deadline.',
  TECHNICIAN: 'You get an email when an incident is assigned to you, when its status changes, and if it misses its SLA deadline.',
  ADMINISTRATOR: 'As an admin you get an email about every incident: when it is created, assigned or updated, and if it misses its SLA deadline.',
}

function EmailSettings() {
  const { user } = useAuth()
  const { data, error } = useLoad(() => api.getMe(), [])
  const [email, setEmail] = useState(null) // null until the saved address has loaded
  const [message, setMessage] = useState(null) // { text, bad }
  const [busy, setBusy] = useState(false)

  // Fill the box once, when the saved address first arrives (never over what the user is typing)
  useEffect(() => {
    if (data) setEmail((current) => (current === null ? data.email || '' : current))
  }, [data])

  async function save(e) {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      const saved = await api.updateEmail(email.trim())
      setEmail(saved.email || '')
      setMessage({
        bad: false,
        text: saved.email ? 'Saved. Notification emails will go to ' + saved.email + '.' : 'Email removed. You will not get notification emails.',
      })
    } catch (err) {
      setMessage({ bad: true, text: err?.data?.error || errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card narrow" onSubmit={save}>
      <h2>Email notifications</h2>
      <p className="muted">{WHAT_YOU_GET[user.role]} Leave the box empty to get no emails.</p>
      <label>
        Email address
        <input type="email" value={email ?? ''} onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com" autoComplete="email" disabled={email === null} />
      </label>
      {error && <p className="bad">{error}</p>}
      {message && <p className={message.bad ? 'bad' : ''} style={message.bad ? null : OK}>{message.text}</p>}
      <button className="btn" disabled={busy || email === null}>{busy ? 'Saving...' : 'Save email'}</button>
    </form>
  )
}

export default function Account() {
  return (
    <>
      <EmailSettings />
      <ChangePassword />
    </>
  )
}
