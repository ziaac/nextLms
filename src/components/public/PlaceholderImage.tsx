import { cn } from '@/lib/utils'

interface PlaceholderImageProps {
  className?: string
  label?: string
  variant?: 'school' | 'news' | 'gallery' | 'slider' | 'person' | 'ai' | 'qr' | 'worksheet'
}

const ICONS = {
  school: (
    <g>
      <rect x="8" y="20" width="48" height="36" rx="2" fill="none" strokeWidth="2"/>
      <polygon points="32,6 6,22 58,22" fill="none" strokeWidth="2"/>
      <rect x="22" y="36" width="10" height="20" rx="1" fill="none" strokeWidth="1.5"/>
      <rect x="32" y="36" width="10" height="20" rx="1" fill="none" strokeWidth="1.5"/>
      <rect x="12" y="28" width="8" height="8" rx="1" fill="none" strokeWidth="1.5"/>
      <rect x="44" y="28" width="8" height="8" rx="1" fill="none" strokeWidth="1.5"/>
      <line x1="32" y1="6" x2="32" y2="2" strokeWidth="2"/>
      <circle cx="32" cy="2" r="2" fill="currentColor"/>
    </g>
  ),
  news: (
    <g>
      <rect x="10" y="12" width="44" height="40" rx="3" fill="none" strokeWidth="2"/>
      <rect x="16" y="18" width="32" height="10" rx="1.5" fill="none" strokeWidth="1.5"/>
      <line x1="16" y1="34" x2="48" y2="34" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="40" x2="40" y2="40" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="46" x2="36" y2="46" strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  ),
  gallery: (
    <g>
      <rect x="8" y="14" width="48" height="36" rx="3" fill="none" strokeWidth="2"/>
      <circle cx="22" cy="26" r="5" fill="none" strokeWidth="1.5"/>
      <polyline points="8,38 20,28 30,36 40,26 56,38" fill="none" strokeWidth="1.5" strokeLinejoin="round"/>
    </g>
  ),
  slider: (
    <g>
      <rect x="4" y="16" width="56" height="32" rx="3" fill="none" strokeWidth="2"/>
      <circle cx="20" cy="32" r="6" fill="none" strokeWidth="1.5"/>
      <polyline points="4,40 16,30 26,38 38,26 60,38" fill="none" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="28" cy="52" r="2" fill="currentColor" opacity="0.4"/>
      <circle cx="32" cy="52" r="2" fill="currentColor"/>
      <circle cx="36" cy="52" r="2" fill="currentColor" opacity="0.4"/>
    </g>
  ),
  person: (
    <g>
      <circle cx="32" cy="22" r="10" fill="none" strokeWidth="2"/>
      <path d="M10,56 C10,44 54,44 54,56" fill="none" strokeWidth="2" strokeLinecap="round"/>
    </g>
  ),
  ai: (
    <g>
      <circle cx="32" cy="32" r="18" fill="none" strokeWidth="2"/>
      <circle cx="32" cy="32" r="6" fill="none" strokeWidth="1.5"/>
      <line x1="32" y1="14" x2="32" y2="22" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="42" x2="32" y2="50" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="32" x2="22" y2="32" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="42" y1="32" x2="50" y2="32" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19.5" y1="19.5" x2="25.5" y2="25.5" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="38.5" y1="38.5" x2="44.5" y2="44.5" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="44.5" y1="19.5" x2="38.5" y2="25.5" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="25.5" y1="38.5" x2="19.5" y2="44.5" strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  ),
  qr: (
    <g>
      <rect x="10" y="10" width="18" height="18" rx="2" fill="none" strokeWidth="2"/>
      <rect x="14" y="14" width="10" height="10" rx="1" fill="none" strokeWidth="1.5"/>
      <rect x="36" y="10" width="18" height="18" rx="2" fill="none" strokeWidth="2"/>
      <rect x="40" y="14" width="10" height="10" rx="1" fill="none" strokeWidth="1.5"/>
      <rect x="10" y="36" width="18" height="18" rx="2" fill="none" strokeWidth="2"/>
      <rect x="14" y="40" width="10" height="10" rx="1" fill="none" strokeWidth="1.5"/>
      <line x1="36" y1="36" x2="36" y2="42" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="36" y1="48" x2="36" y2="54" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="42" y1="36" x2="54" y2="36" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="42" y1="42" x2="54" y2="42" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="48" y1="48" x2="54" y2="48" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="42" y1="54" x2="48" y2="54" strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  ),
  worksheet: (
    <g>
      <rect x="10" y="8" width="44" height="48" rx="3" fill="none" strokeWidth="2"/>
      <rect x="16" y="16" width="20" height="8" rx="1.5" fill="none" strokeWidth="1.5"/>
      <circle cx="40" cy="20" r="4" fill="none" strokeWidth="1.5"/>
      <line x1="16" y1="32" x2="48" y2="32" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="20" cy="40" r="3" fill="none" strokeWidth="1.5"/>
      <line x1="26" y1="40" x2="48" y2="40" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="20" cy="48" r="3" fill="none" strokeWidth="1.5"/>
      <line x1="26" y1="48" x2="40" y2="48" strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  ),
}

export function PlaceholderImage({
  className,
  label,
  variant = 'school',
}: PlaceholderImageProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-3',
      'bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-gray-800 dark:to-gray-900',
      className,
    )}>
      <svg
        viewBox="0 0 64 64"
        className="w-12 h-12 text-emerald-300 dark:text-emerald-700"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICONS[variant]}
      </svg>
      {label && (
        <p className="text-xs text-emerald-400 dark:text-emerald-600 font-medium text-center px-2">
          {label}
        </p>
      )}
    </div>
  )
}
