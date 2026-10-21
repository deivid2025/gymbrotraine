'use client'

import * as React from 'react'
import { Heart, Search } from 'lucide-react'
import {
  equipmentOptions,
  muscleOptions,
  typeOptions,
  searchExercises,
  TOTAL_EXERCISES,
  TOTAL_FRAMES,
  type Exercise,
} from '@/lib/exercises/data'
import { ExerciseCard } from '@/components/exercise-card'

interface GalleryViewProps {
  favorites: string[]
  isFavorite: (slug: string) => boolean
  onToggleFavorite: (slug: string) => void
  onOpenExercise: (slug: string) => void
}

interface FilterState {
  q: string
  equipment: string
  muscle: string
  type: string
  favoritesOnly: boolean
}

const DEFAULT_FILTERS: FilterState = {
  q: '',
  equipment: '',
  muscle: '',
  type: '',
  favoritesOnly: false,
}

function isDefaultFilters(f: FilterState): boolean {
  return (
    !f.q &&
    !f.equipment &&
    !f.muscle &&
    !f.type &&
    !f.favoritesOnly
  )
}

export function GalleryView({
  favorites,
  isFavorite,
  onToggleFavorite,
  onOpenExercise,
}: GalleryViewProps) {
  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS)

  // Restore filter state from URL params on mount.
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setFilters({
      q: params.get('q') ?? '',
      equipment: params.get('equipment') ?? '',
      muscle: params.get('muscle') ?? '',
      type: params.get('type') ?? '',
      favoritesOnly: params.get('fav') === '1',
    })
  }, [])

  const updateField = React.useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const clearFilters = React.useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // Derived results.
  const results = React.useMemo<Exercise[]>(() => {
    const base = searchExercises({
      q: filters.q,
      equipment: filters.equipment || undefined,
      primaryMuscle: filters.muscle || undefined,
      exerciseType: filters.type || undefined,
    })
    if (!filters.favoritesOnly) return base
    const set = new Set(favorites)
    return base.filter((e) => set.has(e.slug))
  }, [filters, favorites])

  // Sync filter state → URL (replaceState, no scroll).
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams()
    if (filters.q.trim()) params.set('q', filters.q.trim())
    if (filters.equipment) params.set('equipment', filters.equipment)
    if (filters.muscle) params.set('muscle', filters.muscle)
    if (filters.type) params.set('type', filters.type)
    if (filters.favoritesOnly) params.set('fav', '1')
    const next = params.size
      ? `${window.location.pathname}?${params}`
      : window.location.pathname
    window.history.replaceState({}, '', next)
  }, [filters])

  const showingAll = results.length === TOTAL_EXERCISES
  const resultLabel = showingAll
    ? `Mostrando los ${TOTAL_EXERCISES} ejercicios`
    : `${results.length} ejercicio${results.length === 1 ? '' : 's'} encontrado${
        results.length === 1 ? '' : 's'
      }`

  return (
    <>
      <header className="page-intro page-shell">
        <div>
          <p className="eyebrow">
            {TOTAL_EXERCISES} ejercicios · {TOTAL_FRAMES} ilustraciones
          </p>
          <h1>Encuentra el movimiento que buscas.</h1>
        </div>
        <p>
          Busca en una biblioteca completa de ilustraciones de fuerza,
          movilidad, cardio y estiramientos.
        </p>
      </header>

      <section
        className="page-shell gallery-section"
        aria-labelledby="gallery-title"
      >
        <h2 className="sr-only" id="gallery-title">
          Galería de ejercicios
        </h2>

        <form
          className="filter-panel"
          role="search"
          onSubmit={(e) => e.preventDefault()}
        >
          <label>
            <span className="field-label">Buscar</span>
            <span className="field-surface search-field">
              <Search className="size-[18px]" aria-hidden="true" />
              <input
                type="search"
                name="q"
                placeholder="Nombre, equipo o músculo"
                autoComplete="off"
                value={filters.q}
                onChange={(e) => updateField('q', e.target.value)}
              />
            </span>
          </label>

          <label>
            <span className="field-label">Equipamiento</span>
            <span className="field-surface">
              <select
                name="equipment"
                value={filters.equipment}
                onChange={(e) => updateField('equipment', e.target.value)}
              >
                <option value="">Todos los equipos</option>
                {equipmentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value} ({opt.count})
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label>
            <span className="field-label">Músculo</span>
            <span className="field-surface">
              <select
                name="muscle"
                value={filters.muscle}
                onChange={(e) => updateField('muscle', e.target.value)}
              >
                <option value="">Todos los músculos</option>
                {muscleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value} ({opt.count})
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label>
            <span className="field-label">Tipo</span>
            <span className="field-surface">
              <select
                name="type"
                value={filters.type}
                onChange={(e) => updateField('type', e.target.value)}
              >
                <option value="">Todos los tipos</option>
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.count})
                  </option>
                ))}
              </select>
            </span>
          </label>

          <button
            type="button"
            className="favorite-toggle focus-shell"
            data-active={filters.favoritesOnly ? 'true' : 'false'}
            aria-pressed={filters.favoritesOnly}
            onClick={() => updateField('favoritesOnly', !filters.favoritesOnly)}
          >
            <Heart
              className="size-[18px]"
              fill={filters.favoritesOnly ? 'currentColor' : 'none'}
              strokeWidth={2.2}
            />
            Solo favoritos
          </button>
        </form>

        <p className="result-meta" role="status" aria-live="polite">
          {resultLabel}
          {!isDefaultFilters(filters) && (
            <>
              {' · '}
              <button
                type="button"
                onClick={clearFilters}
                className="focus-shell"
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  color: 'var(--ink)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '0.2em',
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  font: 'inherit',
                  fontWeight: 680,
                }}
              >
                Limpiar filtros
              </button>
            </>
          )}
        </p>

        {results.length > 0 ? (
          <div className="exercise-grid">
            {results.map((exercise) => (
              <ExerciseCard
                key={exercise.slug}
                exercise={exercise}
                isFavorite={isFavorite(exercise.slug)}
                onToggleFavorite={onToggleFavorite}
                onOpen={onOpenExercise}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No se encontraron ejercicios.</h2>
            <p>
              Prueba con una búsqueda más amplia o limpia un filtro.
            </p>
          </div>
        )}
      </section>
    </>
  )
}
