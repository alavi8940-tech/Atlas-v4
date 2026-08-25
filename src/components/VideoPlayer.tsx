/**
 * AtlasVideoPlayer — پخشکنندهٔ ویدئو بر پایهٔ @vidstack/react آرسنال
 * لایهٔ پیشفرض ویداستک + پسزمینهٔ شیشه‌ای Atlas
 */
import { useMemo } from 'react'
import { MediaPlayer, MediaProvider, Poster, type MediaPlayerInstance } from '@vidstack/react'
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from '@vidstack/react/player/layouts/default'
import '@vidstack/react/player/styles/default/theme.css'
import '@vidstack/react/player/styles/default/layouts/video.css'
import { useRef } from 'react'

export interface AtlasVideoPlayerProps {
  /** آدرس ویدئو — http(s) یا data-uri */
  src: string
  title?: string
  poster?: string
}

export function AtlasVideoPlayer({ src, title, poster }: AtlasVideoPlayerProps): React.JSX.Element {
  const playerRef = useRef<MediaPlayerInstance>(null)

  // عنوان پیشفرض از نام فایل
  const resolvedTitle = useMemo(() => title ?? 'ویدئو', [title])

  return (
    <div
      className="glass my-1 w-full max-w-xl overflow-hidden rounded-2xl"
      style={{ borderColor: 'var(--glass-border)' }}
      data-slot="atlas-video-player"
    >
      <MediaPlayer
        ref={playerRef}
        src={src}
        title={resolvedTitle}
        crossOrigin
        playsInline
        load="visible"
        posterLoad="eager"
        className="w-full"
      >
        <MediaProvider>
          <DefaultVideoLayout icons={defaultLayoutIcons} thumbnails={poster}>
            {poster ? (
              <Poster
                className="vds-poster absolute inset-0 h-full w-full translate-z-0 object-cover"
                src={poster}
                alt={resolvedTitle}
              />
            ) : null}
          </DefaultVideoLayout>
        </MediaProvider>
      </MediaPlayer>
    </div>
  )
}

export default AtlasVideoPlayer
