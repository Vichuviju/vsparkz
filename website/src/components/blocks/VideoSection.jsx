function mediaUrl(block) {
  if (!block?.media) return null
  if (block.media.url) return block.media.url
  if (block.media.path) return `${import.meta.env.VITE_API_URL || ''}/storage/${block.media.path}`
  return null
}

export default function VideoSection({ section }) {
  const blocks = section.blocks || []
  const settings = section.settings || {}
  const videoBlock = blocks.find((b) => b.type === 'video' || b.type === 'media')
  const url = videoBlock?.content?.url || settings.video_url || mediaUrl(videoBlock)
  const headline = blocks.find((b) => b.type === 'headline')?.content?.text || settings.headline

  return (
    <section className="py-20 bg-dark-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {headline && (
          <h2 className="text-3xl font-bold text-white text-center mb-10">{headline}</h2>
        )}
        {url && (
          <div className="aspect-video rounded-xl overflow-hidden bg-dark-800">
            {url.includes('youtube') || url.includes('youtu.be') ? (
              <iframe
                src={url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                title="Video"
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <video src={url} controls className="w-full h-full" />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
