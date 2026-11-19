import { useState } from 'react'
import { api, errorMessage } from '../api/client'

// Any logged-in user (employee, technician, admin) can change their own password.
// Backend: PUT /api/me/password with {currentPassword, newPassword}
const EMPTY = { current: '', next: '', confirm: '' }
const OK = { color: '#25612f', fontSize: 13, fontWeight: 600 }

export default function ChangePassword() {
  const [form, setForm] = useState(EMPTY)
  const [message, setMessage] = useState(null) // { text, bad }
  const [busy, setBusy] = useState(false)

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setMessage(null)
    if (!form.current || !form.next || !form.confirm) return setMessage({ bad: true, text: 'Fill in all three fields.' })
    if (form.next.length < 6) return setMessage({ bad: true, text: 'New password must be at least 6 characters.' })
    if (form.next !== form.confirm) return setMessage({ bad: true, text: 'The two new passwords do not match.' })
    if (form.next === form.current) return setMessage({ bad: true, text: 'New password must be different from the current one.' })

    setBusy(true)
    try {
      await api.changePassword(form.current, form.next)
      setForm(EMPTY)
      setMessage({ bad: false, text: 'Password changed. Use the new password next time you log in.' })
    } catch (err) {
      setMessage({ bad: true, text: err?.data?.error || errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>Change password</h2>
      <label>Current password<input type="password" value={form.current} onChange={set('current')} autoComplete="current-password" /></label>
      <label>New password (at least 6 characters)<input type="password" value={form.next} onChange={set('next')} autoComplete="new-password" /></label>
      <label>Confirm new password<input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></label>
      {message && <p className={message.bad ? 'bad' : ''} style={message.bad ? null : OK}>{message.text}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Change password'}</button>
    </form>
  )
}
