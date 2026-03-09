export default function Timeline({ section }) {
  const settings = section.settings || {}
  const blocks = section.blocks || []
  const headline = blocks.find((b) => b.type === 'headline')?.content?.text || settings.headline || 'Our journey'
  const steps = settings.steps || settings.items || [
    { year: '2020', title: 'Founded', description: 'Started with a small team.' },
    { year: '2023', title: 'Growth', description: 'Expanded services and client base.' },
  ]

  return (
    <section className="py-20 bg-dark-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white text-center mb-14">{headline}</h2>
        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-6">
              <div className="flex-shrink-0 w-20 text-right">
                <span className="text-primary-400 font-bold">{step.year || step.date}</span>
              </div>
              <div className="flex-1 border-l-2 border-dark-600 pl-6 pb-8">
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-1 text-gray-400">{step.description || step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
