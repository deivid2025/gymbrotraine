'use client'

import { BRAND } from '@/lib/brand'

export function SiteFooter() {
  return (
    <footer className="site-footer page-shell mt-auto">
      <div>
        <p className="footer-title">{BRAND.name}</p>
        <p>Ilustraciones de ejercicios para la comunidad LATAM.</p>
      </div>
      <div className="footer-links">
        <a
          href={BRAND.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Código
        </a>
        <a
          href={BRAND.creatorUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {BRAND.creator}
        </a>
      </div>
      <p>Inspirado en Bryl Lim.</p>
    </footer>
  )
}
