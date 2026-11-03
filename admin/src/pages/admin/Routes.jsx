import { useState } from 'react'
import { api } from '../../api'
import { useLoad } from '../../hooks'
import { useToast } from '../../components/Toast'
import { Badge, Field, Modal, PageHeader, State } from '../../components/ui'

const EMPTY = { source: '', destination: '', distanceKm: '', estimatedDuration: '', isActive: true }

export default function RoutesPage() {
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api('/admin/routes'))
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const routes = data?.routes || []
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      const body = { ...form, distanceKm: Number(form.distanceKm) || 0 }
      if (form._id) await api(`/admin/routes/${form._id}`, { method: 'PUT', body })
      else await api('/admin/routes', { method: 'POST', body })
      toast(form._id ? 'Route updated' : 'Route added')
      setForm(null)
      reload()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(r) {
    if (!confirm(`Delete route ${r.source} → ${r.destination}?`)) return
    try {
      await api(`/admin/routes/${r._id}`, { method: 'DELETE' })
      toast('Route deleted')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHeader title="Routes" subtitle="Source and destination pairs used when creating schedules">
        <button className="btn primary" onClick={() => { setFormError(''); setForm(EMPTY) }}>+ Add route</button>
      </PageHeader>

      <div className="card">
        <State loading={loading} error={error} onRetry={reload} empty={!loading && !error && routes.length === 0} emptyText="No routes yet." />
        {routes.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Route</th><th className="num">Distance</th><th>Duration</th><th>Status</th><th /></tr></thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r._id}>
                    <td><strong>{r.source}</strong> → <strong>{r.destination}</strong></td>
                    <td className="num">{r.distanceKm ? `${r.distanceKm} km` : '—'}</td>
                    <td>{r.estimatedDuration || '—'}</td>
                    <td><Badge>{r.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn small" onClick={() => { setFormError(''); setForm(r) }}>Edit</button>
                        <button className="btn small danger" onClick={() => remove(r)}>Delete</button>
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
        <Modal title={form._id ? 'Edit route' : 'Add route'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            {formError && <div className="alert">{formError}</div>}
            <div className="form-grid">
              <Field label="Source"><input value={form.source} onChange={set('source')} required /></Field>
              <Field label="Destination"><input value={form.destination} onChange={set('destination')} required /></Field>
              <Field label="Distance (km)"><input type="number" min="0" value={form.distanceKm} onChange={set('distanceKm')} /></Field>
              <Field label="Estimated duration"><input value={form.estimatedDuration} onChange={set('estimatedDuration')} placeholder="2h 30m" /></Field>
            </div>
            <label className="check"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Route is active</label>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save route'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
