export default function Metrics({ section }) {
  const blocks = section.blocks || []
  const items = blocks.filter((b) => b.type === 'metrics').map((b) => b.content).filter(Boolean)
  const settings = section.settings || {}
  const list = items.length ? items : (settings.items || [{ value: '0', label: 'Metric' }])

  return (
    <section className="py-16 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {list.map((item, i) => (
            <div key={i} className="text-center p-4 rounded-lg bg-dark-800 border border-dark-700">
              <span className="text-2xl font-bold text-primary-400">{item.value ?? item.number}</span>
              <span className="block text-sm text-gray-400 mt-1">{item.label ?? item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
