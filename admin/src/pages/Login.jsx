import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/operator'} replace />

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const u = await login(email, password)
      navigate(u.role === 'admin' ? '/admin' : '/operator', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand dark">
          <span className="brand-mark">B</span>
          <div>
            <strong>BusGo</strong>
            <small>Staff sign in</small>
          </div>
        </div>
        <h1>Welcome back</h1>
        <p className="muted">Admins and bus operators sign in here.</p>

        {error && <div className="alert">{error}</div>}

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="btn primary block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}
