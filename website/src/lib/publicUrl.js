export function publicUrl(path = '') {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${String(path).replace(/^\//, '')}`
}

export function logoUrl(path) {
  if (!path) return publicUrl('logo/logo1.png')
  if (/^https?:\/\//i.test(path) || String(path).startsWith('data:')) return path
  return publicUrl(path)
}
