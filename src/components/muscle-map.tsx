'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MuscleMapProps {
  primaryMuscle: string;
  secondaryMuscles: string[];
  /** When set, this muscle pulses brightly on the body (e.g. user clicked its chip). */
  pulseMuscle?: string | null;
  className?: string;
}

// ============================================================
// MUSCLE → FILE MAPPING
// Each muscle maps to a specific overlay file (front or back view).
// ============================================================

interface MuscleFile {
  view: 'front' | 'back';
  slug: string;
}

const MUSCLE_FILE: Record<string, MuscleFile> = {
  // Front-view muscles
  Pecho: { view: 'front', slug: 'pecho' },
  Core: { view: 'front', slug: 'core' },
  Hombros: { view: 'front', slug: 'hombros' },
  Bíceps: { view: 'front', slug: 'biceps' },
  Antebrazos: { view: 'front', slug: 'antebrazos' },
  Cuádriceps: { view: 'front', slug: 'cuadriceps' },
  Aductores: { view: 'front', slug: 'aductores' },
  Caderas: { view: 'front', slug: 'caderas' },
  // Back-view muscles
  'Espalda alta': { view: 'back', slug: 'espalda-alta' },
  Dorsales: { view: 'back', slug: 'dorsales' },
  'Espalda baja': { view: 'back', slug: 'espalda-baja' },
  'Deltoides posterior': { view: 'back', slug: 'deltoides-posterior' },
  Tríceps: { view: 'back', slug: 'triceps' },
  Glúteos: { view: 'back', slug: 'gluteos' },
  Isquiotibiales: { view: 'back', slug: 'isquiotibiales' },
  Pantorrillas: { view: 'back', slug: 'pantorrillas' },
};

// Generic muscles → resolve to multiple specific muscles
const MUSCLE_ALIASES: Record<string, string[]> = {
  Espalda: ['Espalda alta', 'Dorsales'],
  Piernas: ['Cuádriceps', 'Isquiotibiales', 'Pantorrillas'],
  'Cadena posterior': ['Isquiotibiales', 'Glúteos', 'Espalda baja'],
  'Posterior Chain': ['Isquiotibiales', 'Glúteos', 'Espalda baja'],
  Agarre: ['Antebrazos'],
  Ingle: ['Aductores'],
  Caderas: ['Aductores', 'Glúteos'],
  Hips: ['Aductores', 'Glúteos'],
};

const BACK_DEFAULT_MUSCLES = new Set([
  'Espalda',
  'Dorsales',
  'Espalda alta',
  'Espalda baja',
  'Glúteos',
  'Isquiotibiales',
  'Tríceps',
  'Deltoides posterior',
  'Cadena posterior',
  'Posterior Chain',
]);

function resolveMuscle(muscle: string): string[] {
  if (MUSCLE_ALIASES[muscle]) return MUSCLE_ALIASES[muscle];
  return [muscle];
}

function getMuscleFile(muscle: string, view: 'front' | 'back'): string | null {
  const resolved = resolveMuscle(muscle);
  for (const m of resolved) {
    const file = MUSCLE_FILE[m];
    if (file && file.view === view) {
      return `/body-map/male/muscle-${file.slug}-${view}.png`;
    }
  }
  return null;
}

const OPACITY_PRIMARY = 1.0;
const OPACITY_SECONDARY = 0.55;
const OPACITY_PULSE = 1.0;

