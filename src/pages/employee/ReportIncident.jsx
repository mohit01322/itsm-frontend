import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, errorMessage } from '../../api/client'

const LEVELS = ['HIGH', 'MEDIUM', 'LOW']

export default function ReportIncident() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', category: '', impact: '', urgency: '', businessCriticality: '', affectedServiceId: '', affectedUsers: '1' })
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([api.getCategories(), api.getServices()]).then(([cs, ss]) => {
      setCategories((cs || []).filter(c => c.active !== false))
      setServices((ss || []).filter(s => s.active !== false))
    }).catch(e => setError(errorMessage(e)))
  }, [])

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value })

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setFieldErrors({})
    try {
      // The backend reads the affected service as an object: { affectedService: { id: 2 } }
      const { affectedServiceId, affectedUsers, ...rest } = form
      const body = { ...rest, affectedService: affectedServiceId ? { id: Number(affectedServiceId) } : null,
        affectedUsers: affectedUsers === '' ? null : Number(affectedUsers) }
      const created = await api.createIncident(body)
      navigate('/incidents/' + created.id)
    } catch (err) {
      if (err.status === 400 && err.data && typeof err.data === 'object') setFieldErrors(err.data)
      else setError(errorMessage(err))
    } finally { setBusy(false) }
  }

  // valueOf decides what is saved: the category NAME (skill matching uses it), the service ID, or the plain word for levels
  const select = (name, label, options, valueOf = (o) => o.name || o) => (
    <label>{label}
      <select value={form[name]} onChange={set(name)}>
        <option value="">Choose...</option>
        {options.map(o => <option key={o.id || o} value={valueOf(o)}>{o.name || o}</option>)}
      </select>
      {fieldErrors[name] && <span className="bad">{fieldErrors[name]}</span>}
    </label>
  )

  return (
    <form className="card" onSubmit={submit}>
      <h2>Report an incident</h2>
      <label>Title<input value={form.title} onChange={set('title')} maxLength={200} />{fieldErrors.title && <span className="bad">{fieldErrors.title}</span>}</label>
      <label>Description<textarea rows={4} value={form.description} onChange={set('description')} maxLength={2000}/><span className="muted">{form.description.length} / 2000</span>{fieldErrors.description && <span className="bad">{fieldErrors.description}</span>}</label>
      {select('category', 'Category', categories)}
      {select('affectedServiceId', 'Affected IT service', services, (s) => s.id)}
      {select('impact', 'Impact', LEVELS)}
      {select('urgency', 'Urgency', LEVELS)}
      {select('businessCriticality', 'Business criticality', LEVELS)}
      <label>Number of people affected
        <input type="number" min="1" max="100000" step="1" value={form.affectedUsers} onChange={set('affectedUsers')} />
        <span className="muted">Include yourself. 10 or more people raises the priority one level; 100 or more raises it two levels.</span>
        {fieldErrors.affectedUsers && <span className="bad">{fieldErrors.affectedUsers}</span>}
      </label>
      {error && <p className="bad">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Submitting...' : 'Submit incident'}</button>
    </form>
  )
}
