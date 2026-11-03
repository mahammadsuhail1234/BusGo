export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export const fmtDate = (d) => {
  if (!d) return '—'
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00` : d)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

export const todayISO = () => {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

export const addDaysISO = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

// "14:30" -> "02:30 PM"  (the format used by the customer app)
export const to12h = (hhmm) => {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

// "02:30 PM" -> "14:30"
export const to24h = (t) => {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t || '')
  if (!match) return ''
  let h = Number(match[1]) % 12
  if (match[3].toUpperCase() === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${match[2]}`
}

export function downloadCSV(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
