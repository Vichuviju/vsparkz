export default function Stats({ section }) {
  const blocks = section.blocks || []
  const metrics = blocks.filter((b) => b.type === 'metrics').map((b) => b.content).filter(Boolean)
  const settings = section.settings || {}
  const items = metrics.length ? metrics : (settings.items || [
    { value: '100+', label: 'Clients' },
    { value: '50+', label: 'Campaigns' },
    { value: '98%', label: 'Satisfaction' },
  ])

  return (
    <section className="py-20 bg-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-400">
                {item.value ?? item.number}
              </div>
              <div className="mt-1 text-gray-400">{item.label ?? item.title}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
