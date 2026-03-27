/**
 * BillFlow Service Worker
 * Handles offline caching, background sync, and push notifications.
 * This file is separate from Workbox — it provides manual control
 * for advanced offline scenarios.
 *
 * NOTE: vite-plugin-pwa generates the primary SW automatically.
 * This file is registered as an additional layer for background sync.
 */

const CACHE_NAME    = 'billflow-v2'
const API_CACHE     = 'billflow-api-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
]

/* ── Install: pre-cache static shell ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

/* ── Activate: clean old caches ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

/* ── Fetch: network-first for API, cache-first for static ── */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  /* API requests → Network First with 5s timeout */
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  /* Static assets → Cache First */
  if (request.method === 'GET') {
    event.respondWith(cacheFirst(request, CACHE_NAME))
  }
})

/* ── Network First strategy ── */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const networkResponse = await Promise.race([
      fetch(request.clone()),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ])
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    return new Response(
      JSON.stringify({ status: 'error', message: 'You are offline', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/* ── Cache First strategy ── */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    /* Return app shell for navigation requests */
    if (request.mode === 'navigate') {
      return caches.match('/index.html')
    }
    return new Response('Offline', { status: 503 })
  }
}

/* ── Background Sync ── */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-transactions') {
    event.waitUntil(syncOfflineTransactions())
  }
})

async function syncOfflineTransactions() {
  /* Signal all clients to trigger their IDB sync */
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach(client => client.postMessage({ type: 'SYNC_OFFLINE_QUEUE' }))
}

/* ── Push Notifications ── */
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'BillFlow', {
      body:    data.body,
      icon:    '/icons/icon-192.png',
      badge:   '/icons/badge-72.png',
      tag:     data.tag || 'billflow',
      data:    data.url ? { url: data.url } : undefined,
      actions: data.actions || [],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})
