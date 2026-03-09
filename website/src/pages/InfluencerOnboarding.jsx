import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { submitInfluencerOnboarding } from '../lib/api'

export default function InfluencerOnboarding() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    platform: '',
    followers: '',
    engagement_rate: '',
    language: '',
    location: '',
    category: '',
  })
  const [status, setStatus] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setStatus(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)
    setErrorMessage('')
    try {
      await submitInfluencerOnboarding({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        platform: form.platform || undefined,
        followers: form.followers ? parseInt(form.followers, 10) : undefined,
        engagement_rate: form.engagement_rate ? parseFloat(form.engagement_rate) : undefined,
        language: form.language || undefined,
        location: form.location || undefined,
        category: form.category || undefined,
      })
      setStatus('success')
      setForm({ name: '', email: '', phone: '', platform: '', followers: '', engagement_rate: '', language: '', location: '', category: '' })
    } catch (err) {
      setStatus('error')
      setErrorMessage(err.response?.data?.message || (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : 'Something went wrong. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Influencer Sign-up | Vsparkz Digital</title>
        <meta name="description" content="Join Vsparkz Digital as an influencer partner." />
      </Helmet>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white mb-2">Influencer Sign-up</h1>
        <p className="text-gray-400 mb-8">Register as an influencer partner. We’ll review your profile and get in touch.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Your name or handle"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Platform</label>
            <input
              type="text"
              name="platform"
              value={form.platform}
              onChange={handleChange}
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. Instagram, YouTube, TikTok"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Followers (approx.)</label>
            <input
              type="number"
              name="followers"
              value={form.followers}
              onChange={handleChange}
              min="0"
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. 50000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Engagement rate (%)</label>
            <input
              type="number"
              name="engagement_rate"
              value={form.engagement_rate}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. 3.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Language</label>
            <input
              type="text"
              name="language"
              value={form.language}
              onChange={handleChange}
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. English"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="City or region"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Category / Niche</label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. Fashion, Tech, Fitness"
            />
          </div>
          {status === 'success' && (
            <p className="text-green-400 text-sm">Thank you for registering. We will be in touch.</p>
          )}
          {status === 'error' && (
            <p className="text-red-400 text-sm">{errorMessage}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      </div>
    </>
  )
}
