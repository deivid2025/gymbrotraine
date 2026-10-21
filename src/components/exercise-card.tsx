'use client'

import * as React from 'react'
import { Heart } from 'lucide-react'
import type { Exercise } from '@/lib/exercises/data'

interface ExerciseCardProps {
  exercise: Exercise
  isFavorite: boolean
  onToggleFavorite: (slug: string) => void
  onOpen: (slug: string) => void
}

export function ExerciseCard({
  exercise,
  isFavorite,
  onToggleFavorite,
  onOpen,
}: ExerciseCardProps) {
  const handleOpen = React.useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      // Don't navigate when the user clicked the favorite heart.
      if (e.target instanceof HTMLElement && e.target.closest('[data-favorite-toggle]')) {
        return
      }
      e.preventDefault()
      onOpen(exercise.slug)
    },
    [exercise.slug, onOpen]
  )

  const handleKey = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('[data-favorite-toggle]')) {
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onOpen(exercise.slug)
      }
    },
    [exercise.slug, onOpen]
  )

  const handleFavorite = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      onToggleFavorite(exercise.slug)
    },
    [exercise.slug, onToggleFavorite]
  )

  return (
    <article className="exercise-card">
      <a
        className="card-link focus-shell"
        href={`#ejercicio/${exercise.slug}`}
        onClick={handleOpen}
        onKeyDown={handleKey}
        aria-label={`Ver detalle de ${exercise.name}`}
      >
        <div className="card-surface">
          <img
            className="card-image"
            src={exercise.frames[0].url}
            alt={`Ilustración del ejercicio ${exercise.name}`}
            loading="lazy"
            decoding="async"
            width={512}
            height={512}
          />
          <div className="card-copy">
            <h2>{exercise.name}</h2>
            <p>
              {exercise.primaryMuscle} · {exercise.equipment}
            </p>
          </div>
        </div>
      </a>
      <button
        type="button"
        className="card-favorite focus-shell"
        data-favorite-toggle
        data-favorite={isFavorite ? 'true' : 'false'}
        aria-label={
          isFavorite
            ? `Quitar ${exercise.name} de favoritos`
            : `Guardar ${exercise.name} en favoritos`
        }
        aria-pressed={isFavorite}
        onClick={handleFavorite}
      >
        <Heart
          className="size-[18px]"
          fill={isFavorite ? 'currentColor' : 'none'}
          strokeWidth={2.2}
        />
      </button>
    </article>
  )
}
