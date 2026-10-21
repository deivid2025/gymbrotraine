import type { Exercise } from './exercises/data';

// ============================================================
// PRESCRIPCIONES BASADAS EN EVIDENCIA
// Fuentes:
// - ACSM Position Stand "Progression Models in Resistance Training for Healthy Adults" (2009, reaffirmado 2020)
// - Schoenfeld, B.J. et al. (2017) "Strength and hypertrophy adaptations between high- vs low-load resistance training" — J Strength Cond Res
// - Schoenfeld, B.J. et al. (2017) "Dose-response relationship between weekly resistance training volume and muscle hypertrophy" — J Strength Cond Res
// - Ainsworth et al. (2011) "Compendium of Physical Activities" — Med Sci Sports Exerc
// ============================================================

export type GoalKey =
  | 'hipertrofia'
  | 'fuerza'
  | 'resistencia'
  | 'potencia'
  | 'cardio'
  | 'movilidad';

export interface Prescription {
  goal: GoalKey;
  goalLabel: string;
  goalDescription: string;
  sets: string;
  reps: string;
  rest: string;
  tempo?: string;
  intensity?: string;
  source: string;
}

// Prescripción por objetivo, derivada del tipo de ejercicio.
// ACSM Position Stand 2009/2020 + Schoenfeld 2017.
export const PRESCRIPTIONS: Record<Exercise['exerciseType'], Prescription[]> = {
  weight_reps: [
    {
      goal: 'hipertrofia',
      goalLabel: 'Hipertrofia',
      goalDescription: 'Ganar masa muscular',
      sets: '3-4',
      reps: '8-12',
      rest: '60-90s',
      tempo: '2-1-2',
      intensity: '67-85% 1RM',
      source: 'ACSM 2009 · Schoenfeld 2017',
    },
    {
      goal: 'fuerza',
      goalLabel: 'Fuerza máxima',
      goalDescription: 'Levantar más peso',
      sets: '4-6',
      reps: '1-6',
      rest: '3-5 min',
      tempo: 'Controlado',
      intensity: '≥85% 1RM',
      source: 'ACSM 2009',
    },
    {
      goal: 'resistencia',
      goalLabel: 'Resistencia',
      goalDescription: 'Más repeticiones sin fatiga',
      sets: '2-3',
      reps: '15-20+',
      rest: '30-45s',
      tempo: '2-0-2',
      intensity: '≤67% 1RM',
      source: 'ACSM 2009',
    },
    {
      goal: 'potencia',
      goalLabel: 'Potencia',
      goalDescription: 'Movimiento explosivo',
      sets: '3-5',
      reps: '1-5',
      rest: '3-5 min',
      tempo: 'Explosivo',
      intensity: '30-60% 1RM',
      source: 'ACSM 2009',
    },
  ],
  bodyweight_reps: [
    {
      goal: 'hipertrofia',
      goalLabel: 'Hipertrofia',
      goalDescription: 'Ganar masa muscular',
      sets: '3-4',
      reps: '8-15',
      rest: '60-90s',
      tempo: '2-1-2',
      intensity: 'Cerca del fallo',
      source: 'Schoenfeld 2017',
    },
    {
      goal: 'resistencia',
      goalLabel: 'Resistencia',
      goalDescription: 'Más repeticiones',
      sets: '2-3',
      reps: '15-25+',
      rest: '30-45s',
      tempo: '2-0-2',
      source: 'ACSM 2009',
    },
    {
      goal: 'potencia',
      goalLabel: 'Potencia',
      goalDescription: 'Movimiento explosivo',
      sets: '3-5',
      reps: '5-8',
      rest: '2-3 min',
      tempo: 'Explosivo',
      source: 'ACSM 2009',
    },
  ],
  duration: [
    {
      goal: 'resistencia',
      goalLabel: 'Resistencia isométrica',
      goalDescription: 'Aguantar la posición',
      sets: '3-4',
      reps: '30-60s',
      rest: '45-60s',
      source: 'ACSM 2009',
    },
    {
      goal: 'movilidad',
      goalLabel: 'Movilidad',
      goalDescription: 'Rango articular',
      sets: '2-4',
      reps: '15-60s',
      rest: '15-30s',
      source: 'ACSM flexibility guidelines',
    },
  ],
  distance_duration: [
    {
      goal: 'cardio',
      goalLabel: 'Cardio continuo',
      goalDescription: 'Resistencia aeróbica',
      sets: '1',
      reps: '20-60 min',
      rest: '—',
      intensity: 'Zona 2-3 (60-80% FCmáx)',
      source: 'ACSM 2009',
    },
    {
      goal: 'potencia',
      goalLabel: 'HIT (HIIT)',
      goalDescription: 'Intensidad alta intermitente',
      sets: '6-10',
      reps: '30s fuerte / 30s suave',
      rest: '—',
      intensity: 'Zona 4-5 (≥85% FCmáx)',
      source: 'ACSM 2009',
    },
  ],
  assisted_bodyweight: [
    {
      goal: 'hipertrofia',
      goalLabel: 'Hipertrofia',
      goalDescription: 'Ganar masa muscular',
      sets: '3-4',
      reps: '8-12',
      rest: '60-90s',
      intensity: 'Reduce asistencia al avanzar',
      source: 'Schoenfeld 2017',
    },
    {
      goal: 'fuerza',
      goalLabel: 'Fuerza',
      goalDescription: 'Camino a sin asistencia',
      sets: '3-5',
      reps: '5-8',
      rest: '2-3 min',
      source: 'ACSM 2009',
    },
  ],
};

