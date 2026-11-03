import { useEffect } from 'react'

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="page-actions">{children}</div>
    </div>
  )
}

export function State({ loading, error, empty, emptyText = 'Nothing to show yet.', onRetry }) {
  if (loading) return <div className="state">Loading…</div>
  if (error)
    return (
      <div className="state error">
        {error} {onRetry && <button className="btn small" onClick={onRetry}>Retry</button>}
      </div>
    )
  if (empty) return <div className="state">{emptyText}</div>
  return null
}

const TONES = {
  Confirmed: 'green', Pending: 'amber', Cancelled: 'red',
  Scheduled: 'blue', Boarding: 'amber', Departed: 'purple', Delayed: 'orange', Arrived: 'green',
  admin: 'purple', operator: 'blue', user: 'gray',
  Active: 'green', Inactive: 'gray',
}

export function Badge({ children }) {
  return <span className={`badge ${TONES[children] || 'gray'}`}>{children}</span>
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className={`stat ${tone || ''}`}>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}
