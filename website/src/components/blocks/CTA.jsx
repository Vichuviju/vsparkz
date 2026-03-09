export default function CTA({ section }) {
  const blocks = section.blocks || []
  const settings = section.settings || {}
  const headline = blocks.find((b) => b.type === 'headline')?.content?.text || settings.headline || 'Ready to grow?'
  const ctaBlock = blocks.find((b) => b.type === 'cta')
  const cta = ctaBlock?.cta_config || ctaBlock?.content || settings.cta || {}

  return (
    <section className="py-20 bg-primary-900/30 border-y border-primary-800/50">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white">{headline}</h2>
        {(cta.label || cta.url) && (
          <a
            href={cta.url || '#'}
            className="mt-8 inline-flex rounded-lg bg-primary-600 px-8 py-4 text-lg font-medium text-white hover:bg-primary-500"
          >
            {cta.label || 'Get in touch'}
          </a>
        )}
      </div>
    </section>
  )
}
