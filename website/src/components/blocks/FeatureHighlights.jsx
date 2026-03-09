export default function FeatureHighlights({ section }) {
  const blocks = section.blocks || []
  const settings = section.settings || {}
  const headline = blocks.find((b) => b.type === 'headline')?.content?.text || settings.headline || 'Why choose us'
  const features = settings.items || blocks
    .filter((b) => b.type === 'text' || b.type === 'headline')
    .map((b) => ({ title: b.type === 'headline' ? b.content?.text : null, text: b.type === 'text' ? b.content?.text : null }))
    .filter((f) => f.title || f.text)
  const list = features.length ? features : [{ title: 'Expert team', text: 'Industry experts driving your growth.' }, { title: 'Data-driven', text: 'Decisions backed by analytics.' }]

  return (
    <section className="py-20 bg-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white text-center mb-12">{headline}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {list.map((item, i) => (
            <div key={i} className="rounded-xl border border-dark-700 p-6">
              <h3 className="text-lg font-semibold text-primary-400">{item.title || 'Feature'}</h3>
              <p className="mt-2 text-gray-400">{item.text || ''}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
