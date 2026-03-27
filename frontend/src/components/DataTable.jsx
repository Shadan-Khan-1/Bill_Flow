import { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export default function DataTable({
  columns,
  data = [],
  searchable = true,
  searchKeys = [],
  pageSize = 10,
  emptyMessage = 'No records found',
  loading = false,
}) {
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const filtered = useMemo(() => {
    let rows = [...data]

    if (search && searchKeys.length) {
      const q = search.toLowerCase()
      rows = rows.filter(row =>
        searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(q))
      )
    }

    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey]
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv), undefined, { numeric: true })
          : String(bv).localeCompare(String(av), undefined, { numeric: true })
      })
    }

    return rows
  }, [data, search, sortKey, sortDir, searchKeys])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (key) => {
    if (!key) return
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1) }

  return (
    <div>
      {searchable && (
        <div style={{ marginBottom: 14 }}>
          <div className="search-bar" style={{ maxWidth: 300 }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Search…" value={search} onChange={handleSearch} />
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{ cursor: col.sortable !== false ? 'pointer' : 'default', userSelect: 'none' }}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <div style={{ display: 'inline-block' }} className="animate-spin">⟳</div>
                  {' '}Loading...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={row._id || row.id || i}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: '0 4px' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { icon: ChevronsLeft,  action: () => setPage(1),           disabled: page === 1 },
              { icon: ChevronLeft,   action: () => setPage(p => p - 1),  disabled: page === 1 },
              { icon: ChevronRight,  action: () => setPage(p => p + 1),  disabled: page === totalPages },
              { icon: ChevronsRight, action: () => setPage(totalPages),  disabled: page === totalPages },
            ].map(({ icon: Icon, action, disabled }, i) => (
              <button key={i} className="btn btn-icon" onClick={action} disabled={disabled}
                style={{ width: 28, height: 28, opacity: disabled ? 0.35 : 1 }}>
                <Icon size={13} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
