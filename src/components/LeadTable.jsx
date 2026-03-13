import { useState } from 'react'
import { exportCSV } from '../utils/exportCSV'
import { researchLead } from '../api/n8n'

const STORAGE_KEY = 'leadflow_lead_status'

const STATUS_CONFIG = {
  hot:  { label: 'Hot',  emoji: '🔥', bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200'    },
  warm: { label: 'Warm', emoji: '☀️', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  cold: { label: 'Cold', emoji: '❄️', bg: 'bg-blue-50',   text: 'text-blue-500',   border: 'border-blue-200'   },
}

function leadKey(lead) {
  return `${lead.title ?? ''}::${lead.phoneUnformatted ?? lead.phone ?? ''}`
}

function loadStatuses() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}

function saveStatuses(statuses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses))
}

function StatusBadge({ leadId, autoHot, onStatusChange }) {
  const [status, setStatus] = useState(() => {
    const saved = loadStatuses()[leadId]
    if (saved) return saved
    if (autoHot) {
      const all = loadStatuses()
      all[leadId] = 'hot'
      saveStatuses(all)
      return 'hot'
    }
    return null
  })
  const [open, setOpen] = useState(false)

  function pick(val) {
    const next = val === status ? null : val
    setStatus(next)
    const all = loadStatuses()
    if (next) all[leadId] = next
    else delete all[leadId]
    saveStatuses(all)
    setOpen(false)
    onStatusChange?.()
  }

  const cfg = status ? STATUS_CONFIG[status] : null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-xs font-semibold border rounded-full px-2.5 py-1 transition-colors whitespace-nowrap flex items-center gap-1 ${
          cfg
            ? `${cfg.bg} ${cfg.text} ${cfg.border}`
            : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
        }`}
      >
        {cfg ? <>{cfg.emoji} {cfg.label}</> : 'Set status'}
        <span className="text-[10px] opacity-60">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[120px]">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => pick(key)}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                  status === key ? `${cfg.text} font-semibold` : 'text-gray-700'
                }`}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
                {status === key && <span className="ml-auto text-[10px]">✓</span>}
              </button>
            ))}
            {status && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => pick(status)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StarRating({ score }) {
  if (!score) return <span className="text-gray-400 text-xs">—</span>
  const stars = Math.round(score)
  return (
    <span className="flex items-center gap-1 text-sm">
      <span className="text-yellow-400">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
      <span className="text-gray-500 text-xs">{score}</span>
    </span>
  )
}

function BriefModal({ brief, state, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[480px] max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">Sales Brief</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {state === 'error' ? (
            <p className="text-sm text-red-600">{brief}</p>
          ) : (
            <ul className="space-y-3">
              {brief.split('\n').filter(line => line.trim()).map((line, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                  <span className="text-brand-orange mt-0.5 shrink-0">•</span>
                  <span>{line.replace(/^\*\s*/, '')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function ResearchButton({ lead }) {
  const [state, setState] = useState('idle')
  const [brief, setBrief] = useState('')
  const [open, setOpen] = useState(false)

  async function handleResearch() {
    setState('loading')
    try {
      const result = await researchLead(lead)
      setBrief(result)
      setState('done')
      setOpen(true)
    } catch (err) {
      setBrief(err.message)
      setState('error')
      setOpen(true)
    }
  }

  return (
    <>
      {state === 'idle' && (
        <button
          onClick={handleResearch}
          className="text-xs font-semibold text-white js-gradient hover:opacity-90 rounded-md px-2.5 py-1 transition-opacity whitespace-nowrap"
        >
          Research
        </button>
      )}
      {state === 'loading' && (
        <span className="flex items-center gap-1.5 text-xs text-brand-orange font-medium">
          <span className="w-3 h-3 border border-brand-orange border-t-transparent rounded-full animate-spin inline-block" />
          Researching...
        </span>
      )}
      {(state === 'done' || state === 'error') && (
        <button
          onClick={() => setOpen(true)}
          className={`text-xs font-semibold border rounded-md px-2.5 py-1 transition-colors whitespace-nowrap ${
            state === 'error'
              ? 'text-red-600 border-red-200 hover:bg-red-50'
              : 'text-brand-orange border-brand-orange/30 hover:bg-orange-50'
          }`}
        >
          Show Brief
        </button>
      )}
      {open && <BriefModal brief={brief} state={state} onClose={() => setOpen(false)} />}
    </>
  )
}

const FILTER_OPTIONS = [
  { value: 'all',  label: 'All leads' },
  { value: 'hot',  label: '🔥 Hot'   },
  { value: 'warm', label: '☀️ Warm'  },
  { value: 'cold', label: '❄️ Cold'  },
]

const PIE_COLORS = { hot: '#ef4444', warm: '#eab308', cold: '#3b82f6', none: '#e5e7eb' }

function LeadPieChart({ counts, total }) {
  const r = 28
  const cx = 36
  const cy = 36
  const circumference = 2 * Math.PI * r

  const segments = [
    { key: 'hot',  value: counts.hot  },
    { key: 'warm', value: counts.warm },
    { key: 'cold', value: counts.cold },
  ]
  const tagged = segments.reduce((s, x) => s + x.value, 0)
  const none = total - tagged
  if (none > 0) segments.push({ key: 'none', value: none })

  let offset = 0
  const slices = segments.map(seg => {
    const pct = total === 0 ? 0 : seg.value / total
    const dash = pct * circumference
    const gap  = circumference - dash
    const slice = { key: seg.key, dash, gap, offset, value: seg.value }
    offset += dash
    return slice
  })

  if (total === 0) {
    return (
      <svg width={72} height={72}>
        <circle cx={cx} cy={cy} r={r} fill="#e5e7eb" />
      </svg>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
        {slices.map(s => (
          <circle
            key={s.key}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={PIE_COLORS[s.key]}
            strokeWidth={s.key === 'none' ? 10 : 12}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
          />
        ))}
      </svg>
      <div className="flex flex-col gap-0.5 text-xs">
        {segments.filter(s => s.key !== 'none' && s.value > 0).map(s => (
          <span key={s.key} className="flex items-center gap-1.5 text-gray-600 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: PIE_COLORS[s.key] }} />
            <span className="font-medium capitalize">{s.key}</span>
            <span className="text-gray-400">{s.value}</span>
          </span>
        ))}
        {none > 0 && (
          <span className="flex items-center gap-1.5 text-gray-400 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-gray-200 inline-block shrink-0" />
            <span>Unset</span>
            <span>{none}</span>
          </span>
        )}
      </div>
    </div>
  )
}

export default function LeadTable({ leads, query }) {
  if (!leads.length) return null

  const [filter, setFilter] = useState('all')
  const [statuses, setStatuses] = useState(loadStatuses)

  function syncStatuses() { setStatuses(loadStatuses()) }

  const counts = { hot: 0, warm: 0, cold: 0 }
  leads.forEach(l => { const s = statuses[leadKey(l)]; if (s) counts[s]++ })

  const filtered = filter === 'all'
    ? leads
    : leads.filter(l => statuses[leadKey(l)] === filter)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-wrap gap-3">
        <div className="flex items-center gap-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Results</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-semibold text-brand-orange">{leads.length}</span> leads found for{' '}
              <span className="font-medium">"{query}"</span>
            </p>
          </div>
          <LeadPieChart counts={counts} total={leads.length} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status filter pills */}
          <div className="flex items-center gap-1.5">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`text-xs font-semibold rounded-full px-3 py-1 border transition-colors whitespace-nowrap ${
                  filter === opt.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >
                {opt.label}
                {opt.value !== 'all' && counts[opt.value] > 0 && (
                  <span className="ml-1 opacity-70">({counts[opt.value]})</span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => exportCSV(leads, `leads-${query.replace(/\s+/g, '-')}.csv`)}
            className="flex items-center gap-2 text-sm font-semibold text-white js-gradient hover:opacity-90 rounded-lg px-4 py-1.5 transition-opacity"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-white">
            <tr className="js-gradient">
              <th className="text-left px-4 py-3 font-semibold">Business</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Phone</th>
              <th className="text-left px-4 py-3 font-semibold">Website</th>
              <th className="text-left px-4 py-3 font-semibold">Category</th>
              <th className="text-left px-4 py-3 font-semibold">Rating</th>
              <th className="text-left px-4 py-3 font-semibold">Reviews</th>
              <th className="text-left px-4 py-3 font-semibold">Maps</th>
              <th className="text-left px-4 py-3 font-semibold">Sales Brief</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((lead, i) => {
              const status = statuses[leadKey(lead)]
              const rowCfg = status ? STATUS_CONFIG[status] : null
              return (
                <tr
                  key={i}
                  className={`transition-colors align-top ${
                    rowCfg ? `${rowCfg.bg}/40` : 'hover:bg-orange-50/30'
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-brand-dark max-w-[180px] truncate">
                    {lead.title ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      leadId={leadKey(lead)}
                      key={leadKey(lead)}
                      autoHot={!lead.website}
                      onStatusChange={syncStatuses}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {lead.phoneUnformatted || lead.phone || '—'}
                  </td>
                  <td className="px-4 py-3 max-w-[140px] truncate">
                    {lead.website ? (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-orange hover:underline"
                      >
                        {lead.website.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    ) : (
                      <span className="text-brand-red text-xs font-semibold">No website</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{lead.categoryName ?? '—'}</td>
                  <td className="px-4 py-3"><StarRating score={lead.totalScore} /></td>
                  <td className="px-4 py-3 text-gray-600">{lead.reviewsCount ?? '—'}</td>
                  <td className="px-4 py-3">
                    {lead.url ? (
                      <a
                        href={lead.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-orange hover:underline text-xs font-medium"
                      >
                        View
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ResearchButton lead={lead} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No {filter} leads yet. Mark some leads above.
          </div>
        )}
      </div>
    </div>
  )
}
