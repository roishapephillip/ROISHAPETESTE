export type UserRole = 'admin' | 'personal' | 'student';

export type MuscleGroup =
  | 'Deltoides' | 'Peitoral' | 'Dorsais' | 'Quadríceps'
  | 'Glúteos' | 'Core' | 'Bíceps' | 'Tríceps'
  | 'Posterior' | 'Panturrilha' | 'Cardio';

export type ExerciseCategory = 'Musculação' | 'Funcional' | 'Calistenia' | 'Mobilidade';
export type Biomechanics = 'Tensão Mecânica' | 'Estresse Metabólico';

export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type ContractStatus = 'active' | 'pending' | 'cancelled';

export type WorkoutGoal =
  | 'Hipertrofia' | 'Força' | 'Definição' | 'Emagrecimento'
  | 'Funcional' | 'Mobilidade' | 'Calistenia';

export type WorkoutStatus = 'active' | 'paused' | 'completed';
export type SeriesType = 'Simple' | 'Pyramid' | 'Bi-set';
export type EmphasisGroup = 'Membros Inferiores' | 'Membros Superiores' | 'Fullbody';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  assigned_personal_id: string | null;
  created_at: string;
  updated_at: string;
  payment_status: PaymentStatus;
  contract_due_date: string | null;
  contract_status: ContractStatus;
  must_change_password: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  category: ExerciseCategory;
  biomechanics: Biomechanics | null;
  video_url: string | null;
  description: string | null;
  created_at: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  goal: WorkoutGoal;
  description: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Workout {
  id: string;
  name: string;
  goal: WorkoutGoal | null;
  notes: string | null;
  student_id: string;
  personal_id: string;
  template_id: string | null;
  emphasis_group: EmphasisGroup | null;
  complement_group: string | null;
  status: WorkoutStatus;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  series_type: SeriesType;
  technique_notes: string | null;
  biset_group: string | null;
  notes: string | null;
  created_at: string;
  exercise?: Exercise;
}

export interface WorkoutWithDetails extends Workout {
  student?: Pick<Profile, 'id' | 'full_name' | 'email' | 'phone'>;
  workout_exercises?: WorkoutExercise[];
}
