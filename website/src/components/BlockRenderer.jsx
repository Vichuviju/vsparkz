import Hero from './blocks/Hero'
import Grid from './blocks/Grid'
import Carousel from './blocks/Carousel'
import CTA from './blocks/CTA'
import Stats from './blocks/Stats'
import Testimonial from './blocks/Testimonial'
import CaseStudyPreview from './blocks/CaseStudyPreview'
import VideoSection from './blocks/VideoSection'
import FeatureHighlights from './blocks/FeatureHighlights'
import Metrics from './blocks/Metrics'
import Timeline from './blocks/Timeline'

const SECTION_COMPONENTS = {
  hero: Hero,
  grid: Grid,
  carousel: Carousel,
  cta: CTA,
  stats: Stats,
  testimonial: Testimonial,
  case_study_preview: CaseStudyPreview,
  video: VideoSection,
  feature_highlights: FeatureHighlights,
  metrics: Metrics,
  timeline: Timeline,
}

export default function BlockRenderer({ section }) {
  const type = (section.type || '').toLowerCase().replace(/\s+/g, '_')
  const Component = SECTION_COMPONENTS[type]
  if (!Component) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="rounded-lg border border-dark-700 p-6 text-gray-500">
            Unknown section type: {section.type}
          </div>
        </div>
      </section>
    )
  }
  return <Component section={section} />
}
