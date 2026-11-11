import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, errorMessage } from '../../api/client'

const CATEGORIES = ['NETWORK', 'HARDWARE', 'SOFTWARE', 'DATABASE', 'SECURITY', 'OTHER']
const LEVELS = ['HIGH', 'MEDIUM', 'LOW']

// MOHIY: this page is yours. The backend sends field errors as {title: "Title is required"}; we show them under each field.
export default function ReportIncident() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', category: '', impact: '', urgency: '', businessCriticality: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setFieldErrors({})
    try {
      const created = await api.createIncident(form)
      navigate('/incidents/' + created.id)
    } catch (err) {
      if (err.status === 400 && err.data && typeof err.data === 'object') setFieldErrors(err.data)
      else setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const select = (name, label, options) => (
    <label>
      {label}
      <select value={form[name]} onChange={set(name)}>
        <option value="">Choose...</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      {fieldErrors[name] && <span className="bad">{fieldErrors[name]}</span>}
    </label>
  )

  return (
    <form className="card" onSubmit={submit}>
      <h2>Report an incident</h2>
      <label>
        Title
        <input value={form.title} onChange={set('title')} maxLength={200} />
        {fieldErrors.title && <span className="bad">{fieldErrors.title}</span>}
      </label>
      <label>
        Description
        <textarea rows={4} value={form.description} onChange={set('description')} maxLength={500}/>
        <span className="muted">{form.description.length} / 500</span>
        {fieldErrors.description && <span className="bad">{fieldErrors.description}</span>}
      </label>
      {select('category', 'Category', CATEGORIES)}
      {select('impact', 'Impact', LEVELS)}
      {select('urgency', 'Urgency', LEVELS)}
      {select('businessCriticality', 'Business criticality', LEVELS)}
      {error && <p className="bad">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Submitting...' : 'Submit incident'}</button>
    </form>
  )
}
