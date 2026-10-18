import { useEffect, useMemo, useState } from 'react';
import { Library, Search, Dumbbell, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { WorkoutGoal, WorkoutTemplate } from '@/types';

const GOALS: WorkoutGoal[] = ['Hipertrofia', 'Força', 'Definição', 'Emagrecimento', 'Funcional', 'Mobilidade', 'Calistenia'];

const goalTone: Record<WorkoutGoal, 'brand' | 'blue' | 'orange' | 'purple' | 'gray' | 'red' | 'green'> = {
  Hipertrofia: 'brand', Força: 'red', Definição: 'orange', Emagrecimento: 'green',
  Funcional: 'blue', Mobilidade: 'purple', Calistenia: 'gray',
};

export function Templates() {
  const { role } = useAuth();
  const { navigate } = useNav();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [goalFilter, setGoalFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      const timeoutId = setTimeout(() => setLoading(false), 1500);
      try {
        const { data } = await supabase.from('workout_templates').select('*').order('name');
        setTemplates((data ?? []) as WorkoutTemplate[]);
      } catch {
        // fallback: leave empty, UI handles it
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (goalFilter !== 'all' && t.goal !== goalFilter) return false;
      if (q && !t.name.toLowerCase().includes(q) && !(t.description ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [templates, search, goalFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, WorkoutTemplate[]>();
    for (const t of filtered) {
      const arr = map.get(t.goal) ?? [];
      arr.push(t);
      map.set(t.goal, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (role === 'student') return null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Modelos de Treino"
        description="Modelos prontos baseados no Método ROI Shape (Phillip Sarraff). Selecione e atribua diretamente ao aluno."
      />

      <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            placeholder="Buscar modelo por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Select value={goalFilter} onChange={(e) => setGoalFilter(e.target.value)} className="min-w-[160px]">
            <option value="all">Todos os objetivos</option>
            {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Library className="h-7 w-7" />} title="Nenhum modelo encontrado" description="Ajuste a busca para ver os modelos disponíveis." />
      ) : (
        <div className="space-y-8">
          {grouped.map(([goal, items]) => (
            <section key={goal}>
              <div className="mb-3 flex items-center gap-2.5">
                <Badge tone={goalTone[goal as WorkoutGoal]} className="text-sm px-3 py-1">{goal}</Badge>
                <span className="text-sm text-ink-500">{items.length} modelo{items.length > 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((t) => (
                  <div
                    key={t.id}
                    className="group flex flex-col rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all hover:shadow-cardHover hover:border-ink-200"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                      <Badge tone={goalTone[t.goal]}>{t.goal}</Badge>
                    </div>
                    <h3 className="text-base font-bold text-ink-900 leading-snug">{t.name}</h3>
                    {t.description && <p className="mt-1.5 text-sm text-ink-500 leading-relaxed line-clamp-2">{t.description}</p>}
                    <div className="mt-4 pt-3 border-t border-ink-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                        onClick={() => navigate({ name: 'students' })}
                      >
                        Usar para um aluno
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Prefere montar do zero?</h3>
            <p className="mt-1 text-sm text-white/80">Você também pode criar uma ficha manual, escolhendo exercício por exercício da biblioteca.</p>
            <Button variant="secondary" size="sm" className="mt-4" leftIcon={<Dumbbell className="h-4 w-4" />} onClick={() => navigate({ name: 'workouts' })}>
              Montar treino manual
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
