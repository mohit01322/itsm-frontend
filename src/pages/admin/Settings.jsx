import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'

// onSaved reloads the page's data after an add or a change, so the table shows it straight away
function ListEditor({ title, items, nameKey='name', onAdd, onUpdate, onSaved }) {
  const [name,setName]=useState(''); const [desc,setDesc]=useState(''); const [message,setMessage]=useState('')
  async function add(e){e.preventDefault();setMessage('');try{await onAdd({name,description:desc});setName('');setDesc('');onSaved()}catch(err){setMessage(err?.data?.error||errorMessage(err))}}
  async function toggle(x){setMessage('');try{await onUpdate(x.id,{...x,active:!x.active});onSaved()}catch(err){setMessage(err?.data?.error||errorMessage(err))}}
  return <section className="card"><h3>{title}</h3><form onSubmit={add}><label>Name<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>Description<input value={desc} onChange={e=>setDesc(e.target.value)}/></label><button className="btn small">Add</button></form>{message&&<p className="bad">{message}</p>}<div className="tablewrap" style={{marginTop:12}}><table><thead><tr><th>Name</th><th>Description</th><th>Active</th><th></th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x[nameKey]}</td><td>{x.description||''}</td><td>{x.active?'Yes':'No'}</td><td><button className="btn small" onClick={()=>toggle(x)}>{x.active?'Deactivate':'Activate'}</button></td></tr>)}</tbody></table></div></section>
}

// How new incidents are assigned. The choice is saved in the database and used for every new incident.
function AssignmentStrategyCard(){
 const [data,setData]=useState(null); const [choice,setChoice]=useState(''); const [message,setMessage]=useState(null)
 useEffect(()=>{api.getAssignmentStrategy().then(d=>{setData(d);setChoice(d.strategy)}).catch(e=>setMessage({bad:true,text:errorMessage(e)}))},[])
 async function save(e){e.preventDefault();setMessage(null);try{const d=await api.updateAssignmentStrategy(choice);setData(d);setChoice(d.strategy);setMessage({bad:false,text:'Saved. New incidents will now be assigned this way.'})}catch(err){setMessage({bad:true,text:err?.data?.error||errorMessage(err)})}}
 return <section className="card"><h3>Assignment strategy</h3><p className="muted">How a technician is chosen when a new incident is reported. Admins can still override any assignment on the All incidents page.</p>
  {data&&<form onSubmit={save}>{data.options.map(o=><label key={o.value} className="choice"><input type="radio" name="strategy" value={o.value} checked={choice===o.value} onChange={()=>setChoice(o.value)}/><span><b>{o.label}</b>{data.strategy===o.value&&<span className="muted"> (current)</span>}<br/><span className="muted">{o.description}</span></span></label>)}
  <button className="btn small" disabled={choice===data.strategy}>Save strategy</button></form>}
  {message&&<p className={message.bad?'bad':'workflow-message'}>{message.text}</p>}</section>
}

// The most active incidents one technician may have. Assignment skips full technicians; overrides and delegations to them are refused.
function WorkloadLimitCard(){
 const [value,setValue]=useState(''); const [saved,setSaved]=useState(null); const [message,setMessage]=useState(null)
 useEffect(()=>{api.getWorkloadLimit().then(r=>{setValue(String(r.maxActiveIncidents));setSaved(r.maxActiveIncidents)}).catch(e=>setMessage({bad:true,text:errorMessage(e)}))},[])
 async function save(e){e.preventDefault();setMessage(null);try{const r=await api.updateWorkloadLimit(Number(value));setSaved(r.maxActiveIncidents);setValue(String(r.maxActiveIncidents));setMessage({bad:false,text:'Saved. A technician with '+r.maxActiveIncidents+' active incident'+(r.maxActiveIncidents===1?'':'s')+' gets no new ones.'})}catch(err){setMessage({bad:true,text:err?.data?.error||errorMessage(err)})}}
 return <section className="card"><h3>Technician workload limit</h3><p className="muted">The most active (not yet resolved) incidents one technician can have. Automatic assignment skips technicians at the limit, and overrides or delegations to them are refused with a clear message.</p>
  <form className="row" style={{alignItems:'flex-end'}} onSubmit={save}><label>Maximum active incidents<input type="number" min="1" max="100" step="1" value={value} onChange={e=>setValue(e.target.value)} style={{width:140}}/></label><button className="btn small" disabled={saved==null||String(saved)===value}>Save limit</button></form>
  {message&&<p className={message.bad?'bad':'workflow-message'}>{message.text}</p>}</section>
}

