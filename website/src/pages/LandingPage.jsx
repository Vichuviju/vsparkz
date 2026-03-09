import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { getLanding, getPageBySlug } from '../lib/api'
import LandingSectionRenderer from '../components/landing/LandingSectionRenderer'
import BlockRenderer from '../components/BlockRenderer'
import DefaultLanding from '../components/DefaultLanding'

export default function LandingPage() {
  const [data, setData] = useState({ template: null, sections: [], fallbackPage: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getLanding()
      .then((res) => {
        if (res.template && res.sections?.length > 0) {
          setData({ template: res.template, sections: res.sections, fallbackPage: null })
        } else {
          return getPageBySlug('home').then((page) => {
            setData({ template: null, sections: [], fallbackPage: page })
          })
        }
      })
      .catch((err) => {
        if (err.response?.status === 404 || err.message?.includes('landing')) {
          getPageBySlug('home')
            .then((page) => setData({ template: null, sections: [], fallbackPage: page }))
            .catch(() => setError('Failed to load page'))
        } else {
          setError(err.response?.data?.message || 'Failed to load')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="shimmer-bg rounded-vsparkz-lg h-12 w-48 flex items-center justify-center">
          <span className="text-accent text-sm font-medium">Loading...</span>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-text-primary">{error}</h1>
      </div>
    )
  }

  /* Landing template + sections (from API) */
  if (data.template && data.sections?.length > 0) {
    const template = data.template
    const sections = data.sections
    const metaTitle = template.name ? `${template.name} | V-Sparkz` : 'V-Sparkz'
    const metaDesc = template.description || 'AI-powered digital marketing platform.'
    return (
      <>
        <Helmet>
          <title>{metaTitle}</title>
          <meta name="description" content={metaDesc} />
        </Helmet>
        <div className="landing-page">
          {sections.map((section) => (
            <LandingSectionRenderer key={section.id} section={section} />
          ))}
        </div>
      </>
    )
  }
  /* Fallback: CMS page (home) when no active landing template */
  if (data.fallbackPage?.sections?.length > 0) {
    const page = data.fallbackPage
    const metaTitle = page.meta_title || page.title || 'V-Sparkz'
    const metaDesc = page.meta_description || ''
    return (
      <>
        <Helmet>
          <title>{metaTitle}</title>
          {metaDesc && <meta name="description" content={metaDesc} />}
        </Helmet>
        <div>
          {page.sections.map((section) => (
            <BlockRenderer key={section.id} section={section} />
          ))}
        </div>
      </>
    )
  }
  if (data.fallbackPage && !data.fallbackPage.sections?.length && (data.fallbackPage.content || data.fallbackPage.title)) {
    const page = data.fallbackPage
    return (
      <>
        <Helmet>
          <title>{page.meta_title || page.title || 'V-Sparkz'}</title>
        </Helmet>
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold text-text-primary">{page.title || 'Welcome'}</h1>
          {page.content && (
            <div className="mt-6 prose prose-invert max-w-none text-text-muted" dangerouslySetInnerHTML={{ __html: page.content }} />
          )}
        </div>
      </>
    )
  }
  /* Premium default landing: Hero, Features, Pricing, Testimonials, CTA */
  return (
    <>
      <Helmet>
        <title>V-Sparkz | AI-Powered Digital Marketing Platform</title>
        <meta name="description" content="Scale brands with intelligent campaigns. SEO, ads, influencer marketing, and analytics in one platform." />
      </Helmet>
      <DefaultLanding />
    </>
  )
}
