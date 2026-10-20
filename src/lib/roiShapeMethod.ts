import type { Exercise, MuscleGroup, WorkoutExercise, SeriesType, EmphasisGroup } from '@/types';

interface RoiPrescription {
  name: string;
  muscle_group: MuscleGroup;
  sets: number;
  reps: string;
  series_type: SeriesType;
  rest_seconds: number;
  technique_notes: string;
  biset_group?: string;
  block: 'emphasis' | 'complement';
}

// Método Fullbody (Phillip Sarraff / ROI Shape)
// BLOCO 1 — Ênfase: 3-4 exercícios de força/hipertrofia em pirâmide regressiva de carga.
// BLOCO 2 — Complementar: 3-5 exercícios de hipertrofia/metabólico, pirâmide crescente e bi-set.
export const ROI_LOWER_BODY_PRESCRIPTION: RoiPrescription[] = [
  // Bloco 1 — Ênfase: Membros Inferiores (Força/Hipertrofia, pirâmide de carga)
  { name: 'Agachamento Livre', muscle_group: 'Quadríceps', sets: 4, reps: '12/10/8/6', series_type: 'Pirâmide de Carga', rest_seconds: 120, technique_notes: 'Pirâmide de carga: aumente progressivamente a carga a cada série mantendo a técnica. Pausa de 90-120s entre séries.', block: 'emphasis' },
  { name: 'Leg Press 45º', muscle_group: 'Quadríceps', sets: 4, reps: '15/12/10/8', series_type: 'Pirâmide de Carga', rest_seconds: 120, technique_notes: 'Pirâmide de carga com amplitude controlada. Pausa de 90-120s.', block: 'emphasis' },
  { name: 'Mesa Flexora', muscle_group: 'Posterior', sets: 4, reps: '10/8/6/4', series_type: 'Pirâmide de Carga', rest_seconds: 90, technique_notes: 'Pirâmide de carga; controle a fase excêntrica. Pausa de 60-90s.', block: 'emphasis' },
  // Bloco 2 — Complementar: Membros Superiores + Core (Hipertrofia/Metabólico)
  { name: 'Remada Triângulo', muscle_group: 'Dorsais', sets: 3, reps: '15', series_type: 'Simple', rest_seconds: 60, technique_notes: 'Hipertrofia/metabólico; contraia as escápulas no final. Pausa de 45-60s.', block: 'complement' },
  { name: 'Crucifixo Máquina', muscle_group: 'Peitoral', sets: 3, reps: '12/15/17', series_type: 'Pirâmide Crescente', rest_seconds: 60, technique_notes: 'Pirâmide crescente; reduza a carga e aumente as reps a cada série. Pausa de 45-60s.', block: 'complement' },
  { name: 'Bíceps na Polia', muscle_group: 'Bíceps', sets: 3, reps: '20', series_type: 'Bi-set', rest_seconds: 0, technique_notes: 'Executar A1 sem descanso antes do A2. Bi-set metabólico.', biset_group: 'A', block: 'complement' },
  { name: 'Abdominal Infra', muscle_group: 'Core', sets: 3, reps: '15', series_type: 'Bi-set', rest_seconds: 60, technique_notes: 'Executar A2 imediatamente após A1; sem descanso entre os exercícios. Pausa de 60s após o bi-set.', biset_group: 'A', block: 'complement' },
];

export const ROI_UPPER_BODY_PRESCRIPTION: RoiPrescription[] = [
  // Bloco 1 — Ênfase: Membros Superiores (Força/Hipertrofia, pirâmide de carga)
  { name: 'Supino Reto', muscle_group: 'Peitoral', sets: 4, reps: '12/10/8/6', series_type: 'Pirâmide de Carga', rest_seconds: 120, technique_notes: 'Pirâmide de carga: aumente progressivamente a carga a cada série. Pausa de 90-120s entre séries.', block: 'emphasis' },
  { name: 'Barra Fixa', muscle_group: 'Dorsais', sets: 4, reps: '10/8/6/4', series_type: 'Pirâmide de Carga', rest_seconds: 120, technique_notes: 'Pirâmide de carga; se necessário, use elastico para completar as reps. Pausa de 90-120s.', block: 'emphasis' },
  { name: 'Desenvolvimento Halteres', muscle_group: 'Deltoides', sets: 4, reps: '12/10/8/6', series_type: 'Pirâmide de Carga', rest_seconds: 90, technique_notes: 'Pirâmide de carga com halteres; controle a descida. Pausa de 60-90s.', block: 'emphasis' },
  // Bloco 2 — Complementar: Membros Inferiores + Core (Hipertrofia/Metabólico)
  { name: 'Leg Press 45º', muscle_group: 'Quadríceps', sets: 3, reps: '15', series_type: 'Simple', rest_seconds: 60, technique_notes: 'Hipertrofia/metabólico; amplitude completa. Pausa de 45-60s.', block: 'complement' },
  { name: 'Cadeira Extensora', muscle_group: 'Quadríceps', sets: 3, reps: '12/15/17', series_type: 'Pirâmide Crescente', rest_seconds: 60, technique_notes: 'Pirâmide crescente; reduza a carga e aumente as reps. Pausa de 45-60s.', block: 'complement' },
  { name: 'Tríceps Pulley', muscle_group: 'Tríceps', sets: 3, reps: '20', series_type: 'Bi-set', rest_seconds: 0, technique_notes: 'Executar A1 sem descanso antes do A2. Bi-set metabólico.', biset_group: 'A', block: 'complement' },
  { name: 'Abdominal Supra', muscle_group: 'Core', sets: 3, reps: '15', series_type: 'Bi-set', rest_seconds: 60, technique_notes: 'Executar A2 imediatamente após A1; sem descanso entre os exercícios. Pausa de 60s após o bi-set.', biset_group: 'A', block: 'complement' },
];

