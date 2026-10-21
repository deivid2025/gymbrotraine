'use client'

import * as React from 'react'

const STORAGE_KEY = 'workout-favorites-latam'

export interface UseFavoritesResult {
  favorites: string[]
  isReady: boolean
  isFavorite: (slug: string) => boolean
  toggleFavorite: (slug: string) => void
  addFavorite: (slug: string) => void
  removeFavorite: (slug: string) => void
  clearFavorites: () => void
}

function readFromStorage(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeToStorage(list: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* ignore quota errors */
  }
}

export function useFavorites(): UseFavoritesResult {
  const [favorites, setFavorites] = React.useState<string[]>([])
  const [isReady, setIsReady] = React.useState(false)

  // Initial read on mount (client-only, avoids hydration mismatch)
  React.useEffect(() => {
    setFavorites(readFromStorage())
    setIsReady(true)
  }, [])

  // Cross-tab sync via the storage event
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      setFavorites(readFromStorage())
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const isFavorite = React.useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites]
  )

  const addFavorite = React.useCallback((slug: string) => {
    setFavorites((prev) => {
      if (prev.includes(slug)) return prev
      const next = [...prev, slug]
      writeToStorage(next)
      return next
    })
  }, [])

  const removeFavorite = React.useCallback((slug: string) => {
    setFavorites((prev) => {
      if (!prev.includes(slug)) return prev
      const next = prev.filter((s) => s !== slug)
      writeToStorage(next)
      return next
    })
  }, [])

  const toggleFavorite = React.useCallback((slug: string) => {
    setFavorites((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
      writeToStorage(next)
      return next
    })
  }, [])

  const clearFavorites = React.useCallback(() => {
    setFavorites([])
    writeToStorage([])
  }, [])

  return {
    favorites,
    isReady,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
  }
}
