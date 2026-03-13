const WEBHOOK_URL    = import.meta.env.VITE_N8N_WEBHOOK_URL
const ENRICH_URL     = import.meta.env.VITE_N8N_ENRICH_URL
const SHEETS_SAVE    = import.meta.env.VITE_N8N_SHEETS_SAVE_URL
const SHEETS_HISTORY = import.meta.env.VITE_N8N_SHEETS_HISTORY_URL

export async function scrapeLeads({ searchQuery, location, maxResults }) {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchQuery, location, maxResults }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Webhook failed (${response.status}): ${text}`)
  }

  return response.json()
}

export async function researchLead(lead) {
  const response = await fetch(ENRICH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: lead.title ?? '',
      category: lead.categoryName ?? '',
      website: lead.website ?? '',
      address: lead.address ?? lead.neighborhood ?? '',
      phone: lead.phoneUnformatted ?? lead.phone ?? '',
      rating: lead.totalScore ?? '',
      reviews: lead.reviewsCount ?? '',
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Enrich failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  return data.brief ?? ''
}

// Save a search session's leads to Google Sheets via n8n
export async function saveToSheets({ sessionId, query, location, leads }) {
  if (!SHEETS_SAVE) return
  const rows = leads.map(l => ({
    session_id:    sessionId,
    timestamp:     new Date().toISOString(),
    query,
    location:      location ?? '',
    business_name: l.title ?? '',
    phone:         l.phoneUnformatted ?? l.phone ?? '',
    website:       l.website ?? '',
    category:      l.categoryName ?? '',
    rating:        l.totalScore ?? '',
    reviews:       l.reviewsCount ?? '',
    maps_url:      l.url ?? '',
  }))
  await fetch(SHEETS_SAVE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  })
}

// Fetch past sessions grouped by session_id from Google Sheets
export async function fetchHistory() {
  if (!SHEETS_HISTORY) return []
  const response = await fetch(SHEETS_HISTORY)
  if (!response.ok) return []
  const data = await response.json()
  return data.sessions ?? []
}
