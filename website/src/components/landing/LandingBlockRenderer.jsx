import AnimatedBlock from './AnimatedBlock'

function BlockHeadline({ block }) {
  const text = block?.content?.text ?? ''
  const align = block?.alignment === 'center' ? 'text-center' : block?.alignment === 'right' ? 'text-right' : 'text-left'
  return <h2 className={`text-3xl md:text-4xl font-bold text-white ${align}`}>{text}</h2>
}

function BlockSubheadline({ block }) {
  const text = block?.content?.text ?? ''
  const align = block?.alignment === 'center' ? 'text-center' : block?.alignment === 'right' ? 'text-right' : 'text-left'
  return <p className={`text-xl text-gray-400 max-w-2xl ${align}`}>{text}</p>
}

function BlockParagraph({ block }) {
  const text = block?.content?.text ?? ''
  const align = block?.alignment === 'center' ? 'text-center mx-auto' : block?.alignment === 'right' ? 'text-right ml-auto' : 'text-left'
  return <p className={`text-gray-400 leading-relaxed max-w-xl ${align}`}>{text}</p>
}

function BlockCTA({ block }) {
  const c = block?.content ?? {}
  const primary = c.label && c.url
  const secondary = c.secondary_label && c.secondary_url
  const align = block?.alignment === 'center' ? 'justify-center' : block?.alignment === 'right' ? 'justify-end' : 'justify-start'
  return (
    <div className={`flex flex-wrap gap-4 ${align}`}>
      {primary && (
        <a
          href={c.url}
          className="inline-flex items-center rounded-lg bg-primary-500 px-6 py-3 text-base font-medium text-white hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-dark-900 transition shadow-lg shadow-primary-500/25 hover:shadow-primary-400/30"
        >
          {c.label}
        </a>
      )}
      {secondary && (
        <a
          href={c.secondary_url}
          className="inline-flex items-center rounded-lg border border-gray-500 px-6 py-3 text-base font-medium text-gray-300 hover:bg-white/5 hover:border-gray-400 transition"
        >
          {c.secondary_label}
        </a>
      )}
    </div>
  )
}

function BlockImage({ block }) {
  const url = block?.media?.url
  const alt = block?.content?.alt ?? block?.media?.filename ?? ''
  const ratio = block?.aspect_ratio === '16:9' ? 'aspect-video' : block?.aspect_ratio === '1:1' ? 'aspect-square' : block?.aspect_ratio === '4:5' ? 'aspect-[4/5]' : 'aspect-video'
  const fit = block?.object_fit === 'contain' ? 'object-contain' : 'object-cover'
  const align = block?.alignment === 'center' ? 'mx-auto' : block?.alignment === 'right' ? 'ml-auto' : ''
  const objectPosition = block?.content?.object_position ?? 'center'
  const maxWidth = block?.content?.max_width === '4xl' ? 'max-w-4xl' : block?.content?.max_width === '3xl' ? 'max-w-3xl' : block?.content?.max_width === '2xl' ? 'max-w-2xl' : 'w-full'
  if (!url) return null
  return (
    <div className={`overflow-hidden rounded-xl ${ratio} ${align} ${maxWidth}`}>
      <img
        src={url}
        alt={alt}
        className={`w-full h-full ${fit}`}
        style={{ objectPosition }}
      />
    </div>
  )
}

function BlockVideo({ block }) {
  const url = block?.media?.url
  const ratio = block?.aspect_ratio === '16:9' ? 'aspect-video' : block?.aspect_ratio === '1:1' ? 'aspect-square' : 'aspect-video'
  const align = block?.alignment === 'center' ? 'mx-auto' : block?.alignment === 'right' ? 'ml-auto' : ''
  const maxWidth = block?.content?.max_width === '4xl' ? 'max-w-4xl' : block?.content?.max_width === '3xl' ? 'max-w-3xl' : block?.content?.max_width === '2xl' ? 'max-w-2xl' : 'w-full'
  if (!url) return null
  const isVideo = /\.(mp4|webm|ogg)$/i.test(url) || block?.media?.mime_type?.startsWith?.('video/')
  return (
    <div className={`overflow-hidden rounded-xl ${ratio} ${align} ${maxWidth}`}>
      {isVideo ? (
        <video src={url} controls className={`w-full h-full ${block?.object_fit === 'contain' ? 'object-contain' : 'object-cover'}`} />
      ) : (
        <iframe src={url} title="Video" className="w-full h-full" allowFullScreen />
      )}
    </div>
  )
}

function BlockLogoGrid({ block }) {
  const logos = block?.content?.logos ?? []
  const items = Array.isArray(logos) ? logos : []
  return (
    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-80">
      {items.map((name, i) => (
        <div
          key={i}
          className="text-gray-500 font-semibold text-sm md:text-base tracking-wider uppercase"
        >
          {typeof name === 'string' ? name : (name?.name ?? name?.alt ?? 'Logo')}
        </div>
      ))}
    </div>
  )
}

function BlockIconList({ block }) {
  const items = block?.content?.items ?? []
  const list = Array.isArray(items) ? items : []
  return (
    <ul className="space-y-3">
      {list.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-gray-400">
          <span className="text-primary-400 mt-0.5">✓</span>
          <span>{typeof item === 'string' ? item : item?.text ?? ''}</span>
        </li>
      ))}
    </ul>
  )
}

function BlockCounter({ block }) {
  const value = block?.content?.value ?? '0'
  const suffix = block?.content?.suffix ?? ''
  const label = block?.content?.label ?? ''
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-primary-400">
        {value}{suffix}
      </div>
      {label && <div className="mt-1 text-sm text-gray-500">{label}</div>}
    </div>
  )
}

const BLOCK_COMPONENTS = {
  headline: BlockHeadline,
  subheadline: BlockSubheadline,
  paragraph: BlockParagraph,
  cta: BlockCTA,
  image: BlockImage,
  video: BlockVideo,
  logo_grid: BlockLogoGrid,
  icon_list: BlockIconList,
  counter: BlockCounter,
}

export default function LandingBlockRenderer({ block, withAnimation = true }) {
  const type = (block?.type || '').toLowerCase().replace(/\s+/g, '_')
  const Component = BLOCK_COMPONENTS[type]
  if (!Component) return null
  const content = <Component block={block} />
  if (withAnimation && block?.animation_config?.type && block.animation_config.type !== 'none') {
    return <AnimatedBlock block={block}>{content}</AnimatedBlock>
  }
  return <div className="landing-block">{content}</div>
}
