/*
# ROI Shape - Core Schema

## Overview
This migration creates the complete database schema for the ROI Shape fitness platform,
a B2B SaaS where Personal Trainers manage students, exercises, and workout programs.

## New Tables
1. `profiles` - Extends auth.users with role (admin/personal/student) and display info
2. `exercises` - Global exercise library with vertical YouTube videos
3. `workout_templates` - Pre-built workout templates (50+ Sarraf Method presets)
4. `workouts` - Actual workout programs assigned to students by personals
5. `workout_exercises` - Exercises within a workout (ordered, with sets/reps/rest)

## Roles
- `admin`: Master admin (roishape2026@gmail.com) - manages global exercise library
- `personal`: Personal trainer - creates students, assigns workouts
- `student`: Student - views assigned workouts with vertical video player

## Security (RLS)
- profiles: users read/update own; personals read their students; admin reads all
- exercises: public read (all authenticated), only admin can write
- workout_templates: public read; admin can write all; personals write their own
- workouts: personals read/write their own; students read their assigned
- workout_exercises: access follows parent workout ownership
*/

-- ============= PROFILES =============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'personal' CHECK (role IN ('admin','personal','student')),
  phone text,
  avatar_url text,
  assigned_personal_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_related" ON profiles;
CREATE POLICY "profiles_select_own_or_related" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR assigned_personal_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_student_by_personal" ON profiles;
CREATE POLICY "profiles_insert_student_by_personal" ON profiles FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','personal')
    )
    AND assigned_personal_id = auth.uid()
  );

DROP POLICY IF EXISTS "profiles_update_students" ON profiles;
CREATE POLICY "profiles_update_students" ON profiles FOR UPDATE
  TO authenticated
  USING (assigned_personal_id = auth.uid())
  WITH CHECK (assigned_personal_id = auth.uid());

-- ============= EXERCISES =============
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text NOT NULL CHECK (muscle_group IN ('Deltoides','Peitoral','Dorsais','Quadríceps','Glúteos','Core','Bíceps','Tríceps','Posterior','Panturrilha','Cardio')),
  category text NOT NULL CHECK (category IN ('Musculação','Funcional','Calistenia','Mobilidade')),
  video_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exercises_select_all" ON exercises;
CREATE POLICY "exercises_select_all" ON exercises FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "exercises_insert_admin" ON exercises;
CREATE POLICY "exercises_insert_admin" ON exercises FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "exercises_update_admin" ON exercises;
CREATE POLICY "exercises_update_admin" ON exercises FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "exercises_delete_admin" ON exercises;
CREATE POLICY "exercises_delete_admin" ON exercises FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============= WORKOUT TEMPLATES =============
CREATE TABLE IF NOT EXISTS workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  goal text NOT NULL CHECK (goal IN ('Hipertrofia','Força','Definição','Emagrecimento','Funcional','Mobilidade','Calistenia')),
  description text,
  is_public boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates_select_all" ON workout_templates;
