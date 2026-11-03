import { useState } from 'react'
import { api } from '../../api'
import { useLoad } from '../../hooks'
import { PageHeader, State, Stat, Badge } from '../../components/ui'
import { addDaysISO, downloadCSV, money, todayISO } from '../../utils'

export default function Reports() {
  const [from, setFrom] = useState(addDaysISO(todayISO(), -29))
  const [to, setTo] = useState(todayISO())
  const { data, error, loading, reload } = useLoad(() => api('/admin/reports', { params: { from, to } }), [from, to])

  const maxDaily = Math.max(1, ...(data?.daily || []).map((d) => d.revenue))
  const maxRoute = Math.max(1, ...(data?.byRoute || []).map((d) => d.revenue))

  function exportCSV() {
    downloadCSV(`revenue-${from}-to-${to}.csv`, [
      ['Date', 'Bookings', 'Seats', 'Revenue'],
      ...data.daily.map((d) => [d.date, d.bookings, d.seats, d.revenue]),
      [],
      ['Route', 'Bookings', 'Seats', 'Revenue'],
      ...data.byRoute.map((r) => [r.route, r.bookings, r.seats, r.revenue]),
    ])
  }

  return (
    <>
      <PageHeader title="Reports" subtitle="Revenue and booking performance (by booking date, cancelled bookings excluded)">
        <button className="btn" onClick={exportCSV} disabled={!data}>Export CSV</button>
        <button className="btn" onClick={() => window.print()}>Print</button>
      </PageHeader>

      <div className="filters">
        <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <input type="date" value={to} min={from} max={todayISO()} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
        <button className="btn" onClick={() => { setFrom(addDaysISO(todayISO(), -6)); setTo(todayISO()) }}>Last 7 days</button>
        <button className="btn" onClick={() => { setFrom(addDaysISO(todayISO(), -29)); setTo(todayISO()) }}>Last 30 days</button>
      </div>

      <State loading={loading} error={error} onRetry={reload} />

      {data && (
        <>
          <div className="stats">
            <Stat tone="amber" label="Revenue" value={money(data.totals.revenue)} />
            <Stat tone="blue" label="Bookings" value={data.totals.bookings} />
            <Stat tone="green" label="Seats sold" value={data.totals.seats} />
            <Stat tone="purple" label="Avg. per booking" value={money(data.totals.bookings ? Math.round(data.totals.revenue / data.totals.bookings) : 0)} />
          </div>

          <div className="card card-pad" style={{ marginBottom: 18 }}>
            <h2>Daily revenue</h2>
            {data.daily.length === 0 ? (
              <State empty emptyText="No bookings in this period." />
            ) : (
              <div className="chart">
                {data.daily.map((d) => (
                  <div className="chart-col" key={d.date} title={`${d.date}: ${money(d.revenue)} · ${d.bookings} bookings`}>
                    <div className="chart-bar" style={{ height: `${(d.revenue / maxDaily) * 150 + 3}px` }} />
                    <span className="chart-label">{d.date.slice(8)}/{d.date.slice(5, 7)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="two-col">
            <div className="card card-pad">
              <h2>Top routes</h2>
              {data.byRoute.length === 0 ? <State empty emptyText="No data." /> : data.byRoute.map((r) => (
                <div key={r.route} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{r.route}</strong><span>{money(r.revenue)}</span>
                  </div>
                  <div className="sub">{r.bookings} bookings · {r.seats} seats</div>
                  <div className="hbar"><i style={{ width: `${(r.revenue / maxRoute) * 100}%` }} /></div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
              <div className="card card-pad">
                <h2>Booking status</h2>
                {data.statusCounts.length === 0 ? <State empty emptyText="No data." /> : data.statusCounts.map((s) => (
                  <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                    <Badge>{s.status}</Badge>
                    <span>{s.count} bookings · {money(s.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="card card-pad">
                <h2>Top buses</h2>
                {data.byBus.length === 0 ? <State empty emptyText="No data." /> : data.byBus.map((b) => (
                  <div key={b.bus} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0' }}>
                    <span>{b.bus}</span><strong>{money(b.revenue)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
