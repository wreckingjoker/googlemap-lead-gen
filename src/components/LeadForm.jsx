export default function LeadForm({ onSubmit, loading }) {
  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    onSubmit({
      searchQuery: fd.get('searchQuery'),
      location: fd.get('location'),
      maxResults: Number(fd.get('maxResults')),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card header */}
      <div className="js-gradient px-5 py-4">
        <h2 className="text-white font-semibold text-base">Search Parameters</h2>
        <p className="text-white/75 text-xs mt-0.5">Powered by Apify Google Maps Scraper</p>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Search Query
          </label>
          <input
            name="searchQuery"
            type="text"
            required
            placeholder="e.g. restaurants, plumbers, gyms"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Location
          </label>
          <input
            name="location"
            type="text"
            required
            placeholder="e.g. Dubai, UAE"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Max Results
          </label>
          <input
            name="maxResults"
            type="number"
            defaultValue={50}
            min={1}
            max={1000}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
          />
          <p className="text-xs text-gray-400 mt-1">1–1000. Higher numbers take longer.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full js-gradient hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-opacity mt-1"
        >
          {loading ? 'Scraping...' : 'Generate Leads'}
        </button>
      </div>
    </form>
  )
}