export function MuscleMap({
  primaryMuscle,
  secondaryMuscles,
  pulseMuscle = null,
  className,
}: MuscleMapProps) {
  const [view, setView] = useState<'front' | 'back'>('front');

  useEffect(() => {
    if (BACK_DEFAULT_MUSCLES.has(primaryMuscle)) {
      setView('back');
    } else {
      setView('front');
    }
  }, [primaryMuscle]);

  // Auto-switch view when a chip is clicked for a muscle in the OTHER view
  // (e.g. click "Glúteos" while on Frontal → switches to Dorsal automatically)
  useEffect(() => {
    if (!pulseMuscle) return;
    const resolved = resolveMuscle(pulseMuscle);
    for (const m of resolved) {
      const file = MUSCLE_FILE[m];
      if (file) {
        if (file.view !== view) {
          setView(file.view);
        }
        break;
      }
    }
  }, [pulseMuscle]);

  const layers = useMemo(() => {
    const result: Array<{ src: string; opacity: number; isPulse: boolean; key: string }> = [];

    const primaryFile = getMuscleFile(primaryMuscle, view);
    if (primaryFile) {
      const isPulse =
        pulseMuscle === primaryMuscle ||
        resolveMuscle(pulseMuscle || '').includes(primaryMuscle);
      // Primary is always at full opacity — it's the "main body" for this view
      result.push({
        src: primaryFile,
        opacity: isPulse ? OPACITY_PULSE : OPACITY_PRIMARY,
        isPulse,
        key: `primary-${primaryMuscle}`,
      });
    }

    for (const sec of secondaryMuscles) {
      const secFile = getMuscleFile(sec, view);
      if (secFile) {
        const isPulse =
          pulseMuscle === sec ||
          resolveMuscle(pulseMuscle || '').includes(sec);
        result.push({
          src: secFile,
          opacity: isPulse ? OPACITY_PULSE : OPACITY_SECONDARY,
          isPulse,
          key: `sec-${sec}`,
        });
      }
    }

    // Edge case: if no primary overlay exists for this view (e.g. front-muscle
    // exercise on dorsal view), the FIRST secondary becomes the "main body" at
    // full opacity so the body isn't semi-transparent.
    const hasPrimary = !!primaryFile;
    if (!hasPrimary && result.length > 0) {
      result[0].opacity = result[0].isPulse ? OPACITY_PULSE : OPACITY_PRIMARY;
    }

    return result;
  }, [primaryMuscle, secondaryMuscles, pulseMuscle, view]);

  return (
    <div className={`muscle-map ${className ?? ''}`}>
      {/* Toggle Frontal / Dorsal */}
      <div className="muscle-map-toggle" role="tablist" aria-label="Vista del cuerpo">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'front'}
          data-active={view === 'front' ? 'true' : undefined}
          onClick={() => setView('front')}
          className="muscle-map-tab"
        >
          Frontal
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'back'}
          data-active={view === 'back' ? 'true' : undefined}
          onClick={() => setView('back')}
          className="muscle-map-tab"
        >
          Dorsal
        </button>
      </div>

      {/* Stacked image layers */}
      <div
        className="muscle-map-svg"
        aria-label={`Vista ${view === 'front' ? 'frontal' : 'dorsal'} del cuerpo con músculos activos resaltados`}
      >
        <div
          className="muscle-map-stack"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '360px',
            aspectRatio: '1 / 2',
            marginInline: 'auto',
            background: 'var(--card-gradient)',
            borderRadius: '1.5rem',
            overflow: 'hidden',
          }}
        >
          {/* No separate base image — each overlay already contains the full body.
              The primary overlay IS the body (with the primary muscle in red).
              Secondary overlays stack on top with screen blend (they add their
              muscle region in soft red, aligned since they're from the same agent). */}
          {/* Muscle overlays — each in a wrapper for scale/glow/fiber pulse effects */}
          <AnimatePresence>
            {layers.map((layer) => (
              <motion.div
                key={layer.key}
                className="muscle-overlay-wrapper"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  zIndex: layer.isPulse ? 3 : 2,
                }}
              >
                {/* Red muscle layer — scales up + glows during pulse */}
                <motion.img
                  src={layer.src}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  animate={
                    layer.isPulse
                      ? {
                          scale: [1, 1.09, 1.05, 1],
                          opacity: [layer.opacity, 1, 1, layer.opacity],
                        }
                      : { scale: 1, opacity: layer.opacity }
                  }
                  transition={
                    layer.isPulse
                      ? { duration: 1.4, ease: 'easeInOut', times: [0, 0.35, 0.7, 1] }
                      : { duration: 0.2 }
                  }
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    mixBlendMode: 'screen',
                    transformOrigin: 'center center',
                    filter: layer.isPulse
                      ? 'drop-shadow(0 0 14px rgba(220, 38, 38, 0.95)) drop-shadow(0 0 5px rgba(255, 100, 100, 0.8))'
                      : 'none',
                  }}
                />
                {/* Fiber striations — masked to the muscle shape, fade in during pulse */}
                <AnimatePresence>
                  {layer.isPulse && (
                    <motion.div
                      className="muscle-fibers"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.85, 0.7, 0] }}
                      transition={{
                        duration: 1.4,
                        ease: 'easeInOut',
                        times: [0, 0.35, 0.7, 1],
                      }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage:
                          'repeating-linear-gradient(8deg, transparent 0px, transparent 2.5px, rgba(255, 235, 235, 0.85) 2.5px, rgba(255, 235, 235, 0.85) 3.2px)',
                        maskImage: `url(${layer.src})`,
                        WebkitMaskImage: `url(${layer.src})`,
                        maskSize: 'contain',
                        WebkitMaskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center',
                        mixBlendMode: 'screen',
                        transformOrigin: 'center center',
                      }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