export const ROI_FULLBODY_PRESCRIPTION: RoiPrescription[] = [
  // Bloco 1 — Ênfase: Fullbody (Força/Hipertrofia, pirâmide de carga)
  { name: 'Agachamento Livre', muscle_group: 'Quadríceps', sets: 4, reps: '12/10/8/6', series_type: 'Pirâmide de Carga', rest_seconds: 120, technique_notes: 'Pirâmide de carga: aumente progressivamente a carga. Pausa de 90-120s entre séries.', block: 'emphasis' },
  { name: 'Supino Reto', muscle_group: 'Peitoral', sets: 4, reps: '12/10/8/6', series_type: 'Pirâmide de Carga', rest_seconds: 120, technique_notes: 'Pirâmide de carga; priorize controle e amplitude. Pausa de 90-120s.', block: 'emphasis' },
  { name: 'Remada Curvada', muscle_group: 'Dorsais', sets: 4, reps: '10/8/6/4', series_type: 'Pirâmide de Carga', rest_seconds: 90, technique_notes: 'Pirâmide de carga; mantenha a coluna neutra. Pausa de 60-90s.', block: 'emphasis' },
  // Bloco 2 — Complementar: Metabólico/Core
  { name: 'Mesa Flexora', muscle_group: 'Posterior', sets: 3, reps: '15', series_type: 'Simple', rest_seconds: 60, technique_notes: 'Hipertrofia/metabólico; controle a fase excêntrica. Pausa de 45-60s.', block: 'complement' },
  { name: 'Desenvolvimento Halteres', muscle_group: 'Deltoides', sets: 3, reps: '12/15/17', series_type: 'Pirâmide Crescente', rest_seconds: 60, technique_notes: 'Pirâmide crescente; reduza a carga e aumente as reps. Pausa de 45-60s.', block: 'complement' },
  { name: 'Bíceps na Polia', muscle_group: 'Bíceps', sets: 3, reps: '20', series_type: 'Bi-set', rest_seconds: 0, technique_notes: 'Executar A1 sem descanso antes do A2. Bi-set metabólico.', biset_group: 'A', block: 'complement' },
  { name: 'Abdominal Infra', muscle_group: 'Core', sets: 3, reps: '15', series_type: 'Bi-set', rest_seconds: 60, technique_notes: 'Executar A2 imediatamente após A1; sem descanso entre os exercícios. Pausa de 60s após o bi-set.', biset_group: 'A', block: 'complement' },
];

export function findExerciseByName(exercises: Exercise[], name: string): Exercise | undefined {
  const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return exercises.find((exercise) => {
    const current = exercise.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return current === normalized || current.includes(normalized) || normalized.includes(current);
  });
}

function prescriptionForEmphasis(emphasis: EmphasisGroup): RoiPrescription[] {
  if (emphasis === 'Membros Superiores') return ROI_UPPER_BODY_PRESCRIPTION;
  if (emphasis === 'Fullbody') return ROI_FULLBODY_PRESCRIPTION;
  return ROI_LOWER_BODY_PRESCRIPTION;
}

export function buildRoiRows(
  exercises: Exercise[],
  workoutId: string,
  emphasis: EmphasisGroup,
): Array<Omit<WorkoutExercise, 'id' | 'created_at' | 'exercise'> & { exercise: Exercise }> {
  const prescription = prescriptionForEmphasis(emphasis);
  return prescription.flatMap((p, index) => {
    const exercise = findExerciseByName(exercises, p.name);
    if (!exercise) return [];
    return [{
      workout_id: workoutId,
      exercise_id: exercise.id,
      order_index: index,
      sets: p.sets,
      reps: p.reps,
      rest_seconds: p.rest_seconds,
      notes: p.technique_notes,
      series_type: p.series_type,
      technique_notes: p.technique_notes,
      biset_group: p.biset_group ?? null,
      exercise,
    }];
  });
}

// Retrocompatibilidade: builder antigo chamava buildRoiLowerBodyRows.
export function buildRoiLowerBodyRows(
  exercises: Exercise[],
  workoutId: string,
): Array<Omit<WorkoutExercise, 'id' | 'created_at' | 'exercise'> & { exercise: Exercise }> {
  return buildRoiRows(exercises, workoutId, 'Membros Inferiores');
}

export function goalForEmphasis(emphasis: EmphasisGroup): WorkoutGoal {
  return emphasis === 'Fullbody' ? 'Hipertrofia' : 'Hipertrofia';
}

import type { WorkoutGoal } from '@/types';

export function complementLabelFor(emphasis: EmphasisGroup): string {
  if (emphasis === 'Membros Superiores') return 'Membros Inferiores + Core';
  if (emphasis === 'Fullbody') return 'Metabólico + Core';
  return 'Membros Superiores + Core';
}

export function emphasisDescription(emphasis: EmphasisGroup): string {
  if (emphasis === 'Membros Superiores') {
    return 'Bloco 1 (Ênfase): 3 exercícios de força/hipertrofia para peitoral, dorsais e ombros em pirâmide de carga. Bloco 2 (Complementar): pernas, tríceps e core em hipertrofia/metabólico e bi-set.';
  }
  if (emphasis === 'Fullbody') {
    return 'Bloco 1 (Ênfase): 3 exercícios de força fullbody (agachamento, supino, remada) em pirâmide de carga. Bloco 2 (Complementar): posterior, ombros e core em metabólico e bi-set.';
  }
  return 'Bloco 1 (Ênfase): 3 exercícios de força/hipertrofia para pernas em pirâmide de carga. Bloco 2 (Complementar): dorsais, peitoral e core em hipertrofia/metabólico e bi-set.';
}
