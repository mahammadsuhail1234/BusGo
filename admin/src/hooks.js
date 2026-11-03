import { useCallback, useEffect, useState } from 'react'

// Runs an async loader on mount / when deps change.
export function useLoad(loader, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await run())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [run])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, error, loading, reload }
}
