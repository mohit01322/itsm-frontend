import { useParams, useNavigate, Link } from 'react-router-dom'
import { api, errorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import useLoad from '../../components/useLoad'
import { StatusBadge, PriorityBadge } from '../../components/Badges'
import { useState } from 'react'

const nextStatus = { OPEN: 'IN_PROGRESS', IN_PROGRESS: 'RESOLVED', RESOLVED: 'CLOSED', CLOSED: 'OPEN' }
const noteTypesFor = role => role === 'EMPLOYEE' ? ['ADDITIONAL_INFO', 'RESPONSE'] : ['INVESTIGATION', 'SUPPORT_REQUEST', 'RESPONSE']

export default function IncidentDetail() {
  const { id } = useParams(); const { user } = useAuth(); const navigate = useNavigate()
  const { data, loading, error, reload } = useLoad(async () => {
    // Suggested fixes are only for technicians and admins; if they cannot be loaded the page still works without them
    const suggestionsFor = user.role === 'EMPLOYEE' ? Promise.resolve([]) : api.getSuggestions(id).catch(() => [])
    const [list, sla, notes, feedback, services, categories, suggestions] = await Promise.all([
      api.searchIncidents({ incidentId: id }), api.getSla(id), api.getIncidentNotes(id), api.getFeedback(id), api.getServices(), api.getCategories(), suggestionsFor
    ])
    return { incident: list[0], sla, notes, feedback, services, categories, suggestions }
  }, [id])
  const [actionError, setActionError] = useState(''); const [notesText, setNotesText] = useState('')
  const [noteType, setNoteType] = useState(noteTypesFor(user.role)[0]); const [noteMessage, setNoteMessage] = useState('')
  const [rating, setRating] = useState(5); const [feedbackComment, setFeedbackComment] = useState(''); const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false); const [edit, setEdit] = useState(null)

  if (loading) return <p>Loading...</p>
  if (error) return <p className="bad">{error}</p>
  const { incident: i, sla } = data
  if (!i) return <p>Incident not found.</p>

  const isDone = i.status === 'RESOLVED' || i.status === 'CLOSED'
  const isEmployeeOwner = user.role === 'EMPLOYEE' && i.reportedBy?.username === user.username
  const canChange = user.role === 'ADMINISTRATOR' || (user.role === 'TECHNICIAN' && user.technicianId != null && i.assignedTechnician?.id === user.technicianId)
  const isAssignedTechnician = user.role === 'TECHNICIAN' && user.technicianId != null && i.assignedTechnician?.id === user.technicianId
  const canEdit = user.role === 'ADMINISTRATOR' || isEmployeeOwner || (user.role === 'TECHNICIAN' && user.technicianId != null && i.assignedTechnician?.id === user.technicianId)

  async function setStatus(status) {
    setActionError(''); setBusy(true)
    try { await api.updateStatus(id, status, status === 'RESOLVED' ? notesText.trim() : undefined); setNotesText(''); reload() }
    catch (e) { setActionError(errorMessage(e)) } finally { setBusy(false) }
  }

  async function acknowledge() {
    setActionError(''); setBusy(true)
    try { await api.acknowledgeIncident(id); reload() }
    catch (e) { setActionError(errorMessage(e)) } finally { setBusy(false) }
  }

  async function addNote(e) {
    e.preventDefault(); if (!noteMessage.trim()) return setActionError('Write a message first.')
    setBusy(true); setActionError('')
    try { await api.addIncidentNote(id, { type: noteType, message: noteMessage.trim() }); setNoteMessage(''); reload() }
    catch (e) { setActionError(errorMessage(e)) } finally { setBusy(false) }
  }

  async function submitFeedback(e) {
    e.preventDefault(); setBusy(true); setActionError('')
    try { await api.submitFeedback(id, { rating: Number(rating), comment: feedbackComment.trim() }); reload() }
    catch (e) { setActionError(errorMessage(e)) } finally { setBusy(false) }
  }

  function startEdit() {
    setEdit({ title: i.title, description: i.description, category: i.category, impact: i.impact, urgency: i.urgency, businessCriticality: i.businessCriticality, affectedServiceId: i.affectedService?.id || '', affectedUsers: i.affectedUsers ?? 1 }); setEditing(true); setActionError('')
  }

  async function saveEdit(e) {
    e.preventDefault(); setBusy(true); setActionError('')
    try { await api.updateIncident(id, { ...edit, affectedServiceId: edit.affectedServiceId ? Number(edit.affectedServiceId) : null, affectedUsers: edit.affectedUsers === '' ? null : Number(edit.affectedUsers) }); setEditing(false); reload() }
    catch (e) { setActionError(errorMessage(e)) } finally { setBusy(false) }
  }

  return (
    <div className="card">
      <p><button className="btn small" onClick={() => navigate(-1)}>Back</button></p>
      <h2>#{i.id} {i.title}</h2>
      <p><PriorityBadge priority={i.priority} /> <StatusBadge status={i.status} /> {i.slaRiskLevel === 'HIGH' && <span className="badge">SLA RISK: HIGH</span>}</p>
      {i.potentialDuplicate && <div className="workflow-note">Potential duplicate detected. This incident may be related to #{i.duplicateOfIncidentId}.</div>}
      <dl>
        <dt>Description</dt><dd style={{whiteSpace:'pre-wrap'}}>{i.description}</dd>
        <dt>Category</dt><dd>{i.category}</dd>
        <dt>Affected IT service</dt><dd>{i.affectedService?.name || 'Not specified'}</dd>
        <dt>Impact / Urgency / Criticality</dt><dd>{i.impact} / {i.urgency} / {i.businessCriticality}</dd>
        <dt>People affected</dt><dd>{i.affectedUsers ?? 'Not recorded'}</dd>
        <dt>Assigned technician</dt><dd>{i.assignedTechnician?.name || 'Not assigned yet'}</dd>
        <dt>Created</dt><dd>{new Date(i.createdAt).toLocaleString()}</dd>
        <dt>Response SLA</dt><dd>{i.responseDeadline ? new Date(i.responseDeadline).toLocaleString() : 'Not configured'} {i.responseSlaViolated ? <span className="bad">(violated)</span> : ''}</dd>
        <dt>Resolution SLA</dt><dd className={sla.slaViolated ? 'bad' : ''}>{sla.slaDeadline ? new Date(sla.slaDeadline).toLocaleString() : 'Not configured'} {sla.slaViolated ? '(violated)' : '(within SLA)'}</dd>
        {i.appliedSla && <><dt>SLA used</dt><dd>{i.appliedSla}</dd></>}
        {i.acknowledgedAt && <><dt>Acknowledged by technician</dt><dd>{new Date(i.acknowledgedAt).toLocaleString()}</dd></>}
        {i.firstResponseAt && <><dt>First response</dt><dd>{new Date(i.firstResponseAt).toLocaleString()}</dd></>}
        {i.resolvedAt && <><dt>Resolved</dt><dd>{new Date(i.resolvedAt).toLocaleString()}</dd></>}
        {i.closedAt && <><dt>Closed</dt><dd>{new Date(i.closedAt).toLocaleString()}</dd></>}
        {i.resolutionNotes && <><dt>Resolution notes</dt><dd style={{whiteSpace:'pre-wrap'}}>{i.resolutionNotes}</dd></>}
      </dl>

      {canEdit && !isDone && !editing && <button className="btn small" onClick={startEdit}>Edit incident</button>}
      {editing && (
        <form className="card" onSubmit={saveEdit} style={{marginTop:12}}>
          <h3>Edit incident</h3>
          <label>Title<input maxLength={200} value={edit.title} onChange={e=>setEdit({...edit,title:e.target.value})}/></label>
          <label>Description<textarea maxLength={2000} rows={4} value={edit.description} onChange={e=>setEdit({...edit,description:e.target.value})}/></label>
          <label>Category<select value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})}>{data.categories.filter(c=>c.active!==false).map(c=><option key={c.id}>{c.name}</option>)}</select></label>
          <label>Affected IT service<select value={edit.affectedServiceId} onChange={e=>setEdit({...edit,affectedServiceId:e.target.value})}><option value="">None</option>{data.services.filter(s=>s.active!==false).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          {['impact','urgency','businessCriticality'].map(k=><label key={k}>{k.replace(/([A-Z])/g,' $1')}<select value={edit[k]} onChange={e=>setEdit({...edit,[k]:e.target.value})}>{['HIGH','MEDIUM','LOW'].map(x=><option key={x}>{x}</option>)}</select></label>)}
          <label>Number of people affected<input type="number" min="1" max="100000" step="1" value={edit.affectedUsers} onChange={e=>setEdit({...edit,affectedUsers:e.target.value})}/><span className="muted">10 or more people raises the priority one level; 100 or more, two levels.</span></label>
          <div className="row"><button className="btn" disabled={busy}>Save changes</button><button type="button" className="btn small" onClick={()=>setEditing(false)}>Cancel</button></div>
        </form>
      )}

      {canChange && i.status === 'IN_PROGRESS' && <label style={{marginTop:12}}>Resolution notes (required to resolve)<textarea rows={3} maxLength={2000} value={notesText} onChange={e=>setNotesText(e.target.value)} /></label>}
      {/* One button for the next allowed step. Only the assigned technician starts work (the backend refuses IN_PROGRESS from an admin). */}
      {canChange && (user.role === 'ADMINISTRATOR' && i.status === 'OPEN'
        ? <p className="muted" style={{marginTop:8}}>Waiting for the assigned technician to start work.</p>
        : <div className="row" style={{marginTop:8}}>
            {isAssignedTechnician && i.status === 'OPEN' && !i.acknowledgedAt && <button className="btn small" disabled={busy} onClick={acknowledge}>Acknowledge</button>}
            <button className="btn small" disabled={busy} onClick={()=>setStatus(nextStatus[i.status])}>
              {i.status === 'RESOLVED' ? 'Close incident' : i.status === 'CLOSED' ? 'Reopen incident' : 'Set '+nextStatus[i.status].replace('_',' ')}
            </button>
            {i.status === 'RESOLVED' && <button className="btn small" disabled={busy} onClick={()=>setStatus('OPEN')}>Reopen incident</button>}
          </div>)}

      {user.role !== 'EMPLOYEE' && !isDone && (
        <section className="card" style={{marginTop:24}}>
          <h3>Suggested fixes from similar incidents</h3>
          <p className="muted">How earlier incidents with a similar title and description were resolved.</p>
          {data.suggestions.length === 0 && <p className="muted">No similar resolved incidents yet.</p>}
          {data.suggestions.map(s => (
            <div key={s.incidentId} className="suggestion">
              <Link to={'/incidents/' + s.incidentId}><strong>#{s.incidentId} {s.title}</strong></Link> <span className="match">{s.matchPercent}% match</span> <span className="muted">{s.category}</span>
              <p>{s.resolutionNotes}</p>
              {canChange && i.status === 'IN_PROGRESS' && <button className="btn small" style={{marginTop:8}} onClick={()=>setNotesText(s.resolutionNotes)}>Use as resolution notes</button>}
            </div>
          ))}
        </section>
      )}

      <section style={{marginTop:24}}>
        <h3>Incident timeline</h3>
        {(data.notes || []).length === 0 && <p className="muted">No additional notes yet.</p>}
        {(data.notes || []).map(n=><div key={n.id} className="card" style={{marginBottom:8}}><strong>{n.type.replace('_',' ')}</strong><span className="muted"> · {n.author?.username || 'User'} · {new Date(n.createdAt).toLocaleString()}</span><p style={{whiteSpace:'pre-wrap'}}>{n.message}</p></div>)}
        {!isDone && <form onSubmit={addNote}><label>Add information / investigation note<select value={noteType} onChange={e=>setNoteType(e.target.value)}>{noteTypesFor(user.role).map(t=><option key={t}>{t}</option>)}</select><textarea rows={3} maxLength={3000} value={noteMessage} onChange={e=>setNoteMessage(e.target.value)} /></label><button className="btn small" disabled={busy}>Add note</button></form>}
      </section>

      {user.role === 'EMPLOYEE' && isDone && !data.feedback && <form className="card" onSubmit={submitFeedback} style={{marginTop:16}}><h3>Support feedback</h3><label>Rating<select value={rating} onChange={e=>setRating(e.target.value)}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label><label>Comment<textarea rows={3} maxLength={2000} value={feedbackComment} onChange={e=>setFeedbackComment(e.target.value)} /></label><button className="btn" disabled={busy}>Submit feedback</button></form>}
      {data.feedback && <div className="card" style={{marginTop:16}}><h3>Feedback</h3><p><strong>{data.feedback.rating}/5</strong></p><p>{data.feedback.comment || 'No comment.'}</p></div>}
      {actionError && <p className="bad">{actionError}</p>}
    </div>
  )
}
