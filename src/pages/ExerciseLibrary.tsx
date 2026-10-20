import { useEffect, useMemo, useState } from 'react';
import { Video, Search, Plus, Pencil, Save, X, Film } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { VerticalVideoPlayer } from '@/components/ui/VerticalVideoPlayer';
import type { Exercise, ExerciseCategory, MuscleGroup, Biomechanics } from '@/types';
import { youtubeThumbnailUrl } from '@/lib/utils';

const MUSCLE_GROUPS: MuscleGroup[] = ['Deltoides', 'Peitoral', 'Dorsais', 'Quadríceps', 'Glúteos', 'Core', 'Bíceps', 'Tríceps', 'Posterior', 'Panturrilha', 'Cardio'];
const CATEGORIES: ExerciseCategory[] = ['Musculação', 'Funcional', 'Calistenia', 'Mobilidade'];
const BIOMECHANICS: Biomechanics[] = ['Tensão Mecânica', 'Estresse Metabólico'];

// Friendly muscle group aliases used in the quick filter chips.
const MUSCLE_ALIASES: { label: string; value: string }[] = [
  { label: 'Peito', value: 'Peitoral' },
  { label: 'Costas', value: 'Dorsais' },
  { label: 'Quadríceps', value: 'Quadríceps' },
  { label: 'Posterior', value: 'Posterior' },
  { label: 'Ombros', value: 'Deltoides' },
  { label: 'Braços', value: 'Bíceps' },
  { label: 'Abdômen', value: 'Core' },
];

const muscleTone: Record<MuscleGroup, 'brand' | 'blue' | 'orange' | 'purple' | 'gray' | 'red' | 'green'> = {
  Deltoides: 'blue', Peitoral: 'orange', Dorsais: 'purple', Quadríceps: 'brand',
  Glúteos: 'red', Core: 'green', Bíceps: 'blue', Tríceps: 'orange',
  Posterior: 'purple', Panturrilha: 'gray', Cardio: 'red',
};

