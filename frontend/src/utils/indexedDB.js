import { openDB } from 'idb'

const DB_NAME = 'billflow_offline'
const DB_VERSION = 1

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Pending offline transactions queue
        if (!db.objectStoreNames.contains('offline_queue')) {
          const queue = db.createObjectStore('offline_queue', {
            keyPath: 'id',
            autoIncrement: true
          })
          queue.createIndex('by_type', 'type')
          queue.createIndex('by_status', 'status')
        }

        // Local cache stores
        const stores = ['products', 'sales', 'purchases', 'reports_cache']
        stores.forEach(name => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: '_id' })
          }
        })
      }
    })
  }
  return dbPromise
}

/* ─── Generic helpers ─── */
export async function saveToDB(storeName, data) {
  const db = await getDB()
  return db.put(storeName, data)
}

export async function getFromDB(storeName, key) {
  const db = await getDB()
  return db.get(storeName, key)
}

export async function getAllFromDB(storeName) {
  const db = await getDB()
  return db.getAll(storeName)
}

export async function deleteFromDB(storeName, key) {
  const db = await getDB()
  return db.delete(storeName, key)
}

export async function clearStore(storeName) {
  const db = await getDB()
  return db.clear(storeName)
}

/* ─── Offline Queue ─── */
export async function queueOfflineAction(action) {
  const db = await getDB()
  return db.add('offline_queue', {
    ...action,
    status: 'pending',
    timestamp: new Date().toISOString()
  })
}

export async function getPendingActions() {
  const db = await getDB()
  const idx = db.transaction('offline_queue').store.index('by_status')
  return idx.getAll('pending')
}

export async function markActionSynced(id) {
  const db = await getDB()
  const tx = db.transaction('offline_queue', 'readwrite')
  const item = await tx.store.get(id)
  if (item) {
    item.status = 'synced'
    item.syncedAt = new Date().toISOString()
    await tx.store.put(item)
  }
  await tx.done
}

export async function getPendingCount() {
  const pending = await getPendingActions()
  return pending.length
}
