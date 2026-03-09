export default function Testimonial({ section }) {
  const blocks = section.blocks || []
  const settings = section.settings || {}
  const quote = blocks.find((b) => b.type === 'text')?.content?.text || settings.quote || 'Great partnership.'
  const author = settings.author || blocks.find((b) => b.type === 'headline')?.content?.text || 'Client'
  const role = settings.role || ''

  return (
    <section className="py-20 bg-dark-900">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <blockquote className="text-2xl md:text-3xl font-medium text-gray-200">
          &ldquo;{quote}&rdquo;
        </blockquote>
        <footer className="mt-6">
          <cite className="text-primary-400 font-semibold not-italic">{author}</cite>
          {role && <span className="text-gray-500 text-sm block">{role}</span>}
        </footer>
      </div>
    </section>
  )
}
