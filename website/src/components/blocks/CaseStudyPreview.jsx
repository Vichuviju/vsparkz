export default function CaseStudyPreview({ section }) {
  const settings = section.settings || {}
  const blocks = section.blocks || []
  const headline = blocks.find((b) => b.type === 'headline')?.content?.text || settings.headline || 'Case Studies'
  const cta = settings.cta || { label: 'View all', url: '/case-studies' }

  return (
    <section className="py-20 bg-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <h2 className="text-3xl font-bold text-white">{headline}</h2>
          {cta?.url && (
            <a
              href={cta.url}
              className="text-primary-400 font-medium hover:text-primary-300"
            >
              {cta.label}
            </a>
          )}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(settings.cases || []).slice(0, 3).map((c, i) => (
            <a
              key={i}
              href={c.url || '#'}
              className="group rounded-xl border border-dark-700 p-6 bg-dark-900/50 hover:border-primary-600/50 transition"
            >
              <h3 className="text-lg font-semibold text-white group-hover:text-primary-400">{c.title || 'Case Study'}</h3>
              <p className="mt-2 text-gray-400 text-sm">{c.summary || ''}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
