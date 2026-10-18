import { useEffect, useState } from 'react';
import { Dumbbell, Search, Plus, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, initials } from '@/lib/utils';
import type { Workout } from '@/types';

interface WorkoutRow extends Workout {
  student?: { full_name: string; email: string };
  workout_exercises?: Array<{ id: string }>;
}

export function Workouts() {
  const { profile, role } = useAuth();
  const { navigate } = useNav();
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => { if (!cancelled) setLoading(false); }, 1500);
    async function load() {
      if (!profile) return;
      try {
        const col = role === 'student' ? 'student_id' : 'personal_id';
        const { data } = await supabase
          .from('workouts')
          .select('*, student:profiles!workouts_student_id_fkey(full_name, email), workout_exercises(id)')
          .eq(col, profile.id)
          .order('created_at', { ascending: false });
        if (!cancelled) setWorkouts((data ?? []) as WorkoutRow[]);
      } catch {
        // RLS or network error — show empty state, not infinite spinner
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [profile, role]);

  const filtered = workouts.filter((w) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return w.name.toLowerCase().includes(q) || (w.student?.full_name ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={role === 'student' ? 'Meus treinos' : 'Fichas de Treino'}
        description={role === 'student' ? 'Todos os treinos que seu personal montou para você.' : 'Todas as fichas de treino que você criou para seus alunos.'}
        actions={role !== 'student' && (
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate({ name: 'students' })}>
            Montar treino
          </Button>
        )}
      />

      <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
        <Input placeholder="Buscar ficha por nome ou aluno..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="h-7 w-7" />}
          title={workouts.length === 0 ? 'Nenhuma ficha criada' : 'Nenhum resultado'}
          description={workouts.length === 0 ? (role === 'student' ? 'Seu personal ainda não montou treinos para você.' : 'Monte a primeira ficha de treino escolhendo um aluno.') : 'Ajuste a busca para encontrar fichas.'}
          action={role !== 'student' && workouts.length === 0 && <Button leftIcon={<Users className="h-4 w-4" />} onClick={() => navigate({ name: 'students' })}>Escolher aluno</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <button
              key={w.id}
              onClick={() => navigate({ name: 'workout-detail', workoutId: w.id })}
              className="group flex flex-col rounded-2xl border border-ink-100 bg-white p-5 text-left shadow-card transition-all hover:shadow-cardHover hover:border-ink-200"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <span className={`text-xs font-semibold capitalize px-2.5 py-1 rounded-full ${
                  w.status === 'active' ? 'bg-brand-50 text-brand-700' : w.status === 'paused' ? 'bg-orange-50 text-orange-700' : 'bg-ink-100 text-ink-600'
                }`}>
                  {w.status === 'active' ? 'Ativo' : w.status === 'paused' ? 'Pausado' : 'Concluído'}
                </span>
              </div>
              <h3 className="text-base font-bold text-ink-900 leading-snug">{w.name}</h3>
              {w.goal && <div className="mt-1.5"><Badge tone="brand">{w.goal}</Badge></div>}
              <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
                <span>{w.workout_exercises?.length ?? 0} exercícios</span>
                <span>·</span>
                <span>{formatDate(w.created_at)}</span>
              </div>
              {w.student && role !== 'student' && (
                <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-[10px] font-bold text-white">
                    {initials(w.student.full_name || w.student.email)}
                  </div>
                  <span className="truncate text-sm font-medium text-ink-700">{w.student.full_name}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
