function mediaUrl(block) {
  if (block.media?.url) return block.media.url
  if (block.media?.path) return `${import.meta.env.VITE_API_URL || ''}/storage/${block.media.path}`
  return null
}

export default function Carousel({ section }) {
  const blocks = section.blocks || []
  const settings = section.settings || {}
  const title = settings.title || ''

  return (
    <section className="py-16 bg-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-2xl font-bold text-white text-center mb-10">{title}</h2>
        )}
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-dark-600">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="flex-shrink-0 w-48 h-24 rounded-lg bg-dark-700 flex items-center justify-center overflow-hidden"
            >
              {block.type === 'media' && mediaUrl(block) ? (
                <img
                  src={mediaUrl(block)}
                  alt={block.content?.alt || ''}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <span className="text-gray-500 text-sm">{block.content?.text || 'Logo'}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
