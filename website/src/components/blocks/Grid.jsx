function mediaUrl(block) {
  if (block.media?.url) return block.media.url
  if (block.media?.path) return `${import.meta.env.VITE_API_URL || ''}/storage/${block.media.path}`
  return null
}

export default function Grid({ section }) {
  const settings = section.settings || {}
  const blocks = section.blocks || []
  const columns = settings.columns || 3
  const headline = blocks.find((b) => b.type === 'headline')?.content?.text || settings.headline

  return (
    <section className="py-16 md:py-24 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {headline && (
          <h2 className="text-3xl font-bold text-white text-center mb-12">{headline}</h2>
        )}
        <div
          className="grid gap-8"
          style={{ gridTemplateColumns: `repeat(${Math.min(columns, 4)}, minmax(0, 1fr))` }}
        >
          {blocks
            .filter((b) => b.type === 'media' || b.type === 'headline' || b.type === 'text')
            .map((block) => (
              <div key={block.id} className="rounded-xl border border-dark-700 p-6 bg-dark-800/50">
                {block.type === 'media' && mediaUrl(block) && (
                  <img
                    src={mediaUrl(block)}
                    alt={block.content?.alt || ''}
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                )}
                {block.type === 'headline' && (
                  <h3 className="text-xl font-semibold text-white">{block.content?.text || ''}</h3>
                )}
                {block.type === 'text' && (
                  <p className="mt-2 text-gray-400">{block.content?.text || ''}</p>
                )}
              </div>
            ))}
        </div>
      </div>
    </section>
  )
}
