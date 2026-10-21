'use client'

import * as React from 'react'
import { SiteHeader, type ViewKey } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { HomeView } from '@/components/views/home-view'
import { GalleryView } from '@/components/views/gallery-view'
import { DetailSheet } from '@/components/detail-sheet'
import { useFavorites } from '@/hooks/use-favorites'

export default function Home() {
  // SPA view state — only the `/` route exists.
  const [view, setView] = React.useState<ViewKey>('home')

  // Detail overlay (full-screen slide-up on mobile, centered modal on desktop).
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null)

  // Favorites (localStorage-persisted, cross-tab synced).
  const { favorites, isReady, isFavorite, toggleFavorite } = useFavorites()

  const selectedIsFavorite = selectedSlug
    ? isFavorite(selectedSlug)
    : false

  const handleOpenExercise = React.useCallback((slug: string) => {
    setSelectedSlug(slug)
  }, [])

  const handleCloseDetail = React.useCallback(() => {
    setSelectedSlug(null)
  }, [])

  const handleNavigate = React.useCallback((next: ViewKey) => {
    setView(next)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  // When the user navigates away from the gallery, drop any URL filter
  // params so they don't bleed into the home view.
  React.useEffect(() => {
    if (view !== 'gallery' && typeof window !== 'undefined') {
      if (window.location.search) {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.hash
        )
      }
    }
  }, [view])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader view={view} onNavigate={handleNavigate} />

      <main className="flex-1" id="main-content">
        {view === 'home' && (
          <HomeView
            onOpenExercise={handleOpenExercise}
            onGoToGallery={() => handleNavigate('gallery')}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        )}
        {view === 'gallery' && (
          <GalleryView
            favorites={isReady ? favorites : []}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onOpenExercise={handleOpenExercise}
          />
        )}
      </main>

      <SiteFooter />

      <DetailSheet
        slug={selectedSlug}
        isFavorite={selectedIsFavorite}
        onClose={handleCloseDetail}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  )
}
