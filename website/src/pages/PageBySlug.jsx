import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getPageBySlug } from '../lib/api'
import BlockRenderer from '../components/BlockRenderer'

function pathToSlug(pathname) {
  const p = pathname.replace(/^\/+|\/+$/g, '')
  return p || 'home'
}

export default function PageBySlug() {
  const location = useLocation()
  const slug = pathToSlug(location.pathname)
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getPageBySlug(slug)
      .then(setPage)
      .catch((err) => setError(err.response?.status === 404 ? 'Page not found' : 'Failed to load page'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-primary-400">Loading...</div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-300">{error}</h1>
        <p className="mt-2 text-gray-500">The page you requested may not exist or is not published.</p>
      </div>
    )
  }
  if (!page) return null

  const metaTitle = page.meta_title || page.title || 'Vsparkz Digital'
  const metaDesc = page.meta_description || ''
  const ogImage = page.og_image ? (page.og_image.startsWith('http') ? page.og_image : `${import.meta.env.VITE_API_URL || ''}${page.og_image}`) : null

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        {metaDesc && <meta name="description" content={metaDesc} />}
        {page.meta_keywords && <meta name="keywords" content={page.meta_keywords} />}
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:title" content={metaTitle} />
        {metaDesc && <meta property="og:description" content={metaDesc} />}
      </Helmet>
      <div>
        {page.sections && page.sections.length > 0 ? (
          page.sections.map((section) => (
            <BlockRenderer key={section.id} section={section} />
          ))
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-16">
            <h1 className="text-3xl font-bold text-white">{page.title || 'Welcome'}</h1>
            {page.content && (
              <div className="mt-6 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
            )}
          </div>
        )}
      </div>
    </>
  )
}
