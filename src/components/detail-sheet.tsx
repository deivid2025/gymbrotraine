'use client'

import * as React from 'react'
import {
  AnimatePresence,
  motion,
  MotionConfig,
  type Variants,
} from 'framer-motion'
import { Activity, Clock, Flame, Heart, Pause, Play, X, Zap } from 'lucide-react'
import { getExercise } from '@/lib/exercises/data'
import { MuscleMap } from '@/components/muscle-map'
import {
  calculateCalories,
  DEFAULT_GOAL,
  estimateTimeMinutes,
  getMET,
  getWeeklyVolume,
  metIntensity,
  PRESCRIPTIONS,
  type GoalKey,
  type Prescription,
} from '@/lib/prescriptions'

interface DetailSheetProps {
  slug: string | null
  isFavorite: boolean
  onToggleFavorite: (slug: string) => void
  onClose: () => void
}

// Ping-pong frame sequence: 1 → 2 → 3 → 2 → 1 → 2 → 3 → 2 → ...
// Iterating this 4-step array on a 500ms clock produces one full rep
// cycle (~2s) that reads like a real exercise, not a linear scrub.
const PING_PONG = [1, 2, 3, 2] as const
const FRAME_INTERVAL_MS = 500
const PULSE_DURATION_MS = 1500

// Pulse animation for the primary muscle tag — draws the eye to the
// "main working muscle" without using a brand color (red is purely a
// functional indicator here).
const pulseVariants: Variants = {
  active: {
    scale: [1, 1.04, 1],
    transition: { duration: 1.5, ease: 'easeInOut', repeat: Infinity },
  },
  idle: { scale: 1 },
}

// Tab transition for the prescription grid swap
const tabSwapVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.1, ease: 'easeIn' } },
}

// Parse "3-4" → 4 (avg rounded), "1" → 1, "30-60s" → 45 (avg)
function avgFromRange(value: string): number {
  const match = value.match(/(\d+)(?:\s*-\s*(\d+))?/)
  if (!match) return 0
  if (match[2]) {
    return Math.round((parseInt(match[1], 10) + parseInt(match[2], 10)) / 2)
  }
  return parseInt(match[1], 10)
}

