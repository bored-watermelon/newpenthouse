import type { Sticker } from '../lib/footerAssets'
import { useDrag } from '../lib/useDrag'

export default function StickerItem({ s }: { s: Sticker }) {
  const { pos, z, dragging, handlers } = useDrag()
  const c = s.crop
  return (
    <div
      className={`sticker${dragging ? ' is-dragging' : ''}`}
      style={{
        left: `${s.x}%`,
        top: `${s.y}%`,
        width: `${s.w}%`,
        zIndex: z,
        transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${s.rot + (dragging ? 4 : 0)}deg) scale(${dragging ? 1.08 : 1})`,
      }}
      {...handlers}
    >
      {c ? (
        <div
          className="sticker__crop"
          style={{
            aspectRatio: `${c.w} / ${c.h}`,
            backgroundImage: `url(${s.src})`,
            backgroundSize: `${(c.W / c.w) * 100}% ${(c.H / c.h) * 100}%`,
            backgroundPosition: `${(c.x / (c.W - c.w)) * 100}% ${(c.y / (c.H - c.h)) * 100}%`,
          }}
        />
      ) : (
        <img src={s.src} alt="" draggable={false} />
      )}
    </div>
  )
}
