import LandingBlockRenderer from './LandingBlockRenderer'

const sectionSpacing = 'py-20 md:py-24'
const containerClass = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'

function renderBlocks(section, options = {}) {
  const blocks = section?.blocks ?? []
  return blocks.map((block) => (
    <LandingBlockRenderer key={block.id} block={block} withAnimation={options.withAnimation !== false} />
  ))
}

/** Wraps section content with optional background image (from admin) and overlay for readability. */
function SectionWithBackground({ section, baseClass, children }) {
  const bgUrl = section?.background_image_url
  const settings = section?.settings ?? {}
  const bgPosition = settings.background_position ?? 'center'
  const bgSize = settings.background_size ?? 'cover'
  if (!bgUrl) {
    return <section className={baseClass}>{children}</section>
  }
  return (
    <section
      className={`relative ${sectionSpacing} bg-no-repeat ${baseClass}`}
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundPosition: bgPosition,
        backgroundSize: bgSize,
      }}
    >
      <div className="absolute inset-0 bg-dark-900/80" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </section>
  )
}

export function LandingHero({ section }) {
  const layout = section?.layout_variant ?? 'centered'
  const isCentered = layout === 'centered'
  return (
    <SectionWithBackground section={section} baseClass={`relative ${sectionSpacing} bg-dark-800`}>
      <div className={`${containerClass} ${isCentered ? 'text-center' : ''}`}>
        <div className={isCentered ? 'max-w-4xl mx-auto space-y-6' : 'space-y-6'}>
          {renderBlocks(section)}
        </div>
      </div>
    </SectionWithBackground>
  )
}

export function LandingLogos({ section }) {
  return (
    <SectionWithBackground section={section} baseClass={`${sectionSpacing} border-t border-dark-700 bg-dark-900`}>
      <div className={containerClass}>
        <div className="space-y-8">
          {renderBlocks(section)}
        </div>
      </div>
    </SectionWithBackground>
  )
}

export function LandingServices({ section }) {
  return (
    <SectionWithBackground section={section} baseClass={`${sectionSpacing} bg-dark-800`}>
      <div className={containerClass}>
        <div className="space-y-8 max-w-3xl">
          {renderBlocks(section)}
        </div>
      </div>
    </SectionWithBackground>
  )
}

export function LandingAbout({ section }) {
  return (
    <SectionWithBackground section={section} baseClass={`${sectionSpacing} border-t border-dark-700 bg-dark-900`}>
      <div className={containerClass}>
        <div className="max-w-3xl space-y-6">
          {renderBlocks(section)}
        </div>
      </div>
    </SectionWithBackground>
  )
}

export function LandingMetrics({ section }) {
  const blocks = (section?.blocks ?? []).filter((b) => b.type === 'counter')
  return (
    <SectionWithBackground section={section} baseClass={`${sectionSpacing} bg-dark-800 border-t border-dark-700`}>
      <div className={containerClass}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
          {blocks.map((block) => (
            <LandingBlockRenderer key={block.id} block={block} withAnimation />
          ))}
        </div>
      </div>
    </SectionWithBackground>
  )
}

export function LandingInfluencerHighlight({ section }) {
  return (
    <SectionWithBackground section={section} baseClass={`${sectionSpacing} bg-dark-900`}>
      <div className={containerClass}>
        <div className="max-w-3xl mx-auto space-y-8 text-center">
          {renderBlocks(section)}
        </div>
      </div>
    </SectionWithBackground>
  )
}

export function LandingTestimonials({ section }) {
  const blocks = section?.blocks ?? []
  const paragraphs = blocks.filter((b) => b.type === 'paragraph')
  return (
    <SectionWithBackground section={section} baseClass={`${sectionSpacing} border-t border-dark-700 bg-dark-800`}>
      <div className={containerClass}>
        <div className="space-y-10 max-w-3xl mx-auto">
          {blocks.filter((b) => b.type === 'headline').map((b) => (
            <LandingBlockRenderer key={b.id} block={b} />
          ))}
          <div className="space-y-6">
            {paragraphs.map((block) => (
              <blockquote key={block.id} className="text-gray-400 text-lg border-l-4 border-primary-500 pl-6">
                <LandingBlockRenderer block={block} />
              </blockquote>
            ))}
          </div>
        </div>
      </div>
    </SectionWithBackground>
  )
}

export function LandingCaseStudies({ section }) {
  return (
    <SectionWithBackground section={section} baseClass={`${sectionSpacing} bg-dark-900`}>
      <div className={containerClass}>
        <div className="space-y-10">
          {renderBlocks(section)}
        </div>
      </div>
    </SectionWithBackground>
  )
}

export function LandingCTA({ section }) {
  return (
    <SectionWithBackground section={section} baseClass={`${sectionSpacing} bg-gradient-to-br from-primary-900/30 to-dark-800 border-t border-dark-700`}>
      <div className={containerClass}>
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {renderBlocks(section)}
        </div>
      </div>
    </SectionWithBackground>
  )
}

export function LandingFooterCTA({ section }) {
  return (
    <SectionWithBackground section={section} baseClass="py-12 bg-dark-800 border-t border-dark-700">
      <div className={containerClass}>
        <div className="flex flex-wrap justify-center items-center gap-6">
          {renderBlocks(section)}
        </div>
      </div>
    </SectionWithBackground>
  )
}

const SECTION_MAP = {
  hero: LandingHero,
  logos: LandingLogos,
  services: LandingServices,
  about: LandingAbout,
  metrics: LandingMetrics,
  influencer_highlight: LandingInfluencerHighlight,
  testimonials: LandingTestimonials,
  case_studies: LandingCaseStudies,
  cta: LandingCTA,
  footer_cta: LandingFooterCTA,
}

export function getLandingSectionComponent(type) {
  const t = (type || '').toLowerCase().replace(/\s+/g, '_')
  return SECTION_MAP[t] || null
}
