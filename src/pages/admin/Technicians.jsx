import { useState } from 'react'
import { api } from '../../api/client'
import useLoad from '../../components/useLoad'
import { CATEGORIES, showError } from './shared'

// Admin page: list technicians, add a new one, edit name / skills / available.
// Backend: GET /api/technicians, POST /api/technicians, PUT /api/technicians/{id}
const BLANK = { name: '', skills: [], active: true }
const CHECK = { flexDirection: 'row', alignItems: 'center', gap: 6, fontWeight: 400 }
const OK = { color: '#25612f', fontSize: 13, fontWeight: 600 }

export default function Technicians() {
  const { data, loading, error, reload } = useLoad(() => api.getTechnicians())
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
    setForm({ name: t.name, skills: [...(t.skills || [])], active: t.active !== false })
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
    }

    setBusy(true)
    try {
      if (editing) await api.updateTechnician(editing.id, body)
      else await api.createTechnician(body)
      setMessage({ bad: false, text: editing ? 'Technician updated.' : 'Technician added.' })
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
        <div>
          <b style={{ fontSize: 14 }}>Skills</b> <span className="muted">(same words as incident categories)</span>
          <div className="row" style={{ marginTop: 6 }}>
            {CATEGORIES.map((c) => (
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
              <tr><th>ID</th><th>Name</th><th>Skills</th><th>Active incidents</th><th>Available</th><th></th></tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.name}</td>
                  <td>{(t.skills || []).join(', ')}</td>
                  <td>{t.activeIncidentCount ?? 0}</td>
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
