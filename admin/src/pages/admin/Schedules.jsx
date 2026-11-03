import { useState } from 'react'
import { api } from '../../api'
import { useLoad } from '../../hooks'
import { useToast } from '../../components/Toast'
import { Badge, Field, Modal, PageHeader, State } from '../../components/ui'
import { addDaysISO, fmtDate, money, to12h, to24h, todayISO } from '../../utils'

export default function Schedules() {
  const toast = useToast()
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('')
  const [routeId, setRouteId] = useState('')

  const { data, error, loading, reload } = useLoad(
    () => api('/admin/schedules', { params: { date, status, routeId, ...(!date && { from: todayISO() }) } }),
    [date, status, routeId]
  )
  const buses = useLoad(() => api('/admin/buses'))
  const routes = useLoad(() => api('/admin/routes'))

  const [create, setCreate] = useState(null)
  const [edit, setEdit] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const schedules = data?.schedules || []
  const fleet = (buses.data?.buses || []).filter((b) => b.isActive)
  const routeList = (routes.data?.routes || []).filter((r) => r.isActive)

  function openCreate() {
    setFormError('')
    setCreate({ fleetBus: '', route: '', departureTime: '08:00', arrivalTime: '12:00', price: '', startDate: todayISO(), endDate: addDaysISO(todayISO(), 6) })
  }

  async function submitCreate(e) {
    e.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      const res = await api('/admin/schedules', {
        method: 'POST',
        body: { ...create, departureTime: to12h(create.departureTime), arrivalTime: to12h(create.arrivalTime), price: Number(create.price) },
      })
      toast(res.message)
      setCreate(null)
      reload()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitEdit(e) {
    e.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      await api(`/admin/schedules/${edit._id}`, {
        method: 'PUT',
        body: { travelDate: edit.travelDate, departureTime: to12h(edit.dep), arrivalTime: to12h(edit.arr), price: Number(edit.price) },
      })
      toast('Schedule updated')
      setEdit(null)
      reload()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function cancelTrip(s) {
    if (!confirm(`Cancel this trip? All active bookings on it will be cancelled too.`)) return
    try {
      const res = await api(`/admin/schedules/${s._id}/cancel`, { method: 'PATCH' })
      toast(res.message)
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  async function remove(s) {
    if (!confirm('Delete this schedule?')) return
    try {
      await api(`/admin/schedules/${s._id}`, { method: 'DELETE' })
      toast('Schedule deleted')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const setC = (k) => (e) => setCreate({ ...create, [k]: e.target.value })
  const setE = (k) => (e) => setEdit({ ...edit, [k]: e.target.value })

  return (
    <>
      <PageHeader title="Schedules" subtitle="Create trips by choosing a bus, a route and a date range">
        <button className="btn primary" onClick={openCreate}>+ Create schedule</button>
      </PageHeader>

      <div className="filters">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filter by date" />
        <select value={routeId} onChange={(e) => setRouteId(e.target.value)} aria-label="Filter by route">
          <option value="">All routes</option>
          {(routes.data?.routes || []).map((r) => <option key={r._id} value={r._id}>{r.source} → {r.destination}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {['Scheduled', 'Boarding', 'Departed', 'Delayed', 'Arrived', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
        {date && <button className="btn" onClick={() => setDate('')}>Clear date</button>}
      </div>
      {!date && <p className="sub" style={{ marginBottom: 12 }}>Showing upcoming trips from today (max 500).</p>}

      <div className="card">
        <State loading={loading} error={error} onRetry={reload} empty={!loading && !error && schedules.length === 0} emptyText="No schedules match these filters." />
        {schedules.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Route</th><th>Bus</th><th>Time</th><th className="num">Fare</th><th className="num">Seats left</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s._id}>
                    <td>{fmtDate(s.travelDate)}</td>
                    <td><strong>{s.source}</strong> → <strong>{s.destination}</strong></td>
                    <td>{s.busName}<div className="sub mono">{s.busNumber}</div></td>
                    <td>{s.departureTime} – {s.arrivalTime}</td>
                    <td className="num">{money(s.price)}</td>
                    <td className="num">{s.availableSeats}/{s.totalSeats}</td>
                    <td><Badge>{s.tripStatus || 'Scheduled'}</Badge></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn small" onClick={() => { setFormError(''); setEdit({ ...s, dep: to24h(s.departureTime), arr: to24h(s.arrivalTime) }) }}>Edit</button>
                        {s.tripStatus !== 'Cancelled' && <button className="btn small danger" onClick={() => cancelTrip(s)}>Cancel trip</button>}
                        <button className="btn small danger" onClick={() => remove(s)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {create && (
        <Modal title="Create schedule" onClose={() => setCreate(null)} wide>
          <form onSubmit={submitCreate}>
            {formError && <div className="alert">{formError}</div>}
            <div className="form-grid">
              <Field label="Bus">
                <select value={create.fleetBus} onChange={setC('fleetBus')} required>
                  <option value="">Select bus</option>
                  {fleet.map((b) => <option key={b._id} value={b._id}>{b.busName} ({b.busNumber})</option>)}
                </select>
              </Field>
              <Field label="Route">
                <select value={create.route} onChange={setC('route')} required>
                  <option value="">Select route</option>
                  {routeList.map((r) => <option key={r._id} value={r._id}>{r.source} → {r.destination}</option>)}
                </select>
              </Field>
              <Field label="Departure time"><input type="time" value={create.departureTime} onChange={setC('departureTime')} required /></Field>
              <Field label="Arrival time"><input type="time" value={create.arrivalTime} onChange={setC('arrivalTime')} required /></Field>
              <Field label="Start date"><input type="date" value={create.startDate} onChange={setC('startDate')} required /></Field>
              <Field label="End date" hint="Same as start for a single trip. One trip is created per day (max 92)."><input type="date" min={create.startDate} value={create.endDate} onChange={setC('endDate')} required /></Field>
              <Field label="Fare per seat (₹)"><input type="number" min="0" value={create.price} onChange={setC('price')} required /></Field>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setCreate(null)}>Cancel</button>
              <button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create schedule'}</button>
            </div>
          </form>
        </Modal>
      )}

      {edit && (
        <Modal title="Edit schedule" onClose={() => setEdit(null)}>
          <form onSubmit={submitEdit}>
            {formError && <div className="alert">{formError}</div>}
            <p className="sub" style={{ marginBottom: 12 }}>{edit.source} → {edit.destination} · {edit.busName}</p>
            <div className="form-grid">
              <Field label="Travel date"><input type="date" value={edit.travelDate} onChange={setE('travelDate')} required /></Field>
              <Field label="Fare per seat (₹)"><input type="number" min="0" value={edit.price} onChange={setE('price')} required /></Field>
              <Field label="Departure"><input type="time" value={edit.dep} onChange={setE('dep')} required /></Field>
              <Field label="Arrival"><input type="time" value={edit.arr} onChange={setE('arr')} required /></Field>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
