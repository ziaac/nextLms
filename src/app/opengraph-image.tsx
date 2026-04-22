import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const alt         = 'Sistem Manajemen Pembelajaran MAN 2 Kota Makassar'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BG_URL   = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_back_login_mobile.webp'
const LOGO_URL = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_logoman-150h.png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* ── Background image ── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BG_URL}
          alt=""
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />

        {/* ── Multi-stop dark overlay ── */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.20) 100%)',
          }}
        />

        {/* ── Emerald tint strip on left ── */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '6px',
            height: '100%',
            background: 'linear-gradient(to bottom, #34d399, #059669)',
          }}
        />

        {/* ── Content ── */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '64px 80px',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Top: Logo + school tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              alt="Logo MAN 2"
              style={{ height: '56px', objectFit: 'contain' }}
            />
            <div
              style={{
                width: '1px',
                height: '40px',
                background: 'rgba(255,255,255,0.25)',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 400,
              }}
            >
              lms.man2kotamakassar.sch.id
            </span>
          </div>

          {/* Bottom: main title block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            {/* Eyebrow */}
            <span
              style={{
                fontSize: '16px',
                color: '#6ee7b7',
                letterSpacing: '0.20em',
                textTransform: 'uppercase',
                fontWeight: 500,
                marginBottom: '16px',
              }}
            >
              Sistem Manajemen Pembelajaran
            </span>

            {/* Main title */}
            <span
              style={{
                fontSize: '64px',
                color: '#ffffff',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
              }}
            >
              MAN 2 Kota
            </span>
            <span
              style={{
                fontSize: '64px',
                color: '#ffffff',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
                marginBottom: '28px',
              }}
            >
              Makassar
            </span>

            {/* Accent bar */}
            <div
              style={{
                width: '72px',
                height: '4px',
                background: 'linear-gradient(to right, #34d399, #059669)',
                borderRadius: '9999px',
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