export function DetailSheet({
  slug,
  isFavorite,
  onToggleFavorite,
  onClose,
}: DetailSheetProps) {
  const exercise = slug ? getExercise(slug) : null

  // Currently-displayed frame index — one of 1, 2, or 3. Defaults to 2
  // (the middle "position" frame) so the static state matches the
  // original design before any motion kicks in.
  const [activeFrameIndex, setActiveFrameIndex] = React.useState<number>(2)
  // Default = playing. If prefers-reduced-motion is on, the reset
  // effect below will flip this to paused.
  const [isPlaying, setIsPlaying] = React.useState<boolean>(true)
  const [reducedMotion, setReducedMotion] = React.useState<boolean>(false)

  // Pointer into PING_PONG so the loop knows which frame is next.
  // Starts at index 1 (which is the value `2`) so the first auto-tick
  // advances to frame 3.
  const pingPongPosRef = React.useRef<number>(1)

  // ── NEW: state for the muscle-map pulse interaction ──────────────
  // When the user clicks a muscle chip, that muscle pulses brighter
  // (FILL_PULSE #ef4444) on the body for ~1.5s, then clears.
  const [pulseMuscle, setPulseMuscle] = React.useState<string | null>(null)
  const pulseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerPulse = React.useCallback((muscle: string) => {
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
    // Toggle off→on if user clicks the same muscle again (so the
    // brighter highlight visibly re-ignites).
    setPulseMuscle(null)
    // rAF gives React a tick to flush the null before we re-set, so
    // the FILL change is observable even if the muscle was already
    // the primary (which uses FILL_PRIMARY; null→PULSE still changes).
    requestAnimationFrame(() => setPulseMuscle(muscle))
    pulseTimeoutRef.current = setTimeout(
      () => setPulseMuscle(null),
      PULSE_DURATION_MS
    )
  }, [])

  React.useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
    }
  }, [])

  // ── NEW: state for the prescription tabs + MET calculator ─────────
  const [activeGoal, setActiveGoal] = React.useState<GoalKey>(
    exercise ? DEFAULT_GOAL[exercise.exerciseType] : 'hipertrofia'
  )
  const [weightKg, setWeightKg] = React.useState<number>(70)
  const [durationMin, setDurationMin] = React.useState<number>(30)

  // Reset goal + frame + play state when the user opens a different
  // exercise (or when their reduced-motion preference flips).
  React.useEffect(() => {
    if (!exercise) return
    pingPongPosRef.current = 1 // index of value `2` in PING_PONG
    setActiveFrameIndex(2)
    setIsPlaying(!reducedMotion)
    setActiveGoal(DEFAULT_GOAL[exercise.exerciseType])
    setPulseMuscle(null)
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
    // Reset MET calculator defaults on exercise change so the user
    // doesn't see stale numbers from a previous cardio exercise.
    setWeightKg(70)
    setDurationMin(30)
  }, [exercise, reducedMotion])

  // ESC to close + scroll lock while the sheet is open.
  React.useEffect(() => {
    if (!exercise) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [exercise, onClose])

  // Detect prefers-reduced-motion and stay subscribed to changes
  // (e.g. user toggles the OS setting while the sheet is open).
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mql.matches)
    update()
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', update)
      return () => mql.removeEventListener('change', update)
    }
    // Safari < 14 fallback.
    if (typeof mql.addListener === 'function') {
      mql.addListener(update)
      return () => mql.removeListener(update)
    }
  }, [])

  // Preload all 3 frame images so the ping-pong animation is smooth —
  // no flash of an unloaded SVG between frame swaps.
  React.useEffect(() => {
    if (!exercise) return
    if (typeof Image === 'undefined') return
    exercise.frames.forEach((frame) => {
      const img = new Image()
      img.src = frame.url
    })
  }, [exercise])

  // Animation loop. Runs only while the sheet is open, isPlaying is
  // true, AND the user has not opted out of motion.
  React.useEffect(() => {
    if (!exercise) return
    if (!isPlaying) return
    if (reducedMotion) return

    const id = window.setInterval(() => {
      pingPongPosRef.current = (pingPongPosRef.current + 1) % PING_PONG.length
      const next = PING_PONG[pingPongPosRef.current]
      setActiveFrameIndex(next)
    }, FRAME_INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [exercise, isPlaying, reducedMotion])

  // Manual scrub — pause the animation and jump to the clicked frame.
  // Sync the ping-pong pointer to that frame's slot so resuming from
  // here feels natural.
  const handleScrub = React.useCallback((frameIndex: number) => {
    const idx = PING_PONG.indexOf(frameIndex as 1 | 2 | 3)
    if (idx >= 0) pingPongPosRef.current = idx
    setActiveFrameIndex(frameIndex)
    setIsPlaying(false)
  }, [])

  const handleTogglePlay = React.useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  // Active prescription + derived prescription-set count for the
  // weekly-volume section. Computed once per render — cheap.
  const prescriptions = exercise ? PRESCRIPTIONS[exercise.exerciseType] : []
  const activePrescription: Prescription | null = exercise
    ? (prescriptions.find((p) => p.goal === activeGoal) ?? prescriptions[0])
    : null

  const weekly = exercise ? getWeeklyVolume(exercise.primaryMuscle) : null
  const showWeeklySection =
    weekly && (weekly.applicable || !!weekly.note)
  const setsThisSession = activePrescription
    ? avgFromRange(activePrescription.sets)
    : 0
  const weeklyPercent =
    weekly && weekly.min > 0 && setsThisSession > 0
      ? Math.round((setsThisSession / weekly.min) * 100)
      : 0

  // MET — only for distance_duration exercises.
  const met = exercise ? getMET(exercise) : null
  const metInfo = met != null ? metIntensity(met) : null
  const kcal =
    met != null ? calculateCalories(met, weightKg, durationMin) : 0
  const metIntensityTextColor =
    metInfo && (metInfo.label === 'Leve' || metInfo.label === 'Moderada')
      ? 'var(--ink)'
      : '#ffffff'

  const estimatedMin = exercise
    ? estimateTimeMinutes(exercise, activeGoal)
    : 0

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
      {exercise && activePrescription && (
        <motion.div
          key="detail-root"
          className="fixed inset-0 z-50 grid place-items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => {
            // Close when clicking outside the content (on the overlay/grid).
            if (e.target === e.currentTarget) onClose()
          }}
        >
          {/* Dark backdrop, behind the centered content */}
          <div
            className="absolute inset-0 -z-10 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          {/* Centered content — full-screen slide-up on mobile, modal on desktop */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${exercise.name} — detalle`}
            className="w-full h-[100dvh] max-h-[100dvh] overflow-y-auto bg-[var(--paper)] text-[var(--ink)] rounded-none sm:h-auto sm:max-h-[92vh] sm:w-[min(1120px,calc(100%-2rem))] sm:rounded-[2.5rem] sm:shadow-[var(--shadow-soft)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close bar — heart + X, top-right, both subtle monochrome squircles */}
            <div className="detail-close-bar">
              <button
                type="button"
                className="detail-icon-button focus-shell"
                data-favorite={isFavorite ? 'true' : 'false'}
                aria-label={
                  isFavorite
                    ? `Quitar ${exercise.name} de favoritos`
                    : `Guardar ${exercise.name} en favoritos`
                }
                aria-pressed={isFavorite}
                onClick={() => onToggleFavorite(exercise.slug)}
              >
                <Heart
                  className="size-5"
                  fill={isFavorite ? 'currentColor' : 'none'}
                  strokeWidth={2.2}
                />
              </button>
              <button
                type="button"
                className="detail-icon-button focus-shell"
                aria-label="Cerrar detalle"
                onClick={onClose}
              >
                <X className="size-5" strokeWidth={2.2} />
              </button>
            </div>

            <article className="page-shell">
              {/* DETAIL HERO */}
              <header className="detail-hero">
                <div className="detail-copy">
                  <button
                    type="button"
                    className="breadcrumb focus-shell"
                    onClick={onClose}
                  >
                    ← Todos los ejercicios
                  </button>
                  <p className="eyebrow">{exercise.exerciseTypeLabel}</p>
                  <h1>{exercise.name}</h1>
                  <p>
                    Tres ilustraciones transparentes y listas para producción
                    en un sistema visual consistente.
                  </p>
                  {/* Equipment + stretch tags stay monochrome — they describe
                      the exercise setup, not "what's working". The muscle
                      chips moved into the new "Músculos activos" section
                      where they sit next to the body map. */}
                  <ul
                    className="tag-list"
                    aria-label="Resumen del ejercicio"
                  >
                    <li className="tag">{exercise.equipment}</li>
                    {exercise.isStretch && (
                      <li className="tag">Estiramiento</li>
                    )}
                  </ul>
                </div>
                {/* Featured image + play/pause toggle, stacked in the right
                    column of the hero grid. */}
                <div>
                  <div className="detail-featured">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={`frame-${activeFrameIndex}`}
                        src={exercise.frames[activeFrameIndex - 1].url}
                        alt={`${exercise.name}, ilustración ${activeFrameIndex}`}
                        width={512}
                        height={512}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                      />
                    </AnimatePresence>
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      className="play-toggle focus-shell"
                      onClick={handleTogglePlay}
                      aria-label={
                        isPlaying
                          ? 'Pausar animación'
                          : 'Reproducir animación'
                      }
                      aria-pressed={isPlaying}
                    >
                      {isPlaying ? (
                        <Pause aria-hidden="true" />
                      ) : (
                        <Play aria-hidden="true" />
                      )}
                      {isPlaying ? 'Pausar' : 'Reproducir'}
                    </button>
                  </div>
                </div>
              </header>

              {/* ── NEW: MÚSCULOS ACTIVOS ─────────────────────────────
                  Body map (anatomical illustration with red muscle
                  highlights) + clickable chips. Click a chip → that
                  muscle pulses brighter red on the body for ~1.5s. */}
              <section
                className="section"
                aria-labelledby="muscles-title"
              >
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Zona de activación</p>
                    <h2 id="muscles-title">Músculos activos</h2>
                  </div>
                  <p>
                    Selecciona un grupo muscular para visualizar su zona de activación. El músculo principal se muestra en rojo intenso; los secundarios en rojo suave.
                  </p>
                </div>

                <div className="muscle-map-layout">
                  <MuscleMap
                    primaryMuscle={exercise.primaryMuscle}
                    secondaryMuscles={exercise.secondaryMuscles}
                    pulseMuscle={pulseMuscle}
                  />

                  <div className="muscle-map-chips">
                    <p className="muscle-eyebrow">Seleccionar</p>
                    <ul className="tag-list" aria-label="Músculos activos">
                      <motion.li
                        className="muscle-tag muscle-tag-primary"
                        variants={pulseVariants}
                        animate={reducedMotion ? 'idle' : 'active'}
                      >
                        <button
                          type="button"
                          className="muscle-tag-button focus-shell"
                          onClick={() => triggerPulse(exercise.primaryMuscle)}
                          aria-label={`Resaltar ${exercise.primaryMuscle} en el cuerpo`}
                        >
                          <Flame aria-hidden="true" />
                          {exercise.primaryMuscle}
                        </button>
                      </motion.li>
                      {exercise.secondaryMuscles.length > 0 ? (
                        exercise.secondaryMuscles.map((muscle) => (
                          <li key={muscle} className="muscle-tag">
                            <button
                              type="button"
                              className="muscle-tag-button focus-shell"
                              onClick={() => triggerPulse(muscle)}
                              aria-label={`Resaltar ${muscle} en el cuerpo`}
                            >
                              <Zap aria-hidden="true" />
                              {muscle}
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="muscle-tag muscle-tag-none">
                          Sin secundarios
                        </li>
                      )}
                    </ul>

                    {/* Legend so the colors are self-explanatory */}
                    <ul
                      className="muscle-map-legend"
                      aria-label="Leyenda de colores"
                    >
                      <li>
                        <span
                          className="muscle-map-swatch"
                          style={{ background: '#dc2626' }}
                          aria-hidden="true"
                        />
                        Músculo principal
                      </li>
                      <li>
                        <span
                          className="muscle-map-swatch"
                          style={{ background: 'rgba(220, 38, 38, 0.32)' }}
                          aria-hidden="true"
                        />
                        Secundarios
                      </li>
                      <li>
                        <span
                          className="muscle-map-swatch"
                          style={{ background: '#ef4444' }}
                          aria-hidden="true"
                        />
                        Resaltado
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* ALL THREE FRAMES — clickable to scrub */}
              <section className="section" aria-labelledby="frames-title">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Inicio · Medio · Fin</p>
                    <h2 id="frames-title">Fases del movimiento</h2>
                  </div>
                  <p>
                    Visualiza el movimiento en sus tres fases o navega a la posición que necesites.
                  </p>
                </div>
                <div className="frame-grid">
                  {exercise.frames.map((frame) => {
                    const isActive = frame.index === activeFrameIndex
                    return (
                      <div
                        key={frame.index}
                        className="frame-card"
                        data-active={isActive ? 'true' : 'false'}
                      >
                        {/* Click the image to scrub to this frame.
                            Pauses the auto-loop and shows this frame
                            as the featured one above. */}
                        <button
                          type="button"
                          className="frame-card-button focus-shell"
                          onClick={() => handleScrub(frame.index)}
                          aria-label={`Ver ilustración ${frame.index}${
                            isActive ? ' (activa)' : ''
                          }`}
                          aria-pressed={isActive}
                        >
                          <div className="card-stage">
                            <img
                              src={frame.url}
                              alt={`${exercise.name}, ilustración ${frame.index}`}
                              width={512}
                              height={512}
                              loading="lazy"
                            />
                          </div>
                        </button>
                        <div className="frame-meta">
                          <p>Ilustración {frame.index}</p>
                          <button
                            type="button"
                            className="frame-favorite focus-shell"
                            data-favorite={isFavorite ? 'true' : 'false'}
                            aria-label={
                              isFavorite
                                ? `Quitar ${exercise.name} de favoritos`
                                : `Guardar ${exercise.name} en favoritos`
                            }
                            aria-pressed={isFavorite}
                            onClick={() =>
                              onToggleFavorite(exercise.slug)
                            }
                          >
                            <Heart
                              className="size-5"
                              fill={isFavorite ? 'currentColor' : 'none'}
                              strokeWidth={2.2}
                            />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* EXERCISE DETAILS */}
              <section
                className="section guide-layout"
                aria-labelledby="details-title"
              >
                <div>
                  <p className="eyebrow">Datos del ejercicio</p>
                  <h2 id="details-title">Ficha técnica</h2>
                </div>
                <dl className="metadata-grid">
                  <div className="metadata-card">
                    <dt>Equipamiento</dt>
                    <dd>{exercise.equipment}</dd>
                  </div>
                  <div className="metadata-card">
                    <dt>Músculo principal</dt>
                    <dd>
                      <button
                        type="button"
                        className="muscle-chip muscle-chip-primary muscle-chip-button focus-shell"
                        onClick={() => triggerPulse(exercise.primaryMuscle)}
                        aria-label={`Resaltar ${exercise.primaryMuscle} en el cuerpo`}
                      >
                        <Flame aria-hidden="true" />
                        {exercise.primaryMuscle}
                      </button>
                    </dd>
                  </div>
                  <div className="metadata-card">
                    <dt>Músculos secundarios</dt>
                    <dd className="muscle-chip-row">
                      {exercise.secondaryMuscles.length > 0 ? (
                        exercise.secondaryMuscles.map((muscle) => (
                          <button
                            key={muscle}
                            type="button"
                            className="muscle-chip muscle-chip-button focus-shell"
                            onClick={() => triggerPulse(muscle)}
                            aria-label={`Resaltar ${muscle} en el cuerpo`}
                          >
                            <Zap aria-hidden="true" />
                            {muscle}
                          </button>
                        ))
                      ) : (
                        'Ninguno'
                      )}
                    </dd>
                  </div>
                  <div className="metadata-card">
                    <dt>Tipo de ejercicio</dt>
                    <dd>{exercise.exerciseTypeLabel}</dd>
                  </div>
                </dl>
              </section>

              {/* ── NEW: CÓMO ENTRENARLO ───────────────────────────────
                  Prescription tabs (one per goal) + a 2-col grid with
                  sets / reps / rest / tempo / intensity + a time
                  estimate chip + source line. Default tab = the goal
                  recommended for this exercise type. */}
              <section
                className="section guide-layout"
                aria-labelledby="prescription-title"
              >
                <div>
                  <p className="eyebrow">Prescripción</p>
                  <h2 id="prescription-title">Cómo entrenarlo</h2>
                  <p>
                    Series, repeticiones y descanso según evidencia científica.
                    Selecciona tu objetivo:
                  </p>
                </div>

                <div>
                  <div
                    className="prescription-tabs"
                    role="tablist"
                    aria-label="Objetivo de entrenamiento"
                  >
                    {prescriptions.map((p) => {
                      const isActive = p.goal === activeGoal
                      return (
                        <button
                          key={p.goal}
                          type="button"
                          role="tab"
                          className="prescription-tab focus-shell"
                          data-active={isActive ? 'true' : 'false'}
                          aria-selected={isActive}
                          onClick={() => setActiveGoal(p.goal)}
                        >
                          {p.goalLabel}
                        </button>
                      )
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.dl
                      key={activeGoal}
                      className="prescription-grid"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={tabSwapVariants}
                    >
                      <div className="prescription-cell">
                        <dt>Series</dt>
                        <dd>{activePrescription.sets}</dd>
                      </div>
                      <div className="prescription-cell">
                        <dt>Repeticiones</dt>
                        <dd>{activePrescription.reps}</dd>
                      </div>
                      <div className="prescription-cell">
                        <dt>Descanso</dt>
                        <dd>{activePrescription.rest}</dd>
                      </div>
                      {activePrescription.tempo && (
                        <div className="prescription-cell">
                          <dt>Tempo</dt>
                          <dd>{activePrescription.tempo}</dd>
                        </div>
                      )}
                      {activePrescription.intensity && (
                        <div className="prescription-cell">
                          <dt>Intensidad</dt>
                          <dd>{activePrescription.intensity}</dd>
                        </div>
                      )}
                    </motion.dl>
                  </AnimatePresence>

                  <div className="prescription-meta">
                    <span className="time-estimate">
                      <Clock aria-hidden="true" />
                      ~{estimatedMin} min por sesión
                    </span>
                    <p className="prescription-source">
                      Fuente: {activePrescription.source}
                    </p>
                  </div>
                </div>
              </section>

              {/* ── NEW: VOLUMEN SEMANAL ───────────────────────────────
                  Schoenfeld 2017 dose-response: 10-20 sets/week for
                  large muscles. Skip the section entirely if neither
                  applicable nor a meaningful note exists. */}
              {showWeeklySection && (
                <section
                  className="section guide-layout"
                  aria-labelledby="volume-title"
                >
                  <div>
                    <p className="eyebrow">Volumen</p>
                    <h2 id="volume-title">Volumen semanal</h2>
                    <p>
                      Series recomendadas por semana según evidencia científica.
                       
                    </p>
                  </div>

                  <div className="weekly-volume-card">
                    {weekly.applicable ? (
                      <>
                        <p>
                          Se recomiendan <strong>
                            {weekly.min}-{weekly.max}
                          </strong>{' '}
                          series por semana para{' '}
                          <strong>{exercise.primaryMuscle}</strong>.
                        </p>
                        {setsThisSession > 0 && weeklyPercent > 0 && (
                          <p>
                            Esta sesión aporta{' '}
                            <strong>~{setsThisSession} series</strong> (
                            {weeklyPercent}% del mínimo).
                          </p>
                        )}
                      </>
                    ) : null}

                    {weekly.note && (
                      <p>
                        <strong>Nota:</strong> {weekly.note}
                      </p>
                    )}

                    <p className="prescription-source">
                      Fuente: Schoenfeld 2017 — dose-response meta-análisis
                    </p>
                  </div>
                </section>
              )}

              {/* ── NEW: INTENSIDAD Y CALORÍAS ─────────────────────────
                  ONLY for distance_duration exercises with a known MET
                  value. Live calculator: change weight or duration and
                  the kcal total updates instantly. */}
              {exercise.exerciseType === 'distance_duration' &&
                met != null &&
                metInfo && (
                  <section
                    className="section guide-layout"
                    aria-labelledby="met-title"
                  >
                    <div>
                      <p className="eyebrow">Cardio</p>
                      <h2 id="met-title">Intensidad y calorías</h2>
                      <p>
                        Basado en el Compendio de Actividades Físicas
                        (Ainsworth 2011).
                      </p>
                    </div>

                    <div className="met-card">
                      <div className="met-row">
                        <div>
                          <p className="met-value">
                            {met}
                            <span className="met-unit">METs</span>
                          </p>
                          <span
                            className="met-intensity-badge"
                            style={{
                              backgroundColor: metInfo.color,
                              color: metIntensityTextColor,
                            }}
                          >
                            {metInfo.label}
                          </span>
                        </div>
                        <Activity
                          aria-hidden="true"
                          className="met-row-icon"
                        />
                      </div>

                      <div className="met-calculator">
                        <label className="met-field">
                          <span className="met-field-label">
                            Peso (kg)
                          </span>
                          <input
                            type="number"
                            min={30}
                            max={200}
                            step={1}
                            value={weightKg}
                            onChange={(e) =>
                              setWeightKg(
                                Math.max(
                                  30,
                                  Math.min(200, Number(e.target.value) || 70)
                                )
                              )
                            }
                            aria-label="Tu peso en kilogramos"
                          />
                        </label>
                        <label className="met-field">
                          <span className="met-field-label">
                            Duración (min)
                          </span>
                          <input
                            type="number"
                            min={5}
                            max={300}
                            step={1}
                            value={durationMin}
                            onChange={(e) =>
                              setDurationMin(
                                Math.max(
                                  5,
                                  Math.min(300, Number(e.target.value) || 30)
                                )
                              )
                            }
                            aria-label="Duración en minutos"
                          />
                        </label>
                      </div>

                      <p className="met-result">
                        <strong>{kcal}</strong> kcal quemadas
                      </p>

                      <p className="prescription-source">
                        Fuente: Ainsworth et al. 2011 — Compendium of Physical
                        Activities
                      </p>
                    </div>
                  </section>
                )}
            </article>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </MotionConfig>
  )
}