CREATE POLICY "templates_select_all" ON workout_templates FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "templates_insert_any" ON workout_templates;
CREATE POLICY "templates_insert_any" ON workout_templates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "templates_update_own" ON workout_templates;
CREATE POLICY "templates_update_own" ON workout_templates FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "templates_delete_own" ON workout_templates;
CREATE POLICY "templates_delete_own" ON workout_templates FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- ============= WORKOUTS =============
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  goal text CHECK (goal IN ('Hipertrofia','Força','Definição','Emagrecimento','Funcional','Mobilidade','Calistenia')),
  notes text,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  personal_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES workout_templates(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workouts_select_owner_or_student" ON workouts;
CREATE POLICY "workouts_select_owner_or_student" ON workouts FOR SELECT
  TO authenticated USING (
    personal_id = auth.uid()
    OR student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "workouts_insert_personal" ON workouts;
CREATE POLICY "workouts_insert_personal" ON workouts FOR INSERT
  TO authenticated WITH CHECK (
    personal_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "workouts_update_personal" ON workouts;
CREATE POLICY "workouts_update_personal" ON workouts FOR UPDATE
  TO authenticated USING (
    personal_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    personal_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "workouts_delete_personal" ON workouts;
CREATE POLICY "workouts_delete_personal" ON workouts FOR DELETE
  TO authenticated USING (
    personal_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============= WORKOUT EXERCISES =============
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index int NOT NULL DEFAULT 0,
  sets int NOT NULL DEFAULT 3,
  reps text NOT NULL DEFAULT '10-12',
  rest_seconds int NOT NULL DEFAULT 60,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workout_exercises_select_via_workout" ON workout_exercises;
CREATE POLICY "workout_exercises_select_via_workout" ON workout_exercises FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_exercises.workout_id
      AND (w.personal_id = auth.uid() OR w.student_id = auth.uid()
           OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

DROP POLICY IF EXISTS "workout_exercises_insert_via_workout" ON workout_exercises;
CREATE POLICY "workout_exercises_insert_via_workout" ON workout_exercises FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_exercises.workout_id
      AND (w.personal_id = auth.uid()
           OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

DROP POLICY IF EXISTS "workout_exercises_update_via_workout" ON workout_exercises;
CREATE POLICY "workout_exercises_update_via_workout" ON workout_exercises FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_exercises.workout_id
      AND (w.personal_id = auth.uid()
           OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_exercises.workout_id
      AND (w.personal_id = auth.uid()
           OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

DROP POLICY IF EXISTS "workout_exercises_delete_via_workout" ON workout_exercises;
CREATE POLICY "workout_exercises_delete_via_workout" ON workout_exercises FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_exercises.workout_id
      AND (w.personal_id = auth.uid()
           OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- ============= INDEXES =============
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_personal ON profiles(assigned_personal_id);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_workouts_student ON workouts(student_id);
CREATE INDEX IF NOT EXISTS idx_workouts_personal ON workouts(personal_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);

-- ============= TRIGGERS: auto-create profile on signup =============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'personal')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= UPDATE updated_at =============
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS workouts_updated_at ON workouts;
CREATE TRIGGER workouts_updated_at BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============= SEED: EXERCISES (global library) =============
INSERT INTO exercises (name, muscle_group, category, video_url, description) VALUES
('Supino Reto com Halteres','Peitoral','Musculação','https://www.youtube.com/watch?v=dBqjVUZ3PLc','Foco em abertura e contração do peitoral'),
('Supino Reto Barra','Peitoral','Musculação','https://www.youtube.com/watch?v=BYLgQ5BQ9gQ','Movimento base para peitoral'),
('Crucifixo Inclinado','Peitoral','Musculação','https://www.youtube.com/watch?v=eoZHXI3FQoU','Isolamento de peitoral superior'),
('Crossover','Peitoral','Musculação','https://www.youtube.com/watch?v=I5rQ3r3mVgU','Isolamento peitoral com cabos'),
('Flexão de Braço','Peitoral','Calistenia','https://www.youtube.com/watch?v=IODxDxX7oiM','Exercício calistênico base'),
('Desenvolvimento Halteres','Deltoides','Musculação','https://www.youtube.com/watch?v=qAavxIq3yEU','Desenvolvimento de ombros'),
('Elevação Lateral','Deltoides','Musculação','https://www.youtube.com/watch?v=3VcKaXpzqRo','Isolamento deltoide lateral'),
('Elevação Frontal','Deltoides','Musculação','https://www.youtube.com/watch?v=Gy8jJcE9b7Y','Isolamento deltoide anterior'),
('Crucifixo Inverso','Deltoides','Musculação','https://www.youtube.com/watch?v=SoQQkq2dGzA','Deltoide posterior'),
('Remada Alta','Deltoides','Musculação','https://www.youtube.com/watch?v=QHRJrAgqHFc','Trapézio e deltoide'),
('Puxada Alta','Dorsais','Musculação','https://www.youtube.com/watch?v=OxlzjX3dO9Q','Dorsais com cabos'),
('Barra Fixa','Dorsais','Calistenia','https://www.youtube.com/watch?v=eGo4IY1poAE','Tração dorsal calistênica'),
('Remada Curvada','Dorsais','Musculação','https://www.youtube.com/watch?v=-Bhcyt7tBxM','Dorsais e core'),
('Remada Baixa','Dorsais','Musculação','https://www.youtube.com/watch?v=Gjw3v9Qq7CM','Dorsais no triangular'),
('Pullover','Dorsais','Musculação','https://www.youtube.com/watch?v=kx5jJX3zRk8','Isolamento dorsal'),
('Agachamento Livre','Quadríceps','Musculação','https://www.youtube.com/watch?v=ultWZbUMQ8M','Rei dos exercícios'),
('Leg Press','Quadríceps','Musculação','https://www.youtube.com/watch?v=IZxFjMB7PqQ','Quadríceps guiado'),
('Cadeira Extensora','Quadríceps','Musculação','https://www.youtube.com/watch?v=TeETxLhXuBw','Isolamento quadríceps'),
('Afundo','Quadríceps','Funcional','https://www.youtube.com/watch?v=Q7QA0fN7YEU','Funcional unilateral'),
('Passada','Quadríceps','Funcional','https://www.youtube.com/watch?v=NO_7jLpBkxE','Mobilidade e força'),
('Stiff','Posterior','Musculação','https://www.youtube.com/watch?v=SynWp0HqKwM','Posterior de coxa'),
('Cadeira Flexora','Posterior','Musculação','https://www.youtube.com/watch?v=ULWdC8eTNOU','Isolamento posterior'),
('Mesa Flexora','Posterior','Musculação','https://www.youtube.com/watch?v=I5rQ3r3mVgU','Posterior deitado'),
('Elevação Pélvica','Glúteos','Musculação','https://www.youtube.com/watch?v=OUgsSvZWbGw','Hip thrust'),
('Cadeira Abdutora','Glúteos','Musculação','https://www.youtube.com/watch?v=HYUVjC2IQHg','Glúteo médio'),
('Coice de Glúteo','Glúteos','Funcional','https://www.youtube.com/watch?v=ZNZJ-Yej5y4','Funcional para glúteo'),
('Búlgaro','Glúteos','Musculação','https://www.youtube.com/watch?v=OFvYJZtNIxQ','Afundo búlgaro'),
('Prancha','Core','Calistenia','https://www.youtube.com/watch?v=ASdvN_XEl_c','Estabilidade de core'),
('Abdominal Supra','Core','Musculação','https://www.youtube.com/watch?v=1fbP2j1V7yA','Abdominal clássico'),
('Abdominal Infra','Core','Musculação','https://www.youtube.com/watch?v=mkvFGJYbLI8','Abdominal inferior'),
('Russian Twist','Core','Funcional','https://www.youtube.com/watch?v=wkD8-rjkZRs','Rotação de tronco'),
('Hollow Hold','Core','Calistenia','https://www.youtube.com/watch?v=2WE9Kz3zOqg','Core estático'),
('Rosca Direta','Bíceps','Musculação','https://www.youtube.com/watch?v=kwib0p9Zj8M','Bíceps com barra'),
('Rosca Alternada','Bíceps','Musculação','https://www.youtube.com/watch?v=kJjVj2xa5Rg','Bíceps com halteres'),
('Rosca Martelo','Bíceps','Musculação','https://www.youtube.com/watch?v=zC3K2nPg8qs','Bíceps e braquiorradial'),
('Rosca Concentrada','Bíceps','Musculação','https://www.youtube.com/watch?v=0AVYvV4h5ZQ','Isolamento bíceps'),
('Tríceps Pulley','Tríceps','Musculação','https://www.youtube.com/watch?v=2-LAM7t6OKE','Tríceps na polia'),
('Tríceps Francês','Tríceps','Musculação','https://www.youtube.com/watch?v=2JWqz3y3gRw','Tríceps deitado'),
('Tríceps Coice','Tríceps','Musculação','https://www.youtube.com/watch?v=KbE_yy7nO5Q','Tríceps no cabos'),
('Mergulho','Tríceps','Calistenia','https://www.youtube.com/watch?v=2z8Jp6n4Oss','Dips para tríceps'),
('Panturrilha em Pé','Panturrilha','Musculação','https://www.youtube.com/watch?v=ZqjJyL3wZ6c','Gastrocnêmio'),
('Panturrilha Sentado','Panturrilha','Musculação','https://www.youtube.com/watch?v=OdbM8qY-lbY','Sóleo'),
('Corrida','Cardio','Funcional','https://www.youtube.com/watch?v=ULT3qXq7tZ4','Cardio aeróbico'),
('Burpee','Cardio','Funcional','https://www.youtube.com/watch?v=5iYvYn7qWdk','Cardio full body'),
('Polichinelo','Cardio','Funcional','https://www.youtube.com/watch?v=c4DAnQ6Dt5Y','Cardio base'),
('Mountain Climber','Core','Funcional','https://www.youtube.com/watch?v=nmwgirgXLUY','Core e cardio'),
('Goblet Squat','Quadríceps','Funcional','https://www.youtube.com/watch?v=MeIiIdhgPug','Agachamento com kettlebell'),
('Deadlift','Posterior','Musculação','https://www.youtube.com/watch?v=op9kVnSso6Q','Levantamento terra'),
('Hip Hinge','Posterior','Mobilidade','https://www.youtube.com/watch?v=oN9pGw5T3qg','Padrão de movimento'),
('Mobilidade de Quadril','Glúteos','Mobilidade','https://www.youtube.com/watch?v=FSSjZ3p5O2Q','Mobilidade articular'),
('Cat Cow','Core','Mobilidade','https://www.youtube.com/watch?v=oN9pGw5T3qg','Mobilidade de coluna'),
('World Greatest Stretch','Core','Mobilidade','https://www.youtube.com/watch?v=uT9pQdvE3wI','Mobilidade global')
ON CONFLICT DO NOTHING;

-- ============= SEED: 50+ WORKOUT TEMPLATES (Sarraf Method) =============
INSERT INTO workout_templates (name, goal, description, is_public, created_by) VALUES
('Full Body Hipertrofia A','Hipertrofia','Treino full body focado em tensão mecânica - 3x por semana', true, NULL),
('Full Body Hipertrofia B','Hipertrofia','Treino full body complementar - dia B', true, NULL),
('Upper Lower A - Força','Força','Membros superiores focado em força', true, NULL),
('Upper Lower B - Hipertrofia','Hipertrofia','Membros inferiores focado em hipertrofia', true, NULL),
('Push A - Peitoral e Tríceps','Hipertrofia','Empurrar - peitoral, ombros e tríceps', true, NULL),
('Pull A - Dorsais e Bíceps','Hipertrofia','Puxar - dorsais e bíceps', true, NULL),
('Leg A - Quadríceps e Glúteos','Hipertrofia','Pernas - quadríceps, glúteos e posterior', true, NULL),
('Push B - Ombros Focus','Hipertrofia','Empurrar - ênfase em deltotoides', true, NULL),
('Pull B - Costas Largas','Hipertrofia','Puxar - ênfase em dorsais', true, NULL),
('Leg B - Posterior Focus','Hipertrofia','Pernas - ênfase em posterior e glúteos', true, NULL),
('ABC Hipertrofia 1','Hipertrofia','Divisão ABC clássica - dia A', true, NULL),
('ABC Hipertrofia 2','Hipertrofia','Divisão ABC clássica - dia B', true, NULL),
('ABC Hipertrofia 3','Hipertrofia','Divisão ABC clássica - dia C', true, NULL),
('ABCD Hipertrofia 1','Hipertrofia','Divisão ABCD - peitoral', true, NULL),
('ABCD Hipertrofia 2','Hipertrofia','Divisão ABCD - dorsais', true, NULL),
('ABCD Hipertrofia 3','Hipertrofia','Divisão ABCD - pernas', true, NULL),
('ABCD Hipertrofia 4','Hipertrofia','Divisão ABCD - ombros e braços', true, NULL),
('Força 5x5 - A','Força','Treino de força 5x5 - agachamento e supino', true, NULL),
('Força 5x5 - B','Força','Treino de força 5x5 - levantamento terra e remada', true, NULL),
('Força 5x5 - C','Força','Treino de força 5x5 - agachamento e desenvolvimento', true, NULL),
('Definição Full Body 1','Definição','Full body metabólico - alta repetição e curto descanso', true, NULL),
('Definição Full Body 2','Definição','Full body metabólico - dia B', true, NULL),
('Definição HIIT + Weights','Definição','Circuito misto HIIT com pesos', true, NULL),
('Definição Push Pull','Definição','Push pull com ênfase metabólica', true, NULL),
('Definição Leg Burnout','Definição','Pernas metabólicas - drop sets', true, NULL),
('Emagrecimento HIIT 1','Emagrecimento','HIIT full body 20 min', true, NULL),
('Emagrecimento HIIT 2','Emagrecimento','HIIT com kettlebell e bodyweight', true, NULL),
('Emagrecimento Cardio + Core','Emagrecimento','Cardio intervalado com core', true, NULL),
('Emagrecimento Tabata','Emagrecimento','Tabata 4 minutos x 6 blocos', true, NULL),
('Emagrecimento Metabólico','Emagrecimento','Circuito metabólico 30/30', true, NULL),
('Funcional Full Body 1','Funcional','Treino funcional - padrões fundamentais', true, NULL),
('Funcional Full Body 2','Funcional','Treino funcional - potência e agilidade', true, NULL),
('Funcional Unilateral','Funcional','Treino unilateral funcional', true, NULL),
('Funcional Core & Stability','Funcional','Core e estabilidade', true, NULL),
('Funcional EMOM 15','Funcional','EMOM 15 minutos', true, NULL),
('Funcional AMRAP 20','Funcional','AMRAP 20 minutos', true, NULL),
('Calistenia Push','Calistenia','Calistenia - empurrar', true, NULL),
('Calistenia Pull','Calistenia','Calistenia - puxar', true, NULL),
('Calistenia Legs','Calistenia','Calistenia - pernas', true, NULL),
('Calistenia Full','Calistenia','Calistenia - full body', true, NULL),
('Mobilidade Full','Mobilidade','Rotina de mobilidade full body', true, NULL),
('Mobilidade Quadril','Mobilidade','Mobilidade específica de quadril', true, NULL),
('Mobilidade Ombros','Mobilidade','Mobilidade de ombros e tórax', true, NULL),
('Mobilidade Coluna','Mobilidade','Mobilidade de coluna e core', true, NULL),
('Mobilidade Recover','Mobilidade','Recuperação ativa e mobilidade', true, NULL),
('Glúteos Focus 1','Hipertrofia','Treino focado em glúteos - dia 1', true, NULL),
('Glúteos Focus 2','Hipertrofia','Treino focado em glúteos - dia 2', true, NULL),
('Braços Focus','Hipertrofia','Treino de braços - bíceps e tríceps', true, NULL),
('Ombros Focus','Hipertrofia','Treino focado em deltotoides', true, NULL),
('Core Strengthening','Hipertrofia','Core e abdômen completo', true, NULL),
('Iniciante Full Body','Hipertrofia','Full body para iniciantes - máquinas', true, NULL),
('Intermediário Split','Hipertrofia','Split para nível intermediário', true, NULL),
('Avançado Volume','Hipertrofia','Volume alto para avançados', true, NULL)
ON CONFLICT DO NOTHING;
