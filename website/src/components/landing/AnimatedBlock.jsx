import { useEffect, useRef, useState } from 'react'

const ANIMATION_CLASSES = {
  none: '',
  fade: 'landing-animate-fade',
  slideUp: 'landing-animate-slide-up',
  slideLeft: 'landing-animate-slide-left',
  slideRight: 'landing-animate-slide-right',
  zoom: 'landing-animate-zoom',
  stagger: 'landing-animate-fade',
}

export default function AnimatedBlock({ block, children, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const config = block?.animation_config || {}
  const type = (config.type || 'fade').toLowerCase().replace(/\s/g, '')
  const trigger = config.trigger === 'onLoad' ? 'onLoad' : 'onScroll'
  const delay = Number(config.delay) || 0
  const duration = Number(config.duration) || 0.5
  const animClass = ANIMATION_CLASSES[type] || ANIMATION_CLASSES.fade

  useEffect(() => {
    if (trigger === 'onLoad') {
      const t = setTimeout(() => setVisible(true), 50)
      return () => clearTimeout(t)
    }
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisible(true)
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [trigger])

  const style = {
    transitionDuration: `${duration}s`,
    transitionDelay: `${delay}ms`,
  }

  return (
    <div
      ref={ref}
      className={`landing-block ${animClass} ${visible ? 'landing-visible' : 'landing-invisible'} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
