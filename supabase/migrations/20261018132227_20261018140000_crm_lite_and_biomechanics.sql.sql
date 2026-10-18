/*
# ROI Shape — CRM Lite: pagamentos e contratos + biomecânica de exercícios

## Objetivo
Adiciona campos leves de CRM à tabela `profiles` (alunos) para que o Personal
acompanhe mensalidades e status de contrato diretamente do Dashboard, sem
precisar de uma tabela separada. Também adiciona uma coluna `biomechanics`
em `exercises` para classificar cada exercício do Método Fullbody ROI Shape
como "Tensão Mecânica" ou "Estresse Metabólico".

## Alterações em `profiles`
- `payment_status` (text): status do pagamento da mensalidade.
  Valores: 'paid' (em dia), 'pending' (a vencer), 'overdue' (atrasado).
  Padrão: 'paid'. Nulo não é permitido para simplificar a UI.
- `contract_due_date` (date): data de vencimento do contrato/mensalidade.
  Opcional (null) para alunos sem contrato formal.
- `contract_status` (text): status do contrato.
  Valores: 'active', 'pending', 'cancelled'. Padrão: 'active'.

## Alterações em `exercises`
- `biomechanics` (text): classificação biomecânica do Método ROI Shape.
  Valores: 'Tensão Mecânica', 'Estresse Metabólico', null.
  Opcional para manter compatibilidade com exercícios já cadastrados.

## Segurança
- Nenhuma política nova é necessária: as políticas existentes de `profiles`
  já permitem que o personal leia e atualize seus alunos
  (`profiles_update_students`: USING `assigned_personal_id = auth.uid()`).
- As políticas de `exercises` já permitem leitura por todos os autenticados
  e escrita apenas pelo admin.
- Nenhum dado existente é removido ou convertido.

## Notas
1. Os campos de CRM são opcionais — alunos antigos continuam funcionando.
2. O Dashboard do Personal calculará "mensalidades a vencer no mês" a partir
   de `contract_due_date` filtrando pelo mês/ano atual e `payment_status != 'paid'`.
3. A coluna `biomechanics` é populada por uma seed que classifica os exercícios
   existentes conforme o Método Fullbody Felipe Fubari / ROI Shape.
*/

-- ============= PROFILES: CRM LITE =============
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid'
  CHECK (payment_status IN ('paid','pending','overdue'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS contract_due_date date;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS contract_status text NOT NULL DEFAULT 'active'
  CHECK (contract_status IN ('active','pending','cancelled'));

-- Apenas alunos (role = 'student') fazem sentido ter esses campos;
-- mas para manter simples, deixamos as colunas em todas as linhas com defaults.

-- ============= EXERCISES: BIOMECÂNICA =============
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS biomechanics text
  CHECK (biomechanics IS NULL OR biomechanics IN ('Tensão Mecânica','Estresse Metabólico'));

CREATE INDEX IF NOT EXISTS idx_exercises_biomechanics ON exercises(biomechanics);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON profiles(payment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_contract_due_date ON profiles(contract_due_date);

-- ============= SEED: CLASSIFICAÇÃO BIOMECÂNICA =============
-- Tensão Mecânica = cargas elevadas, cadência controlada, baixas/médias reps
-- Estresse Metabólico = altas repetições, menor descanso, isolamento/burn

UPDATE exercises SET biomechanics = 'Tensão Mecânica' WHERE name IN (
  'Supino Reto com Halteres','Supino Reto Barra','Agachamento Livre','Leg Press',
  'Remada Curvada','Remada Baixa','Desenvolvimento Halteres','Elevação Pélvica',
  'Rosca Direta','Tríceps Pulley','Tríceps Francês','Deadlift','Stiff','Búlgaro',
  'Leg Press 45º','Mesa Flexora','Cadeira Extensora','Puxada Alta','Barra Fixa',
  'Crucifixo Inverso','Remada Alta','Goblet Squat'
);

UPDATE exercises SET biomechanics = 'Estresse Metabólico' WHERE name IN (
  'Crucifixo Inclinado','Crossover','Elevação Lateral','Elevação Frontal',
  'Pullover','Cadeira Flexora','Cadeira Abdutora','Coice de Glúteo',
  'Rosca Alternada','Rosca Martelo','Rosca Concentrada','Tríceps Coice',
  'Panturrilha em Pé','Panturrilha Sentado','Prancha','Abdominal Supra',
  'Abdominal Infra','Russian Twist','Hollow Hold','Flexão de Braço',
  'Afundo','Passada','Burpee','Polichinelo','Mountain Climber','Corrida',
  'Hip Hinge','Mobilidade de Quadril','Cat Cow','World Greatest Stretch'
);

-- Exercícios sem classificação ficam NULL (neutros / mobilidade pura).
