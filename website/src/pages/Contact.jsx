import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { submitContact } from '../lib/api'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', subject: '', message: '' })
  const [status, setStatus] = useState(null) // 'success' | 'error' | null
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
      await submitContact({ ...form, source: 'contact' })
      setStatus('success')
      setForm({ name: '', email: '', phone: '', company: '', subject: '', message: '' })
    } catch (err) {
      setStatus('error')
      setErrorMessage(err.response?.data?.message || err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Contact | Vsparkz Digital</title>
        <meta name="description" content="Get in touch with Vsparkz Digital." />
      </Helmet>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
        <p className="text-gray-400 mb-8">We’d love to hear from you. Send us a message and we’ll get back soon.</p>
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
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Company</label>
            <input
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Your company"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Brief subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Your message"
            />
          </div>
          {status === 'success' && (
            <p className="text-green-400 text-sm">Thank you. We will get back to you soon.</p>
          )}
          {status === 'error' && (
            <p className="text-red-400 text-sm">{errorMessage}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </>
  )
}
