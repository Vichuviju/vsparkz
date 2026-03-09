import { getLandingSectionComponent } from './LandingSections'

export default function LandingSectionRenderer({ section }) {
  const type = (section?.type ?? '').toLowerCase().replace(/\s+/g, '_')
  const Component = getLandingSectionComponent(type)
  if (!Component) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="rounded-lg border border-dark-700 p-6 text-gray-500">
            Unknown section type: {section?.type}
          </div>
        </div>
      </section>
    )
  }
  return <Component section={section} />
}
