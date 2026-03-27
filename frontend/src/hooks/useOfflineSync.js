import { useEffect, useState, useCallback } from 'react'
import { getPendingActions, markActionSynced, getPendingCount } from '../utils/indexedDB'
import api from '../services/api'
import toast from 'react-hot-toast'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const syncPending = useCallback(async () => {
    if (syncing) return
    const actions = await getPendingActions()
    if (actions.length === 0) return

    setSyncing(true)
    toast.loading(`Syncing ${actions.length} offline action(s)...`, { id: 'sync' })
    let synced = 0

    for (const action of actions) {
      try {
        const { method, url, data } = action.request
        await api({ method, url, data })
        await markActionSynced(action.id)
        synced++
      } catch (err) {
        console.error('Sync failed for action', action.id, err)
      }
    }

    setSyncing(false)
    const remaining = await getPendingCount()
    setPendingCount(remaining)

    if (synced > 0) {
      toast.success(`Synced ${synced} action(s) successfully`, { id: 'sync' })
    } else {
      toast.dismiss('sync')
    }
  }, [syncing])

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true)
      toast.success('Back online! Syncing data...')
      syncPending()
    }
    const onOffline = () => {
      setIsOnline(false)
      toast.error('You are offline. Changes will sync when reconnected.')
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    // Check pending on mount
    getPendingCount().then(setPendingCount)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [syncPending])

  return { isOnline, pendingCount, syncing, syncPending }
}