// SLA for one IT service and priority. It replaces the standard SLA (table above) for incidents that affect that service.
function ServiceSlaCard({ services, standard }){
 const EMPTY={serviceId:'',priority:'P1',response:'',resolution:'',warning:''}
 const [rows,setRows]=useState([]); const [form,setForm]=useState(EMPTY); const [message,setMessage]=useState(null)
 async function load(){try{setRows(await api.getServiceSlaPolicies())}catch(e){setMessage({bad:true,text:errorMessage(e)})}}
 useEffect(()=>{load()},[])
 // Start from the standard times of the chosen priority, so the admin only changes what is different
 const withStandard=(f,p)=>{const st=standard.find(x=>x.priority===p);return {...f,priority:p,response:st?String(st.responseTimeMinutes):'',resolution:st?String(st.resolutionTimeMinutes):'',warning:st?String(st.warningTimeMinutes):''}}
 useEffect(()=>{if(standard.length&&form.response==='')setForm(f=>withStandard(f,f.priority))},[standard])
 const set=k=>e=>setForm({...form,[k]:e.target.value})
 async function save(e){e.preventDefault();setMessage(null);if(!form.serviceId)return setMessage({bad:true,text:'Choose a service.'})
  try{const r=await api.updateServiceSlaPolicy(form.serviceId,form.priority,{responseTimeMinutes:Number(form.response),resolutionTimeMinutes:Number(form.resolution),warningTimeMinutes:Number(form.warning)});setMessage({bad:false,text:'Saved: '+r.service.name+' '+r.priority+'. New incidents for this service use these times.'});load()}
  catch(err){setMessage({bad:true,text:err?.data?.error||errorMessage(err)})}}
 async function remove(r){setMessage(null);try{await api.deleteServiceSlaPolicy(r.service.id,r.priority);setMessage({bad:false,text:r.service.name+' '+r.priority+' uses the standard SLA again.'});load()}catch(err){setMessage({bad:true,text:err?.data?.error||errorMessage(err)})}}
 return <section className="card"><h3>SLA per IT service</h3><p className="muted">Give an important service faster targets than the standard SLA. Incidents for that service and priority use these times; everything else uses the standard SLA policies above.</p>
  <form className="filters" onSubmit={save}>
   <label>Service<select value={form.serviceId} onChange={set('serviceId')}><option value="">Choose...</option>{services.filter(x=>x.active!==false).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
   <label>Priority<select value={form.priority} onChange={e=>setForm(withStandard(form,e.target.value))}>{['P1','P2','P3','P4'].map(p=><option key={p}>{p}</option>)}</select></label>
   <label>Response minutes<input type="number" min="1" value={form.response} onChange={set('response')} style={{width:110}}/></label>
   <label>Resolution minutes<input type="number" min="1" value={form.resolution} onChange={set('resolution')} style={{width:110}}/></label>
   <label>Warning minutes<input type="number" min="0" value={form.warning} onChange={set('warning')} style={{width:110}}/></label>
   <button className="btn small">Save service SLA</button>
  </form>
  {message&&<p className={message.bad?'bad':'workflow-message'}>{message.text}</p>}
  {rows.length===0?<p className="muted">No service-specific SLAs yet. All services use the standard SLA.</p>:
  <div className="tablewrap" style={{marginTop:12}}><table><thead><tr><th>Service</th><th>Priority</th><th>Response minutes</th><th>Resolution minutes</th><th>Warning minutes</th><th></th></tr></thead>
   <tbody>{rows.map(r=><tr key={r.id}><td>{r.service.name}</td><td>{r.priority}</td><td>{r.responseTimeMinutes}</td><td>{r.resolutionTimeMinutes}</td><td>{r.warningTimeMinutes}</td><td><button className="btn small" onClick={()=>remove(r)}>Remove</button></td></tr>)}</tbody></table></div>}
 </section>
}

export default function Settings(){
 const [data,setData]=useState({services:[],categories:[],sla:[],users:[]}); const [error,setError]=useState('')
 async function load(){try{const [services,categories,sla,users]=await Promise.all([api.getServices(),api.getCategories(),api.getSlaPolicies(),api.getUsers()]);setData({services,categories,sla,users})}catch(e){setError(errorMessage(e))}}
 useEffect(()=>{load()},[])
 async function updateUser(id,body){try{await api.updateUser(id,body);load()}catch(e){setError(errorMessage(e))}}
 async function updateSla(priority,body){setError('');try{await api.updateSlaPolicy(priority,body);load()}catch(e){setError(e?.data?.error||errorMessage(e))}}
 return <><h2>Administration settings</h2>{error&&<p className="bad">{error}</p>}
 <ListEditor title="IT services" items={data.services} onAdd={api.createService} onUpdate={api.updateService} onSaved={load}/>
 <ListEditor title="Incident categories" items={data.categories} onAdd={api.createCategory} onUpdate={api.updateCategory} onSaved={load}/>
 <section className="card"><h3>SLA policies</h3><div className="tablewrap"><table><thead><tr><th>Priority</th><th>Response minutes</th><th>Resolution minutes</th><th>Warning minutes</th><th></th></tr></thead><tbody>{data.sla.map(s=><tr key={s.priority}><td>{s.priority}</td><td><input type="number" min="1" defaultValue={s.responseTimeMinutes} id={'r'+s.priority}/></td><td><input type="number" min="1" defaultValue={s.resolutionTimeMinutes} id={'d'+s.priority}/></td><td><input type="number" min="0" defaultValue={s.warningTimeMinutes} id={'w'+s.priority}/></td><td><button className="btn small" onClick={()=>updateSla(s.priority,{responseTimeMinutes:Number(document.getElementById('r'+s.priority).value),resolutionTimeMinutes:Number(document.getElementById('d'+s.priority).value),warningTimeMinutes:Number(document.getElementById('w'+s.priority).value),active:true})}>Save</button></td></tr>)}</tbody></table></div></section>
 <ServiceSlaCard services={data.services} standard={data.sla}/>
 <AssignmentStrategyCard/>
 <WorkloadLimitCard/>
 <section className="card"><h3>Users</h3><div className="tablewrap"><table><thead><tr><th>Username</th><th>Role</th><th>Email</th><th>Change role</th><th>Reset password</th></tr></thead><tbody>{data.users.map(u=><tr key={u.id}><td>{u.username}</td><td>{u.role}</td><td>{u.email}</td><td><select defaultValue={u.role} onChange={e=>updateUser(u.id,{role:e.target.value,email:u.email})}><option>EMPLOYEE</option><option>TECHNICIAN</option><option>ADMINISTRATOR</option></select></td><td><button className="btn small" onClick={()=>{const p=window.prompt('New password for '+u.username);if(p)updateUser(u.id,{role:u.role,email:u.email,password:p})}}>Reset</button></td></tr>)}</tbody></table></div></section>
 </>
}