// Objetivo por defecto al abrir un ejercicio
export const DEFAULT_GOAL: Record<Exercise['exerciseType'], GoalKey> = {
  weight_reps: 'hipertrofia',
  bodyweight_reps: 'hipertrofia',
  duration: 'resistencia',
  distance_duration: 'cardio',
  assisted_bodyweight: 'hipertrofia',
};

// ============================================================
// TIEMPO ESTIMADO POR EJERCICIO
// Fórmula: series × (reps × tiempo_por_rep) + (series-1) × descanso + calentamiento
// ============================================================

const TEMPO_PER_REP_MS: Record<GoalKey, number> = {
  hipertrofia: 2500, // 2-1-2 = 5s per rep but ~2.5s avg
  fuerza: 3000,
  resistencia: 2000,
  potencia: 1500,
  cardio: 0,
  movilidad: 0,
};

const WARMUP_MS = 60_000;

export function estimateTimeMinutes(
  exercise: Exercise,
  goal: GoalKey = DEFAULT_GOAL[exercise.exerciseType]
): number {
  const prescriptions = PRESCRIPTIONS[exercise.exerciseType];
  const prescription =
    prescriptions.find((p) => p.goal === goal) ?? prescriptions[0];

  // Para cardio: usar el valor medio del rango de reps (que es "20-60 min")
  if (exercise.exerciseType === 'distance_duration') {
    const match = prescription.reps.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      return Math.round((min + max) / 2);
    }
    return 30;
  }

  // Para duration (isométricos/estiramientos): reps es "30-60s" (duración por serie)
  if (exercise.exerciseType === 'duration') {
    const match = prescription.reps.match(/(\d+)-(\d+)/);
    const holdSec = match ? (parseInt(match[1], 10) + parseInt(match[2], 10)) / 2 : 45;
    const setsMatch = prescription.sets.match(/(\d+)-(\d+)/);
    const sets = setsMatch ? (parseInt(setsMatch[1], 10) + parseInt(setsMatch[2], 10)) / 2 : 3;
    const restMatch = prescription.rest.match(/(\d+)-(\d+)/);
    const restSec = restMatch ? (parseInt(restMatch[1], 10) + parseInt(restMatch[2], 10)) / 2 : 45;
    const totalSec = sets * holdSec + (sets - 1) * restSec + 30;
    return Math.max(1, Math.round(totalSec / 60));
  }

  // Para weight_reps, bodyweight_reps, assisted_bodyweight: calcular con fórmula
  const setsMatch = prescription.sets.match(/(\d+)-(\d+)/);
  const sets = setsMatch ? (parseInt(setsMatch[1], 10) + parseInt(setsMatch[2], 10)) / 2 : 3;
  const repsMatch = prescription.reps.match(/(\d+)-(\d+)/);
  const reps = repsMatch ? (parseInt(repsMatch[1], 10) + parseInt(repsMatch[2], 10)) / 2 : 10;
  const restMatch = prescription.rest.match(/(\d+)-?(\d*)/);
  const restSec = restMatch
    ? restMatch[2]
      ? (parseInt(restMatch[1], 10) + parseInt(restMatch[2], 10)) / 2
      : parseInt(restMatch[1], 10)
    : 75;
  const tempoMs = TEMPO_PER_REP_MS[goal] ?? 2500;
  const workSec = (reps * tempoMs) / 1000;
  const totalSec = sets * workSec + (sets - 1) * restSec + WARMUP_MS / 1000;
  return Math.max(1, Math.round(totalSec / 60));
}

