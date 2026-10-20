import { useEffect, useState } from 'react';
import { Dumbbell, ArrowLeft, Pencil, ListPlus, Trash2, Save, X, Plus, GripVertical, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { VerticalVideoPlayer } from '@/components/ui/VerticalVideoPlayer';
import { formatRest, formatDate } from '@/lib/utils';
import type { Exercise, MuscleGroup, ExerciseCategory, SeriesType, Workout, WorkoutExercise } from '@/types';

const MUSCLE_GROUPS: MuscleGroup[] = ['Deltoides', 'Peitoral', 'Dorsais', 'Quadríceps', 'Glúteos', 'Core', 'Bíceps', 'Tríceps', 'Posterior', 'Panturrilha', 'Cardio'];

interface FullWorkout extends Workout {
  student?: { full_name: string; email: string };
  workout_exercises?: Array<WorkoutExercise & { exercise?: Exercise }>;
}

export function WorkoutDetail({ workoutId, editMode }: { workoutId: string; editMode?: boolean }) {
  const { role } = useAuth();
  const { navigate } = useNav();
  const [workout, setWorkout] = useState<FullWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(editMode ?? false);
  const [items, setItems] = useState<Array<WorkoutExercise & { exercise?: Exercise }>>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: w }, { data: exs }] = await Promise.all([
        supabase
          .from('workouts')
          .select('*, student:profiles!workouts_student_id_fkey(full_name, email), workout_exercises(id, workout_id, exercise_id, order_index, sets, reps, rest_seconds, series_type, technique_notes, biset_group, notes, created_at, exercise:exercises(*))')
          .eq('id', workoutId)
          .maybeSingle(),
        supabase.from('exercises').select('*').order('name'),
      ]);
      const full = w as unknown as FullWorkout | null;
      setWorkout(full);
      setItems((full?.workout_exercises ?? []) as Array<WorkoutExercise & { exercise?: Exercise }>);
      setExercises((exs ?? []) as Exercise[]);
      setLoading(false);
    }
    load();
  }, [workoutId]);

  const canEdit = role !== 'student';

  async function saveItem(updated: WorkoutExercise & { exercise?: Exercise }) {
    setSaving(true);
    const { error } = await supabase
      .from('workout_exercises')
      .update({ sets: updated.sets, reps: updated.reps, rest_seconds: updated.rest_seconds, series_type: updated.series_type, technique_notes: updated.technique_notes, biset_group: updated.biset_group, notes: updated.notes })
      .eq('id', updated.id);
    setSaving(false);
    if (error) { setError(error.message); return; }
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function removeItem(id: string) {
    const { error: deleteError } = await supabase.from('workout_exercises').delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function addExercise(ex: Exercise) {
    const orderIndex = items.length;
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert({ workout_id: workoutId, exercise_id: ex.id, order_index: orderIndex, sets: 3, reps: '10-12', rest_seconds: 60, series_type: 'Simple', technique_notes: null, biset_group: null })
      .select('id, workout_id, exercise_id, order_index, sets, reps, rest_seconds, series_type, technique_notes, biset_group, notes, created_at, exercise:exercises(*)')
      .maybeSingle();
    if (error || !data) { setError(error?.message ?? 'Não foi possível adicionar o exercício.'); return; }
    setItems((prev) => [...prev, data as unknown as WorkoutExercise & { exercise?: Exercise }]);
    setAddOpen(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!workout) {
    return <EmptyState icon={<Dumbbell className="h-7 w-7" />} title="Treino não encontrado" />;
  }

  const filteredExercises = exercises.filter((e) => {
    if (muscleFilter !== 'all' && e.muscle_group !== muscleFilter) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groupedBlocks = buildBlocks(items);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={workout.name}
        description={workout.student ? `Aluno: ${workout.student.full_name} · ${formatDate(workout.created_at)}` : formatDate(workout.created_at)}
        back={{ label: 'Treinos', onClick: () => navigate({ name: 'workouts' }) }}
        actions={canEdit && (
          <Button variant={edit ? 'primary' : 'outline'} leftIcon={edit ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />} onClick={() => setEdit(!edit)}>
            {edit ? 'Concluído' : 'Editar ficha'}
          </Button>
        )}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {workout.goal && <Badge tone="brand">{workout.goal}</Badge>}
        <Badge tone={workout.status === 'active' ? 'green' : workout.status === 'paused' ? 'orange' : 'gray'}>
          {workout.status === 'active' ? 'Ativo' : workout.status === 'paused' ? 'Pausado' : 'Concluído'}
        </Badge>
        <Badge tone="gray">{items.length} exercício{items.length !== 1 ? 's' : ''}</Badge>
      </div>

      {workout.notes && (
        <div className="mb-6 rounded-xl bg-ink-50 border border-ink-100 p-4 text-sm text-ink-700">
          <p className="font-bold text-ink-900 mb-1">Observações</p>
          <p className="leading-relaxed">{workout.notes}</p>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<ListPlus className="h-7 w-7" />}
          title="Ficha vazia"
          description={canEdit ? 'Adicione exercícios da biblioteca para montar esta ficha.' : 'Seu personal ainda não adicionou exercícios.'}
          action={canEdit && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Adicionar exercício</Button>}
        />
      ) : (
        <div className="space-y-5">
          {groupedBlocks.map((block) => (
            <div key={block.key} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-6 items-center rounded-full px-3 text-xs font-bold uppercase tracking-wide ${block.tone === 'emphasis' ? 'bg-brand-100 text-brand-800' : 'bg-blue-100 text-blue-800'}`}>
                  {block.label}
                </span>
                <span className="h-px flex-1 bg-ink-100" />
              </div>
              {block.items.map((item) => {
                const globalIdx = items.indexOf(item);
                return (
                  <ExerciseRow
                    key={item.id}
                    item={item}
                    index={globalIdx + 1}
                    edit={edit}
                    onSave={saveItem}
                    onRemove={() => removeItem(item.id)}
                    saving={saving}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}

      {canEdit && edit && items.length > 0 && (
        <div className="mt-4">
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
            Adicionar exercício
          </Button>
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Adicionar exercício"
        description="Escolha um exercício da biblioteca para incluir na ficha."
        size="lg"
      >
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <Input placeholder="Buscar exercício..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Plus className="h-4 w-4" />} />
          <Select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} className="min-w-[150px]">
            <option value="all">Todos os músculos</option>
            {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin space-y-1.5">
          {filteredExercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => addExercise(ex)}
              className="flex w-full items-center gap-3 rounded-xl border border-ink-100 p-3 text-left transition-all hover:border-brand-300 hover:bg-brand-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">{ex.name}</p>
                <p className="text-xs text-ink-500">{ex.muscle_group} · {ex.category}</p>
              </div>
              <Plus className="h-4 w-4 text-ink-400" />
            </button>
          ))}
        </div>
      </Modal>

      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}

function ExerciseRow({
  item, index, edit, onSave, onRemove, saving,
}: {
  item: WorkoutExercise & { exercise?: Exercise };
  index: number;
  edit: boolean;
  onSave: (i: WorkoutExercise & { exercise?: Exercise }) => void;
  onRemove: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState({ sets: item.sets, reps: item.reps, rest_seconds: item.rest_seconds, series_type: item.series_type ?? 'Simple' as SeriesType, technique_notes: item.technique_notes ?? '', biset_group: item.biset_group ?? '', notes: item.notes ?? '' });
  const ex = item.exercise;

  const seriesTag = seriesTagFor(item.series_type);
  const bisetRole = bisetRoleFor(item);
  const isBiset = item.series_type === 'Bi-set' && item.biset_group;

  if (edit) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-xs font-bold text-white">{index}</div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink-900">{ex?.name ?? 'Exercício'}</p>
            <p className="text-xs text-ink-500">{ex?.muscle_group} · {ex?.category}</p>
          </div>
          <button onClick={onRemove} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input label="Séries" type="number" min={1} value={draft.sets} onChange={(e) => setDraft({ ...draft, sets: Number(e.target.value) })} />
          <Input label="Repetições" placeholder="Ex.: 12/10/8/6 ou 15" value={draft.reps} onChange={(e) => setDraft({ ...draft, reps: e.target.value })} />
          <Input label="Descanso (s)" type="number" min={0} value={draft.rest_seconds} onChange={(e) => setDraft({ ...draft, rest_seconds: Number(e.target.value) })} />
          <Select label="Tipo de Série" value={draft.series_type} onChange={(e) => setDraft({ ...draft, series_type: e.target.value as SeriesType })}>
            <option value="Simple">Simples</option>
            <option value="Pirâmide de Carga">Pirâmide de Carga</option>
            <option value="Pirâmide Crescente">Pirâmide Crescente</option>
            <option value="Bi-set">Bi-set</option>
            <option value="Super-Série">Super-Série</option>
          </Select>
          <Input label="Grupo do Bi-set" placeholder="Ex.: A" value={draft.biset_group} onChange={(e) => setDraft({ ...draft, biset_group: e.target.value })} />
        </div>
        <Textarea label="Observações da técnica / pausa / cadência" rows={2} className="mt-3" placeholder="Ex.: Pausa de 60s entre séries; cadência 2-1-2" value={draft.technique_notes} onChange={(e) => setDraft({ ...draft, technique_notes: e.target.value, notes: e.target.value })} />
        <div className="mt-3 flex justify-end">
          <Button size="sm" leftIcon={<Save className="h-4 w-4" />} loading={saving} onClick={() => onSave({ ...item, ...draft })}>Salvar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-sm font-bold text-white">{index}</div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-ink-900 leading-snug">{ex?.name ?? 'Exercício'}</h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ex && <Badge tone="brand">{ex.muscle_group}</Badge>}
              {ex && <Badge tone="gray">{ex.category}</Badge>}
              {seriesTag && <Badge tone={seriesTag.tone as 'green' | 'blue' | 'orange' | 'purple' | 'gray'}>{seriesTag.label}</Badge>}
              {isBiset && <Badge tone="purple">{item.biset_group}{bisetRole}</Badge>}
            </div>
          </div>
        </div>

        {ex?.video_url && (
          <div className="mt-4 flex justify-center sm:justify-start">
            <div className="w-40 sm:w-44"><VerticalVideoPlayer url={ex.video_url} title={ex.name} /></div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-ink-50 px-3 py-2.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Séries</p>
            <p className="mt-0.5 text-lg font-extrabold text-ink-900">{item.sets}</p>
          </div>
          <div className="rounded-xl bg-ink-50 px-3 py-2.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Reps</p>
            <p className="mt-0.5 text-lg font-extrabold text-ink-900">{item.reps}</p>
          </div>
          <div className="rounded-xl bg-ink-50 px-3 py-2.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Descanso</p>
            <p className="mt-0.5 text-lg font-extrabold text-ink-900">{formatRest(item.rest_seconds)}</p>
          </div>
        </div>

        {(item.technique_notes || item.notes) && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800">
            <Clock className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{item.technique_notes || item.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

type BlockKey = 'emphasis' | 'complement';

interface BlockGroup {
  key: BlockKey;
  label: string;
  tone: BlockKey;
  items: Array<WorkoutExercise & { exercise?: Exercise }>;
}

function buildBlocks(items: Array<WorkoutExercise & { exercise?: Exercise }>): BlockGroup[] {
  const emphasisTypes: SeriesType[] = ['Pirâmide de Carga', 'Pyramid'];
  const groups: BlockGroup[] = [
    { key: 'emphasis', label: 'Bloco 1 — Ênfase', tone: 'emphasis', items: [] },
    { key: 'complement', label: 'Bloco 2 — Complementar', tone: 'complement', items: [] },
  ];
  items.forEach((item) => {
    if (emphasisTypes.includes(item.series_type)) {
      groups[0].items.push(item);
    } else {
      groups[1].items.push(item);
    }
  });
  return groups.filter((g) => g.items.length > 0);
}

function seriesTagFor(seriesType: SeriesType): { tone: string; label: string } | null {
  switch (seriesType) {
    case 'Pirâmide de Carga':
      return { tone: 'green', label: 'Pirâmide de Carga' };
    case 'Pirâmide Crescente':
      return { tone: 'blue', label: 'Pirâmide Crescente' };
    case 'Pyramid':
      return { tone: 'green', label: 'Pirâmide' };
    case 'Bi-set':
      return { tone: 'orange', label: 'Bi-set' };
    case 'Super-Série':
      return { tone: 'purple', label: 'Super-Série' };
    case 'Simple':
      return { tone: 'gray', label: 'Série Simples' };
    default:
      return { tone: 'gray', label: seriesType };
  }
}

function bisetRoleFor(item: WorkoutExercise): string {
  if (!item.biset_group) return '';
  return item.order_index % 2 === 0 ? '1' : '2';
}
