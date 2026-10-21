'use client'

import * as React from 'react'
import {
  TOTAL_EXERCISES,
  TOTAL_FRAMES,
  featured,
} from '@/lib/exercises/data'
import { BRAND } from '@/lib/brand'
import { ExerciseCard } from '@/components/exercise-card'

interface HomeViewProps {
  onOpenExercise: (slug: string) => void
  onGoToGallery: () => void
  isFavorite: (slug: string) => boolean
  onToggleFavorite: (slug: string) => void
}

// The original site uses the first 5 featured exercises for both the
// developer-previews strip and the "Featured assets" preview-grid.
const featuredList = featured.slice(0, 5)
const heroPreviews = featuredList.slice(0, 3)

export function HomeView({
  onOpenExercise,
  onGoToGallery,
  isFavorite,
  onToggleFavorite,
}: HomeViewProps) {
  const scrollToFeatured = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById('destacados')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <>
      {/* HERO — 2-col: copy on the left, "featured previews" panel on the right */}
      <section className="hero page-shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow stagger-item">Guía de ejercicios · LATAM</p>
          <h1 className="stagger-item" id="hero-title">
            Ilustraciones de ejercicios, listas para usar.
          </h1>
          <p className="stagger-item">
            Una biblioteca de 302 ejercicios y 906 ilustraciones SVG
            transparentes. Creada para la comunidad LATAM.
          </p>
          <a
            className="hero-creator focus-shell stagger-item"
            href={BRAND.creatorUrl}
            target="_blank"
            rel="noopener noreferrer author"
          >
            <span className="creator-copy">
              Creado por <strong>{BRAND.creator}</strong>
            </span>
            <span className="creator-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <div className="stagger-item">
            <div className="hero-actions">
              <a
                className="action-link focus-shell"
                href="#explorar"
                onClick={(e) => {
                  e.preventDefault()
                  onGoToGallery()
                }}
              >
                <span className="button-surface button-surface-dark">
                  Explorar ejercicios
                </span>
              </a>
              <a
                className="action-link focus-shell"
                href="#destacados"
                onClick={scrollToFeatured}
              >
                <span className="button-surface button-surface-light">
                  Ver destacados
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Developer panel — REPLACED the npm-install / code-block content with
            a clean "Vistas previas" panel: same dark --surface squircle, same
            visual weight, 3 exercise thumbnails on --stage backgrounds. */}
        <div className="developer-panel stagger-item">
          <div className="developer-panel-label">
            <span>Vistas previas</span>
            <span>Ejemplos</span>
          </div>
          <div
            className="developer-previews"
            aria-label="Ejercicios destacados"
          >
            {heroPreviews.map((exercise) => (
              <a
                key={exercise.slug}
                href={`#ejercicio/${exercise.slug}`}
                aria-label={`Ver ${exercise.name}`}
                onClick={(e) => {
                  e.preventDefault()
                  onOpenExercise(exercise.slug)
                }}
              >
                <img
                  src={exercise.frames[0].url}
                  alt=""
                  width={512}
                  height={512}
                  loading="eager"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* STATS — 3-col, monochrome squircle cards */}
      <section className="stats page-shell" aria-label="Estadísticas de la biblioteca">
        <div className="stat-card">
          <strong className="stat-value">{TOTAL_EXERCISES}</strong>
          <span className="stat-label">Ejercicios</span>
        </div>
        <div className="stat-card">
          <strong className="stat-value">{TOTAL_FRAMES}</strong>
          <span className="stat-label">Ilustraciones</span>
        </div>
        <div className="stat-card">
          <strong className="stat-value">512</strong>
          <span className="stat-label">ViewBox cuadrado</span>
        </div>
      </section>

      {/* FEATURED — first 5 featured exercises, scroll on mobile */}
      <section
        className="section page-shell"
        id="destacados"
        aria-labelledby="featured-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Destacados</p>
            <h2 id="featured-title">Consistentes por defecto.</h2>
          </div>
          <a
            href="#explorar"
            onClick={(e) => {
              e.preventDefault()
              onGoToGallery()
            }}
          >
            Ver los {TOTAL_EXERCISES}
          </a>
        </div>
        <div className="preview-grid">
          {featuredList.map((exercise) => (
            <ExerciseCard
              key={exercise.slug}
              exercise={exercise}
              isFavorite={isFavorite(exercise.slug)}
              onToggleFavorite={onToggleFavorite}
              onOpen={onOpenExercise}
            />
          ))}
        </div>
      </section>

      {/* CTA — monochrome dark stage squircle, no GitHub/npm buttons */}
      <section className="section page-shell" aria-labelledby="cta-title">
        <div className="cta-surface">
          <div>
            <p className="eyebrow">
              Creado para LATAM
            </p>
            <h2 id="cta-title">Abierto por diseño.</h2>
            <p>
              Explora la fuente, usa las ilustraciones y ayuda a que la
              biblioteca mejore.
            </p>
          </div>
          <div className="section-actions">
            <a
              className="action-link focus-shell"
              href="#explorar"
              onClick={(e) => {
                e.preventDefault()
                onGoToGallery()
              }}
            >
              <span className="button-surface button-surface-light">
                Explorar ejercicios
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
