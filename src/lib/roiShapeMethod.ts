import type { Exercise, MuscleGroup, WorkoutExercise, WorkoutGoal } from '@/types';

export type EmphasisGroup = 'Membros Inferiores' | 'Membros Superiores' | 'Fullbody';
export type SeriesType = 'Simple' | 'Pyramid' | 'Bi-set';

interface RoiPrescription {
  name: string;
  muscle_group: MuscleGroup;
  sets: number;
  reps: string;
  series_type: SeriesType;
  rest_seconds: number;
  technique_notes: string;
  biset_group?: string;
}

export const ROI_LOWER_BODY_PRESCRIPTION: RoiPrescription[] = [
  { name: 'Agachamento Livre', muscle_group: 'Quadríceps', sets: 4, reps: '12/10/8/6', series_type: 'Pyramid', rest_seconds: 120, technique_notes: 'Pirâmide de carga: aumente progressivamente a carga mantendo a técnica.' },
  { name: 'Leg Press 45º', muscle_group: 'Quadríceps', sets: 4, reps: '15/12/10/8', series_type: 'Pyramid', rest_seconds: 120, technique_notes: 'Pirâmide de carga com amplitude controlada.' },
  { name: 'Mesa Flexora', muscle_group: 'Posterior', sets: 4, reps: '10/8/6/4', series_type: 'Pyramid', rest_seconds: 90, technique_notes: 'Pirâmide de carga; controle a fase excêntrica.' },
  { name: 'Remada Triângulo', muscle_group: 'Dorsais', sets: 3, reps: '15', series_type: 'Simple', rest_seconds: 60, technique_notes: 'Hipertrofia/metabólico; contraia as escápulas no final.' },
  { name: 'Crucifixo Máquina', muscle_group: 'Peitoral', sets: 3, reps: '12/15/17', series_type: 'Pyramid', rest_seconds: 60, technique_notes: 'Pirâmide crescente; priorize controle e amplitude.' },
  { name: 'Bíceps na Polia', muscle_group: 'Bíceps', sets: 3, reps: '20', series_type: 'Bi-set', rest_seconds: 0, technique_notes: 'Executar A1 sem descanso antes do A2.', biset_group: 'A' },
  { name: 'Abdominal Infra', muscle_group: 'Core', sets: 3, reps: '15', series_type: 'Bi-set', rest_seconds: 60, technique_notes: 'Executar A2 imediatamente após A1; sem descanso entre os exercícios.', biset_group: 'A' },
];

export function findExerciseByName(exercises: Exercise[], name: string): Exercise | undefined {
  const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return exercises.find((exercise) => {
    const current = exercise.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return current === normalized || current.includes(normalized) || normalized.includes(current);
  });
}

export function buildRoiLowerBodyRows(exercises: Exercise[], workoutId: string): Array<Omit<WorkoutExercise, 'id' | 'created_at' | 'exercise'> & { exercise: Exercise }> {
  return ROI_LOWER_BODY_PRESCRIPTION.flatMap((prescription, index) => {
    const exercise = findExerciseByName(exercises, prescription.name);
    if (!exercise) return [];
    return [{
      workout_id: workoutId,
      exercise_id: exercise.id,
      order_index: index,
      sets: prescription.sets,
      reps: prescription.reps,
      rest_seconds: prescription.rest_seconds,
      notes: prescription.technique_notes,
      series_type: prescription.series_type,
      technique_notes: prescription.technique_notes,
      biset_group: prescription.biset_group ?? null,
      exercise,
    }];
  });
}

export function goalForEmphasis(emphasis: EmphasisGroup): WorkoutGoal {
  return emphasis === 'Fullbody' ? 'Hipertrofia' : 'Hipertrofia';
}
