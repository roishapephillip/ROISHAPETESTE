import { useEffect, useState, type FormEvent } from 'react';
import { Dumbbell, ArrowLeft, Save, X, Library } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorBanner } from '@/components/ui/EmptyState';
import type { Exercise, Profile, WorkoutGoal, EmphasisGroup } from '@/types';
import { buildRoiRows, complementLabelFor, emphasisDescription } from '@/lib/roiShapeMethod';

const GOALS: WorkoutGoal[] = ['Hipertrofia', 'Força', 'Definição', 'Emagrecimento', 'Funcional', 'Mobilidade', 'Calistenia'];

export function WorkoutBuilder({ studentId, templateId }: { studentId: string; templateId?: string }) {
  const { profile } = useAuth();
  const { navigate } = useNav();
  const [student, setStudent] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<WorkoutGoal>('Hipertrofia');
  const [emphasis, setEmphasis] = useState<EmphasisGroup>('Membros Inferiores');
  const [complement, setComplement] = useState('Membros Superiores + Core');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; goal: WorkoutGoal }>>([]);

  useEffect(() => {
    async function load() {
      const [s, t] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', studentId).maybeSingle(),
        supabase.from('workout_templates').select('id, name, goal').order('name'),
      ]);
      setStudent(s.data as Profile | null);
      setTemplates((t.data ?? []) as Array<{ id: string; name: string; goal: WorkoutGoal }>);
      if (templateId) {
        const tpl = (t.data ?? []).find((x) => x.id === templateId);
        if (tpl) { setName(tpl.name); setGoal(tpl.goal); }
      }
    }
    load();
  }, [studentId, templateId]);

  useEffect(() => {
    setComplement(complementLabelFor(emphasis));
  }, [emphasis]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (name.trim().length < 2) { setError('Informe o nome da ficha.'); return; }
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        name: name.trim(),
        goal,
        notes: notes.trim() || null,
        student_id: studentId,
        personal_id: profile.id,
        template_id: templateId ?? null,
        status: 'active',
        emphasis_group: emphasis,
        complement_group: complement,
      })
      .select('id')
      .single();
    if (error) { setSaving(false); setError(error.message); return; }

    const { data: exerciseData, error: exerciseError } = await supabase.from('exercises').select('*');
    if (exerciseError) {
      setSaving(false);
      setError(exerciseError.message);
      return;
    }
    const rows = buildRoiRows((exerciseData ?? []) as Exercise[], data.id, emphasis);
    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('workout_exercises').insert(rows.map(({ exercise: _exercise, ...row }) => row));
      if (insertError) {
        setSaving(false);
        setError(insertError.message);
        return;
      }
    }

    setSaving(false);
    navigate({ name: 'workout-detail', workoutId: data.id });
  }

  function useTemplate(tplId: string) {
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) { setName(tpl.name); setGoal(tpl.goal); }
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title="Nova ficha de treino"
        description={`Aluno: ${student.full_name || student.email}`}
        back={{ label: 'Voltar', onClick: () => navigate({ name: 'student-detail', studentId }) }}
      />

      {templates.length > 0 && (
        <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Library className="h-5 w-5 text-brand-600" />
            <h2 className="font-bold text-ink-900">Começar de um modelo</h2>
          </div>
          <p className="mb-3 text-sm text-ink-500">Use um dos 50+ modelos do Método ROI Shape (Phillip Sarraff) como base — você poderá editar tudo depois.</p>
          <div className="flex flex-wrap gap-2">
            {templates.slice(0, 12).map((t) => (
              <button
                key={t.id}
                onClick={() => useTemplate(t.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {t.name}
                <Badge tone="gray" className="ml-1">{t.goal}</Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
        <Input label="Nome da ficha" placeholder="Ex.: Hipertrofia ABC - Dia A" value={name} onChange={(e) => setName(e.target.value)} required />
        <Select label="Objetivo" value={goal} onChange={(e) => setGoal(e.target.value as WorkoutGoal)}>
          {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
        </Select>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Grupo de ênfase" value={emphasis} onChange={(e) => setEmphasis(e.target.value as EmphasisGroup)}>
            <option value="Membros Inferiores">Membros Inferiores</option>
            <option value="Membros Superiores">Membros Superiores</option>
            <option value="Fullbody">Fullbody</option>
          </Select>
          <Input label="Grupo complementar" value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Ex.: Membros Superiores + Core" />
        </div>
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          <p className="font-bold">Método Fullbody ROI Shape ativo</p>
          <p className="mt-1">{emphasisDescription(emphasis)}</p>
        </div>
        <Textarea label="Observações (opcional)" rows={3} placeholder="Orientações gerais para o aluno..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        {error && <ErrorBanner message={error} />}
        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="outline" leftIcon={<X className="h-4 w-4" />} onClick={() => navigate({ name: 'student-detail', studentId })}>Cancelar</Button>
          <Button type="submit" leftIcon={<Save className="h-4 w-4" />} loading={saving}>Criar e montar exercícios</Button>
        </div>
      </form>

      <div className="mt-4 rounded-xl bg-brand-50 border border-brand-200 p-4 text-sm text-brand-800">
        <p className="flex items-center gap-2 font-semibold"><Dumbbell className="h-4 w-4" /> Após criar, você será levado ao editor para adicionar exercícios.</p>
      </div>
    </div>
  );
}
