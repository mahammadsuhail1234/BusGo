import { useState } from 'react'
import { api } from '../../api'
import { useLoad } from '../../hooks'
import { useToast } from '../../components/Toast'
import { Badge, Field, Modal, PageHeader, State } from '../../components/ui'

const EMPTY = { busName: '', busNumber: '', operator: '', busType: 'AC Seater', totalSeats: 40, assignedOperator: '', isActive: true }
const TYPES = ['AC Seater', 'Non-AC Seater', 'AC Sleeper', 'Non-AC Sleeper', 'Volvo Multi-Axle']

export default function Buses() {
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api('/admin/buses'))
  const staff = useLoad(() => api('/admin/users', { params: { role: 'operator' } }))
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const buses = data?.buses || []
  const operators = staff.data?.users || []
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  function openEdit(b) {
    setFormError('')
    setForm({ ...b, assignedOperator: b.assignedOperator?._id || '' })
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      const body = { ...form, totalSeats: Number(form.totalSeats), assignedOperator: form.assignedOperator || null }
      if (form._id) await api(`/admin/buses/${form._id}`, { method: 'PUT', body })
      else await api('/admin/buses', { method: 'POST', body })
      toast(form._id ? 'Bus updated' : 'Bus added')
      setForm(null)
      reload()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(b) {
    if (!confirm(`Delete ${b.busName} (${b.busNumber})?`)) return
    try {
      await api(`/admin/buses/${b._id}`, { method: 'DELETE' })
      toast('Bus deleted')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHeader title="Buses" subtitle="Manage your fleet and assign operators">
        <button className="btn primary" onClick={() => { setFormError(''); setForm(EMPTY) }}>+ Add bus</button>
      </PageHeader>

      <div className="card">
        <State loading={loading} error={error} onRetry={reload} empty={!loading && !error && buses.length === 0} emptyText="No buses yet. Add your first bus." />
        {buses.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Bus</th><th>Number</th><th>Company</th><th>Type</th><th className="num">Seats</th><th>Operator</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {buses.map((b) => (
                  <tr key={b._id}>
                    <td><strong>{b.busName}</strong></td>
                    <td className="mono">{b.busNumber}</td>
                    <td>{b.operator}</td>
                    <td>{b.busType}</td>
                    <td className="num">{b.totalSeats}</td>
                    <td>{b.assignedOperator ? b.assignedOperator.name : <span className="sub">Unassigned</span>}</td>
                    <td><Badge>{b.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn small" onClick={() => openEdit(b)}>Edit</button>
                        <button className="btn small danger" onClick={() => remove(b)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <Modal title={form._id ? 'Edit bus' : 'Add bus'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            {formError && <div className="alert">{formError}</div>}
            <div className="form-grid">
              <Field label="Bus name"><input value={form.busName} onChange={set('busName')} required /></Field>
              <Field label="Bus number"><input value={form.busNumber} onChange={set('busNumber')} placeholder="KA19AB1234" required /></Field>
              <Field label="Travel company"><input value={form.operator} onChange={set('operator')} required /></Field>
              <Field label="Bus type">
                <select value={form.busType} onChange={set('busType')}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Total seats"><input type="number" min="1" max="80" value={form.totalSeats} onChange={set('totalSeats')} required /></Field>
              <Field label="Assigned operator">
                <select value={form.assignedOperator} onChange={set('assignedOperator')}>
                  <option value="">— Unassigned —</option>
                  {operators.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
                </select>
              </Field>
            </div>
            <label className="check"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Bus is active</label>
            {operators.length === 0 && <p className="sub" style={{ marginBottom: 12 }}>No operators yet — create one from the Users page.</p>}
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save bus'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