// ============================================================
// VOLUMEN SEMANAL POR MÚSCULO
// Schoenfeld 2017: 10-20 series/semana para músculos grandes
// Ajustado para músculos pequeños (menos volumen)
// ============================================================

export interface WeeklyVolume {
  min: number;
  max: number;
  note?: string;
  applicable: boolean;
}

export const WEEKLY_VOLUME: Record<string, WeeklyVolume> = {
  // Músculos grandes (Schoenfeld 2017)
  Cuádriceps: { min: 10, max: 20, applicable: true },
  Pecho: { min: 10, max: 20, applicable: true },
  Espalda: { min: 10, max: 20, applicable: true },
  Glúteos: { min: 10, max: 20, applicable: true },
  Isquiotibiales: { min: 10, max: 20, applicable: true },
  Dorsales: { min: 10, max: 20, applicable: true },
  // Músculos medianos
  Hombros: { min: 12, max: 20, note: 'Los deltoides responden bien a volumen.', applicable: true },
  Tríceps: { min: 8, max: 16, applicable: true },
  Bíceps: { min: 8, max: 16, applicable: true },
  Core: { min: 8, max: 16, applicable: true },
  'Espalda alta': { min: 8, max: 14, applicable: true },
  'Cadena posterior': { min: 10, max: 18, applicable: true },
  // Músculos pequeños
  Antebrazos: { min: 6, max: 12, applicable: true },
  Pantorrillas: { min: 8, max: 16, note: 'Responde a frecuencia alta (2-3x/semana).', applicable: true },
  'Deltoides posterior': { min: 6, max: 12, applicable: true },
  Aductores: { min: 8, max: 14, applicable: true },
  Caderas: { min: 6, max: 12, applicable: true },
  'Espalda baja': { min: 6, max: 12, note: 'Evita demasiado volumen directo.', applicable: true },
  // No aplicable
  Movilidad: {
    min: 0,
    max: 0,
    note: 'Practica movilidad 5-10 min diarios para mantenimiento.',
    applicable: false,
  },
  Piernas: {
    min: 0,
    max: 0,
    note: 'Depende del objetivo — ver Cuádriceps, Isquiotibiales, etc.',
    applicable: false,
  },
};

export function getWeeklyVolume(muscle: string): WeeklyVolume {
  return (
    WEEKLY_VOLUME[muscle] ?? {
      min: 8,
      max: 16,
      applicable: true,
    }
  );
}

// ============================================================
// METs Y CALORÍAS PARA CARDIO
// Ainsworth et al. (2011) Compendium of Physical Activities
// ============================================================

export const METS: Record<string, number> = {
  'Carrera (trote)': 9.8, // 6 mph / 9.7 km/h
  Caminar: 3.5, // 3 mph / 5 km/h
  Ciclismo: 7.5, // 12 mph / 19 km/h moderate
  Escaladora: 8.8, // stair climber moderate
  Elíptica: 5.0, // moderate
  'Bici de assault': 10.0, // vigorous
  Senderismo: 6.0, // moderate, hills
  'Caminata inclinada en caminadora': 5.3, // 5% incline
  Burpee: 8.0,
  'Rodillas altas': 5.0,
  'Saltos de tijera': 8.0,
  'Salto de patinador': 6.0,
  'Desplazamiento lateral': 5.0,
  Sprawl: 8.0,
  'Remo de competición': 7.0, // moderate
  Natación: 6.0, // freestyle moderate
  'Esquí de fondo (SkiErg)': 6.8,
};

export function getMET(exercise: Exercise): number | null {
  return METS[exercise.name] ?? null;
}

export function calculateCalories(
  met: number,
  weightKg: number,
  durationMin: number
): number {
  // kcal = MET × peso(kg) × tiempo(horas)
  return Math.round(met * weightKg * (durationMin / 60));
}

// Etiqueta de intensidad basada en METs
export function metIntensity(met: number): { label: string; color: string } {
  if (met < 3) return { label: 'Leve', color: '#a8a29e' };
  if (met < 6) return { label: 'Moderada', color: '#f4f4ef' };
  if (met < 9) return { label: 'Vigorosa', color: '#ff8a3d' };
  return { label: 'Muy vigorosa', color: '#dc2626' };
}
