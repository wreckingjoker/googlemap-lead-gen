import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import LeadForm from './components/LeadForm'
import LeadTable from './components/LeadTable'
import LeadHistory, { saveSessionLocal } from './components/LeadHistory'
import { scrapeLeads, saveToSheets } from './api/n8n'

export default function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastQuery, setLastQuery] = useState('')

  async function handleSubmit(formData) {
    setLoading(true)
    setError(null)
    setLeads([])
    setLastQuery(formData.searchQuery)

    try {
      const result = await scrapeLeads(formData)
      const fetched = result.leads ?? []
      setLeads(fetched)

      if (fetched.length > 0) {
        const session = {
          sessionId: uuidv4(),
          query: formData.searchQuery,
          location: formData.location ?? '',
          leads: fetched,
        }
        saveSessionLocal(session)
        saveToSheets(session).catch(() => {}) // fire-and-forget
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleReload(session) {
    setLeads(session.leads)
    setLastQuery(session.query)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <img src="/logo.png" alt="Just Search" className="h-10 w-auto" />
          <div className="flex items-center gap-3">
            <LeadHistory onReload={handleReload} />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Lead Generator</span>
          </div>
        </div>
      </header>

      {/* Hero strip */}
      <div className="js-gradient px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-white text-xl font-bold">Google Maps Lead Generator</h1>
          <p className="text-white/80 text-sm mt-0.5">Find businesses, research prospects, close more clients.</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1">
            <LeadForm onSubmit={handleSubmit} loading={loading} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            {loading && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-3">
                <div className="w-9 h-9 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-gray-700">Scraping Google Maps via Apify...</p>
                <p className="text-xs text-gray-400">This may take 30–90 seconds depending on result count.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-red-800">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && leads.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="w-12 h-12 rounded-xl js-gradient flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Enter a search query and location to find leads.</p>
              </div>
            )}

            {leads.length > 0 && (
              <LeadTable leads={leads} query={lastQuery} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
