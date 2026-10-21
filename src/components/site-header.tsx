'use client'

import * as React from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { BRAND } from '@/lib/brand'

export type ViewKey = 'home' | 'gallery'

interface SiteHeaderProps {
  view: ViewKey
  onNavigate: (view: ViewKey) => void
}

export function SiteHeader({ view, onNavigate }: SiteHeaderProps) {
  const handleNav = React.useCallback(
    (next: ViewKey) => (e: React.MouseEvent) => {
      e.preventDefault()
      onNavigate(next)
    },
    [onNavigate]
  )

  return (
    <header className="site-header">
      <div className="nav-shell page-shell">
        <a
          className="brand focus-shell"
          href="#"
          aria-label={`${BRAND.name} — Inicio`}
          onClick={handleNav('home')}
        >
          {BRAND.name}
        </a>
        <nav aria-label="Navegación principal">
          <a
            href="#"
            data-active={view === 'home' ? 'true' : undefined}
            onClick={handleNav('home')}
          >
            Inicio
          </a>
          <a
            href="#explorar"
            data-active={view === 'gallery' ? 'true' : undefined}
            onClick={handleNav('gallery')}
          >
            Explorar
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
