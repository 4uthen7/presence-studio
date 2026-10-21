import { useMemo } from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import type { Persona, WidgetBlock, WidgetConfig } from '../../../shared/types'
import { makeArtwork } from '../lib/art'
import { cn } from '../lib/cn'
import { Avatar } from './ui'

function blockTone(block: WidgetBlock): string {
  return cn(
    'w-block',
    `w-${block.kind}`,
    block.tone === 'accent' && 'tone-accent',
    block.tone === 'muted' && 'tone-muted',
    block.tone === 'white' && 'tone-white',
    block.align === 'center' && 'align-center'
  )
}

function widthStyle(block: WidgetBlock): React.CSSProperties {
  return { gridColumn: `span ${block.span}` }
}

function BlockContent({ block }: { block: WidgetBlock }): React.JSX.Element | null {
  switch (block.kind) {
    case 'eyebrow':
      return <span className="w-eyebrow-text">{block.value || 'EYEBROW'}</span>
    case 'title':
      return <span className="w-title-text">{block.value || 'Title'}</span>
    case 'subtitle':
      return <span className="w-subtitle-text">{block.value || 'Subtitle'}</span>
    case 'text':
      return <p className="w-text-text">{block.value || 'Text'}</p>
    case 'badge':
      return <span className="w-badge-text">{block.value || 'BADGE'}</span>
    case 'image':
      return block.value ? (
        <img className="w-image-img" src={block.value} alt="" draggable={false} />
      ) : (
        <div className="w-image-placeholder">
          <Sparkles size={16} />
          <span>Image URL</span>
        </div>
      )
    case 'avatar':
      return <Avatar src={block.value} name="Widget" size={42} />
    case 'stat':
      return (
        <div className="w-stat-inner">
          <span className="w-stat-label">{block.label || 'STAT'}</span>
          <span className="w-stat-value">{block.value || '—'}</span>
        </div>
      )
    case 'progress': {
      const value = Math.max(0, Math.min(100, Number(block.value) || 0))
      return (
        <div className="w-progress-inner">
          <div className="w-progress-head">
            <span>{block.label || 'Progress'}</span>
            <span>{value}%</span>
          </div>
          <div className="w-progress-track">
            <i style={{ width: `${value}%` }} />
          </div>
        </div>
      )
    }
    case 'link':
      return (
        <span className="w-link-inner">
          <span>{block.label || block.value || 'Link'}</span>
          <ArrowUpRight size={12} />
        </span>
      )
    case 'divider':
      return <span className="w-divider-line" />
    default:
      return null
  }
}

export function WidgetPreview({
  widget,
  persona,
  layout,
  showChrome = true
}: {
  widget: WidgetConfig
  persona: Persona
  layout?: 'hero' | 'contained'
  showChrome?: boolean
}): React.JSX.Element {
  const mode = layout ?? widget.layout
  const accent = widget.accent || persona.accent
  const hero = widget.blocks.filter((block) => block.zone === 'hero')
  const body = widget.blocks.filter((block) => block.zone === 'body')
  const heroImageBlock = hero.find((block) => block.kind === 'image' && block.value)
  const fallbackArt = useMemo(
    () => makeArtwork(`${persona.handle}-widget-${accent}`, accent, '#ff7ac8'),
    [persona.handle, accent]
  )
  const heroImage = heroImageBlock?.value || widget.heroImage || fallbackArt

  const heroText = (
    <div className="widget-hero-copy">
      {hero
        .filter((block) => block.kind !== 'image')
        .map((block) => (
          <div key={block.id} className={blockTone(block)}>
            <BlockContent block={block} />
          </div>
        ))}
    </div>
  )

  return (
    <div className="widget-preview">
      {showChrome && (
        <div className="preview-topline">
          <span className="preview-label">WIDGET PREVIEW</span>
          <span className="pill mono">{mode === 'hero' ? 'HERO' : 'CONTAINED'}</span>
        </div>
      )}

      <div className={cn('widget-card', mode)} style={{ ['--widget-accent' as string]: accent }}>
        {mode === 'hero' ? (
          <>
            <div
              className="widget-hero"
              style={{
                backgroundImage: heroImage
                  ? `linear-gradient(180deg, rgba(6,7,12,0.05) 20%, rgba(6,7,12,0.88) 100%), url("${heroImage}")`
                  : `linear-gradient(160deg, ${accent}66, #0a0c13 78%)`
              }}
            >
              <div className="widget-hero-topline">
                <span className="widget-hero-brand">
                  <span className="dot live" />
                  {widget.metadata.find((entry) => entry.key === 'source')?.value || 'PRESENCE'}
                </span>
              </div>
              {heroText}
              <div className="widget-hero-corner">
                <Avatar src={persona.avatar} name={persona.name} size={22} />
              </div>
            </div>
            <div className="widget-body">
              {body.length === 0 ? (
                <div className="widget-empty-body">ブロックをここにドラッグ</div>
              ) : (
                body.map((block) => (
                  <div key={block.id} className={blockTone(block)} style={widthStyle(block)}>
                    <BlockContent block={block} />
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="widget-contained-top">
              <div
                className="widget-contained-media"
                style={{
                  backgroundImage: heroImage ? `url("${heroImage}")` : `linear-gradient(150deg, ${accent}, #0b0d15)`
                }}
              >
                <div className="widget-contained-media-shade" />
              </div>
              <div className="widget-contained-copy">
                <span className="widget-hero-brand">
                  <span className="dot live" />
                  {widget.metadata.find((entry) => entry.key === 'source')?.value || 'PRESENCE'}
                </span>
                {heroText}
              </div>
            </div>
            <div className="widget-body">
              {body.length === 0 ? (
                <div className="widget-empty-body">ブロックをここにドラッグ</div>
              ) : (
                body.map((block) => (
                  <div key={block.id} className={blockTone(block)} style={widthStyle(block)}>
                    <BlockContent block={block} />
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {showChrome && (
        <p className="preview-note">
          レイアウトはプレビューです。Discord 側の見た目は Developer Portal の Widget エディタで公開されます。
        </p>
      )}
    </div>
  )
}
