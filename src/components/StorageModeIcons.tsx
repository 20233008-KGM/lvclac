type StorageModeIconProps = {
  className?: string
}

export function LocalComputerIcon({ className }: StorageModeIconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden="true">
      <rect
        className="draft-save-slot__fill"
        x="7.4"
        y="6.2"
        width="13.2"
        height="10.8"
        rx="1.4"
      />
      <rect x="6.1" y="4.9" width="15.8" height="13.4" rx="1.9" fill="none" />
      <line x1="10.4" y1="22.1" x2="17.6" y2="22.1" />
      <line x1="14" y1="18.4" x2="14" y2="22.1" />
    </svg>
  )
}

export function CloudIcon({ className }: StorageModeIconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden="true">
      <path
        className="draft-save-slot__fill"
        d="M8.4 21h11.2a5.05 5.05 0 0 0 .4-10.1A6.45 6.45 0 0 0 7.7 12.8 4.25 4.25 0 0 0 8.4 21z"
      />
      <path
        d="M8.4 21h11.2a5.05 5.05 0 0 0 .4-10.1A6.45 6.45 0 0 0 7.7 12.8 4.25 4.25 0 0 0 8.4 21z"
        fill="none"
      />
    </svg>
  )
}
