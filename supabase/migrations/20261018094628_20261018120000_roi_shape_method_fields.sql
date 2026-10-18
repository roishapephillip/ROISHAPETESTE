/*
# ROI Shape — Método Phillip Sarraff

1. Objetivo
- Adiciona ao motor de fichas os campos necessários para representar estritamente a metodologia Fullbody ROI Shape: ênfase, complemento, tipo de série, observações técnicas e agrupamento Bi-set.

2. Alterações na tabela `workouts`
- `emphasis_group`: grupo principal da sessão, como Membros Inferiores ou Membros Superiores.
- `complement_group`: grupo complementar da sessão.

3. Alterações na tabela `workout_exercises`
- `series_type`: Simple, Pyramid ou Bi-set.
- `technique_notes`: instruções de técnica e pausa em segundos.
- `biset_group`: identificador textual que vincula dois exercícios no mesmo Bi-set.
- Os campos existentes `sets`, `reps`, `rest_seconds` e `notes` são preservados.

4. Segurança e compatibilidade
- Nenhum dado existente é removido ou convertido.
- As colunas são opcionais para manter fichas antigas funcionando.
- As políticas RLS existentes das tabelas continuam protegendo as linhas conforme o treino pai.

5. Observações
- A aplicação valida e monta novas sessões com a composição ROI Shape: 3–4 exercícios de ênfase e 3–5 exercícios complementares, incluindo Bi-set quando aplicável.
*/

ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS emphasis_group text,
  ADD COLUMN IF NOT EXISTS complement_group text;

ALTER TABLE workout_exercises
  ADD COLUMN IF NOT EXISTS series_type text NOT NULL DEFAULT 'Simple',
  ADD COLUMN IF NOT EXISTS technique_notes text,
  ADD COLUMN IF NOT EXISTS biset_group text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workout_exercises_series_type_check'
  ) THEN
    ALTER TABLE workout_exercises
      ADD CONSTRAINT workout_exercises_series_type_check
      CHECK (series_type IN ('Simple', 'Pyramid', 'Bi-set'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_workout_exercises_biset_group
  ON workout_exercises(biset_group);
