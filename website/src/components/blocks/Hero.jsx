export default function Hero({ section }) {
  const settings = section.settings || {}
  const blocks = section.blocks || []
  const headline = blocks.find((b) => b.type === 'headline')?.content?.text || settings.headline || 'Welcome'
  const subheadline = blocks.find((b) => b.type === 'text')?.content?.text || settings.subheadline || ''
  const ctaBlock = blocks.find((b) => b.type === 'cta')
  const cta = ctaBlock?.cta_config || settings.cta || {}
  const bg = settings.background || 'dark'

  return (
    <section className={`relative py-24 md:py-32 ${bg === 'gradient' ? 'bg-gradient-to-br from-primary-900/40 to-dark-900' : 'bg-dark-800'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
          {headline}
        </h1>
        {subheadline && (
          <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
            {subheadline}
          </p>
        )}
        {(cta.label || ctaBlock?.content?.label) && (
          <div className="mt-10">
            <a
              href={cta.url || ctaBlock?.content?.url || '#'}
              className="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-base font-medium text-white hover:bg-primary-500"
            >
              {cta.label || ctaBlock?.content?.label || 'Get Started'}
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
