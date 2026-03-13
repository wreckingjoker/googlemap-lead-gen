export function exportCSV(leads, filename = 'leads.csv') {
  const headers = [
    'Business Name', 'Phone', 'Website', 'Address',
    'Category', 'Rating', 'Reviews', 'Google Maps URL',
  ]

  const rows = leads.map((l) => [
    l.title ?? '',
    `\t${l.phoneUnformatted ?? l.phone ?? ''}`,
    l.website ?? '',
    l.address ?? l.neighborhood ?? '',
    l.categoryName ?? '',
    l.totalScore ?? '',
    l.reviewsCount ?? '',
    l.url ?? '',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