export function ExerciseLibrary() {
  const { role } = useAuth();
  const canManage = role === 'admin' || role === 'personal';

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [biomechFilter, setBiomechFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Exercise>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('exercises').select('*').order('name');
    if (error) { setError(error.message); }
    setExercises((data ?? []) as Exercise[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((e) => {
      if (muscleFilter !== 'all' && e.muscle_group !== muscleFilter) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (biomechFilter !== 'all' && e.biomechanics !== biomechFilter) return false;
      if (q && !e.name.toLowerCase().includes(q) && !(e.description ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [exercises, search, muscleFilter, categoryFilter, biomechFilter]);

  function openEdit(ex: Exercise) {
    setEditing({ ...ex });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!canManage || !editing.name?.trim()) { setError('Informe o nome do exercício.'); return; }
    setSaving(true);
    setError(null);
    const payload = {
      name: editing.name.trim(),
      muscle_group: editing.muscle_group ?? 'Peitoral',
      category: editing.category ?? 'Musculação',
      biomechanics: editing.biomechanics ?? null,
      video_url: editing.video_url?.trim() || null,
      description: editing.description?.trim() || null,
    };
    const result = editing.id
      ? await supabase.from('exercises').update(payload).eq('id', editing.id)
      : await supabase.from('exercises').insert(payload);
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    await load();
    setEditOpen(false);
    setSelected(null);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Biblioteca de Exercícios"
        description="Biblioteca global com vídeos verticais do YouTube (canal @roishape). Filtrar por grupo muscular e método biomecânico Fullbody."
        actions={canManage && (
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing({ name: '', muscle_group: 'Peitoral', category: 'Musculação', biomechanics: null, video_url: '', description: '' }); setEditOpen(true); }}>
            Novo exercício
          </Button>
        )}
      />

      {/* Quick muscle group chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setMuscleFilter('all')}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${muscleFilter === 'all' ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-ink-50'}`}
        >
          Todos
        </button>
        {MUSCLE_ALIASES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMuscleFilter(m.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${muscleFilter === m.value ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-ink-50'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <Input
            placeholder="Buscar exercício por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} className="min-w-[140px]">
            <option value="all">Todos os músculos</option>
            {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="min-w-[130px]">
            <option value="all">Todas categorias</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={biomechFilter} onChange={(e) => setBiomechFilter(e.target.value)} className="min-w-[160px]">
            <option value="all">Biomecânica (todos)</option>
            {BIOMECHANICS.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Video className="h-7 w-7" />} title="Nenhum exercício encontrado" description="Ajuste a busca ou os filtros para ver mais exercícios." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelected(ex)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white text-left shadow-card transition-all hover:shadow-cardHover hover:border-ink-200"
            >
              <div className="relative flex aspect-[9/16] max-h-44 items-center justify-center overflow-hidden bg-ink-100 text-ink-300">
                {youtubeThumbnailUrl(ex.video_url) ? (
                  <>
                    <img src={youtubeThumbnailUrl(ex.video_url) ?? ''} alt="" className="h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <div className="flex flex-col items-center gap-1.5 text-white drop-shadow-md">
                        <Film className="h-7 w-7" />
                        <span className="text-[11px] font-semibold uppercase tracking-wide">Ver vídeo</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <Video className="h-7 w-7" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-ink-900 leading-snug">{ex.name}</h3>
                  {canManage && (
                    <span
                      onClick={(e) => { e.stopPropagation(); openEdit(ex); }}
                      className="shrink-0 cursor-pointer rounded-lg p-1.5 text-ink-400 opacity-0 transition-opacity hover:bg-ink-100 hover:text-ink-700 group-hover:opacity-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={muscleTone[ex.muscle_group]}>{ex.muscle_group}</Badge>
                  <Badge tone="gray">{ex.category}</Badge>
                  {ex.biomechanics && (
                    <Badge tone={ex.biomechanics === 'Tensão Mecânica' ? 'red' : 'blue'}>{ex.biomechanics}</Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        description={selected ? `${selected.muscle_group} · ${selected.category}${selected.biomechanics ? ` · ${selected.biomechanics}` : ''}` : undefined}
        size="md"
      >
        {selected && (
          <div className="space-y-4">
            <div className="mx-auto w-48">
              <VerticalVideoPlayer url={selected.video_url} title={selected.name} />
            </div>
            {selected.description && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-ink-500 mb-1">Descrição</h4>
                <p className="text-sm text-ink-700 leading-relaxed">{selected.description}</p>
              </div>
            )}
            {selected.video_url && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-ink-500 mb-1">Link do vídeo</h4>
                <a href={selected.video_url} target="_blank" rel="noopener noreferrer" className="break-all text-sm font-medium text-brand-700 hover:underline">
                  {selected.video_url}
                </a>
              </div>
            )}
            {canManage && (
              <Button className="w-full" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => openEdit(selected)}>
                Editar Link do Vídeo
              </Button>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editing.id ? 'Editar exercício' : 'Novo exercício'}
        description="Preencha os dados do exercício. O link do vídeo aceita URLs do YouTube, inclusive Shorts."
        size="md"
      >
        <div className="space-y-4">
          <Input label="Nome" value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Grupo muscular" value={editing.muscle_group ?? 'Peitoral'} onChange={(e) => setEditing({ ...editing, muscle_group: e.target.value as MuscleGroup })}>
              {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Select label="Categoria" value={editing.category ?? 'Musculação'} onChange={(e) => setEditing({ ...editing, category: e.target.value as ExerciseCategory })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <Select label="Biomecânica (Método ROI Shape)" value={editing.biomechanics ?? ''} onChange={(e) => setEditing({ ...editing, biomechanics: (e.target.value || null) as Biomechanics | null })}>
            <option value="">Sem classificação</option>
            {BIOMECHANICS.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Input
            label="Link do vídeo (YouTube / Shorts)"
            placeholder="https://youtube.com/shorts/..."
            value={editing.video_url ?? ''}
            onChange={(e) => setEditing({ ...editing, video_url: e.target.value || null })}
          />
          <Textarea label="Descrição" rows={3} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value || null })} />
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="outline" leftIcon={<X className="h-4 w-4" />} onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button leftIcon={<Save className="h-4 w-4" />} loading={saving} onClick={saveEdit}>
              {editing.id ? 'Salvar alterações' : 'Criar exercício'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
