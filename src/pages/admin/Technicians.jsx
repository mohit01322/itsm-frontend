import { useState } from 'react'
import { api } from '../../api/client'
import useLoad from '../../components/useLoad'
import { CATEGORIES, showError, isFull, workloadText, loadWorkloadLimit } from './shared'

// Admin page: list technicians, add a new one, edit name / skills / available.
// Backend: GET /api/technicians, POST /api/technicians, PUT /api/technicians/{id}
const BLANK = { name: '', skills: [], active: true, username: '', password: '' }
const CHECK = { flexDirection: 'row', alignItems: 'center', gap: 6, fontWeight: 400 }
const OK = { color: '#25612f', fontSize: 13, fontWeight: 600 }

export default function Technicians() {
  const { data, loading, error, reload } = useLoad(() => api.getTechnicians())
  // Skills use the category names the admin manages on the Settings page (falls back to the default list)
  const cats = useLoad(() => api.getCategories())
  const limit = useLoad(() => loadWorkloadLimit(api)).data ?? null
  const skillNames = cats.data ? cats.data.filter((c) => c.active !== false).map((c) => c.name) : CATEGORIES
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null) // the technician being edited, or null when adding a new one
  const [message, setMessage] = useState(null) // { text, bad }
  const [busy, setBusy] = useState(false)

  function toggleSkill(skill) {
    const has = form.skills.includes(skill)
    setForm({ ...form, skills: has ? form.skills.filter((s) => s !== skill) : [...form.skills, skill] })
  }

  function startEdit(t) {
    setEditing(t)
    setForm({ name: t.name, skills: [...(t.skills || [])], active: t.active !== false, username: t.username || '', password: '' })
    setMessage(null)
    window.scrollTo(0, 0)
  }

  function cancel() {
    setEditing(null)
    setForm(BLANK)
  }

  async function save(e) {
    e.preventDefault()
    setMessage(null)
    if (!form.name.trim()) return setMessage({ bad: true, text: 'Name is required.' })
    if (!form.skills.length) return setMessage({ bad: true, text: 'Pick at least one skill.' })

    const body = {
      name: form.name.trim(),
      skills: form.skills,
      active: form.active,
      // Keep the current workload. If we leave this out, the backend resets it to 0.
      activeIncidentCount: editing ? editing.activeIncidentCount : 0,
      // The login this technician signs in with. A password is only sent to create a new login or reset it.
      username: form.username.trim(),
      ...(form.password ? { password: form.password } : {}),
    }

    setBusy(true)
    try {
      if (editing) await api.updateTechnician(editing.id, body)
      else await api.createTechnician(body)
      const login = body.username
      setMessage({ bad: false, text: (editing ? 'Technician updated.' : 'Technician added.') + (login ? ' They sign in as "' + login + '".' : '') })
      cancel()
      reload()
    } catch (err) {
      setMessage({ bad: true, text: showError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h2>Technicians</h2>

      <form className="card" onSubmit={save} style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>{editing ? 'Edit technician #' + editing.id : 'Add a technician'}</h3>
        <label>
          Name
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ravi Kumar" />
        </label>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <label style={{ flex: '1 1 240px' }}>
            Login username <span className="muted">(the login this technician signs in with)</span>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. technician" autoComplete="off" />
          </label>
          <label style={{ flex: '1 1 240px' }}>
            Password <span className="muted">(only to create a new login, or reset it)</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
          </label>
        </div>
        <div>
          <b style={{ fontSize: 14 }}>Skills</b> <span className="muted">(same words as incident categories)</span>
          <div className="row" style={{ marginTop: 6 }}>
            {skillNames.map((c) => (
              <label key={c} style={CHECK}>
                <input type="checkbox" checked={form.skills.includes(c)} onChange={() => toggleSkill(c)} /> {c}
              </label>
            ))}
          </div>
        </div>
        <label style={CHECK}>
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Available for new incidents
        </label>
        {message && <p className={message.bad ? 'bad' : ''} style={message.bad ? null : OK}>{message.text}</p>}
        <div className="row">
          <button className="btn" disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Add technician'}</button>
          {editing && <button type="button" className="btn small" onClick={cancel}>Cancel</button>}
        </div>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="bad">{error}</p>}
      {data && !data.length && <p className="muted">No technicians yet. Add the first one above.</p>}
      {data && data.length > 0 && (
        <div className="tablewrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Login</th><th>Skills</th><th>Active incidents{limit != null ? ' (limit ' + limit + ')' : ''}</th><th>Available</th><th></th></tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.name}</td>
                  <td>{t.username || <span className="muted">not linked</span>}</td>
                  <td>{(t.skills || []).join(', ')}</td>
                  <td className={isFull(t, limit) ? 'bad' : ''}>{workloadText(t, limit)}</td>
                  <td>{t.active === false ? <span className="muted">No</span> : 'Yes'}</td>
                  <td><button className="btn small" onClick={() => startEdit(t)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
