'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  // Render a stable, hydration-safe placeholder until mounted.
  if (!mounted) {
    return (
      <span
        className="theme-toggle"
        aria-hidden="true"
        style={{ visibility: 'hidden' }}
      />
    )
  }

  const isDark = resolvedTheme !== 'light'

  return (
    <button
      type="button"
      className="theme-toggle focus-shell"
      aria-label={isDark ? 'Activar tema claro' : 'Activar tema oscuro'}
      title={isDark ? 'Activar tema claro' : 'Activar tema oscuro'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  )
}
