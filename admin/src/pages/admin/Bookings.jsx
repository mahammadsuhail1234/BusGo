import { useState } from 'react'
import { api } from '../../api'
import { useLoad } from '../../hooks'
import { useToast } from '../../components/Toast'
import { Badge, Modal, PageHeader, State } from '../../components/ui'
import { downloadCSV, fmtDate, fmtDateTime, money } from '../../utils'

export default function Bookings() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [target, setTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [statusBusyId, setStatusBusyId] = useState('')

  const { data, error, loading, reload } = useLoad(
    () => api('/admin/bookings', { params: { search: query, status, date } }),
    [query, status, date]
  )
  const bookings = data?.bookings || []

  async function confirmCancel() {
    setBusy(true)
    try {
      const res = await api(`/admin/bookings/${target._id}/cancel`, { method: 'PATCH', body: { reason } })
      toast(res.message)
      setTarget(null)
      setReason('')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function updateStatus(booking, nextStatus) {
    setStatusBusyId(booking._id)
    try {
      const res = await api(`/admin/bookings/${booking._id}/status`, {
        method: 'PATCH',
        body: { status: nextStatus },
      })
      toast(res.message)
      reload()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setStatusBusyId('')
    }
  }

  function exportCSV() {
    downloadCSV('bookings.csv', [
      ['Booking ID', 'Passengers', 'Phone', 'Route', 'Travel date', 'Seats', 'Amount', 'Status', 'Booked at'],
      ...bookings.map((b) => [
        b.bookingId, b.passengers.map((p) => p.name).join('; '), b.phone,
        b.bus ? `${b.bus.source} -> ${b.bus.destination}` : '', b.bus?.travelDate || '',
        b.selectedSeats.join(' '), b.totalPrice, b.status, new Date(b.createdAt).toLocaleString(),
      ]),
    ])
  }

  return (
    <>
      <PageHeader title="Bookings" subtitle="View bookings, update status, or cancel">
        <button className="btn" onClick={exportCSV} disabled={!bookings.length}>Export CSV</button>
      </PageHeader>

      <form className="filters" onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()) }}>
        <input className="grow" placeholder="Search booking ID, passenger, phone, email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          <option>Pending</option><option>Confirmed</option><option>Cancelled</option>
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Travel date" title="Travel date" />
        <button className="btn primary">Search</button>
      </form>

      <div className="card">
        <State loading={loading} error={error} onRetry={reload} empty={!loading && !error && bookings.length === 0} emptyText="No bookings found." />
        {bookings.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Booking</th><th>Passengers</th><th>Trip</th><th>Seats</th><th className="num">Amount</th><th>Status</th><th>Booked</th><th /></tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td className="mono">{b.bookingId}</td>
                    <td>
                      {b.passengers.map((p) => p.name).join(', ')}
                      <div className="sub">{b.phone}{b.user ? ` · ${b.user.name}` : ' · Guest'}</div>
                    </td>
                    <td>
                      {b.bus ? <>{b.bus.source} → {b.bus.destination}<div className="sub">{fmtDate(b.bus.travelDate)} · {b.bus.departureTime}</div></> : <span className="sub">Trip removed</span>}
                    </td>
                    <td>{b.selectedSeats.join(', ')}</td>
                    <td className="num">{money(b.totalPrice)}</td>
                    <td>
                      <Badge>{b.status}</Badge>
                      {b.status === 'Pending' && (
                        <select
                          className="booking-status-select"
                          aria-label={`Update status for ${b.bookingId}`}
                          value={b.status}
                          disabled={statusBusyId === b._id}
                          onChange={(e) => updateStatus(b, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                        </select>
                      )}
                    </td>
                    <td className="sub">{fmtDateTime(b.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        {b.status !== 'Cancelled' && <button className="btn small danger" onClick={() => setTarget(b)}>Cancel</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {target && (
        <Modal title={`Cancel ${target.bookingId}?`} onClose={() => setTarget(null)}>
          <p className="muted" style={{ marginBottom: 14 }}>
            {target.selectedSeats.length} seat(s) will be released and the booking marked as cancelled.
          </p>
          <label className="field">
            <span>Reason (optional)</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Passenger request" maxLength={200} />
          </label>
          <div className="modal-actions">
            <button className="btn" onClick={() => setTarget(null)}>Keep booking</button>
            <button className="btn danger" onClick={confirmCancel} disabled={busy}>{busy ? 'Cancelling…' : 'Cancel booking'}</button>
          </div>
        </Modal>
      )}
    </>
  )
}
