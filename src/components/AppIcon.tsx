import { cn } from "@/lib/utils"

interface AppIconProps {
  size?: number
  className?: string
}

/** آیکون رسمی Atlas — از public/atlas-icon.png */
export function AppIcon({ size = 20, className }: AppIconProps): React.JSX.Element {
  return (
    <img
      src="/atlas-icon.png"
      width={size}
      height={size}
      alt="Atlas"
      draggable={false}
      className={cn("rounded-md object-contain", className)}
    />
  )
}
