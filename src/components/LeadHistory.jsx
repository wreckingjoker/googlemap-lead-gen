import { useState, useEffect } from 'react'
import { fetchHistory } from '../api/n8n'

const LOCAL_KEY = 'leadflow_history'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}

export function saveSessionLocal({ sessionId, query, location, leads }) {
  const history = loadLocal()
  history.unshift({
    sessionId,
    timestamp: new Date().toISOString(),
    query,
    location: location ?? '',
    leadCount: leads.length,
    leads,
  })
  // keep last 50 sessions
  localStorage.setItem(LOCAL_KEY, JSON.stringify(history.slice(0, 50)))
}

export default function LeadHistory({ onReload }) {
  const [sessions, setSessions] = useState([])
  const [source, setSource] = useState('local') // 'local' | 'sheets'
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setSessions(loadLocal())
    setSource('local')
  }, [open])

  async function loadFromSheets() {
    setLoading(true)
    try {
      const data = await fetchHistory()
      setSessions(data)
      setSource('sheets')
    } catch {
      // fall back silently
    } finally {
      setLoading(false)
    }
  }

  function fmt(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs font-semibold text-gray-500 border border-gray-200 hover:border-gray-400 bg-white rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        History
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[560px] max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Lead Search History</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {source === 'sheets' ? 'Loaded from Google Sheets' : 'Loaded from local storage'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {import.meta.env.VITE_N8N_SHEETS_HISTORY_URL && (
                  <button
                    onClick={loadFromSheets}
                    disabled={loading}
                    className="text-xs font-semibold text-green-600 border border-green-200 hover:bg-green-50 rounded-md px-2.5 py-1 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {loading
                      ? <span className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin inline-block" />
                      : <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    }
                    Sync Sheets
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
              </div>
            </div>

            {/* Session list */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {sessions.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400">
                  No history yet. Run a search to start building history.
                </div>
              ) : (
                sessions.map((s, i) => (
                  <div key={s.sessionId ?? i} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {s.query}
                          {s.location && <span className="font-normal text-gray-400"> · {s.location}</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmt(s.timestamp)}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange inline-block" />
                            {s.leadCount ?? s.leads?.length ?? 0} leads
                          </span>
                          {s.hotCount > 0 && <span className="text-red-500">🔥 {s.hotCount} hot</span>}
                        </div>
                      </div>
                      {s.leads?.length > 0 && (
                        <button
                          onClick={() => { onReload(s); setOpen(false) }}
                          className="shrink-0 text-xs font-semibold text-white js-gradient hover:opacity-90 rounded-md px-2.5 py-1 transition-opacity"
                        >
                          Reload
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
