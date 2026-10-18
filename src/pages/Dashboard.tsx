import { useEffect, useState } from 'react';
import { Users, Dumbbell, Library, Video, ArrowRight, Sparkles, DollarSign, FileText, Rocket, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { supabase } from '@/lib/supabase';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, initials } from '@/lib/utils';
import type { PaymentStatus, ContractStatus } from '@/types';

interface Stats {
  studentsCount: number;
  workoutsCount: number;
  templatesCount: number;
  exercisesCount: number;
  activeStudentsCount: number;
  duesThisMonth: number;
  activeContracts: number;
  pendingContracts: number;
  cancelledContracts: number;
}

interface StudentRow {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  phone: string | null;
  payment_status: PaymentStatus;
  contract_due_date: string | null;
  contract_status: ContractStatus;
}

interface WorkoutRow {
  id: string;
  name: string;
  status: string;
  created_at: string;
  student?: { full_name: string };
}

function paymentTone(status: PaymentStatus): 'green' | 'orange' | 'red' {
  if (status === 'paid') return 'green';
  if (status === 'pending') return 'orange';
  return 'red';
}

function paymentLabel(status: PaymentStatus): string {
  if (status === 'paid') return 'Em dia';
  if (status === 'pending') return 'A vencer';
  return 'Atrasado';
}

function contractTone(status: ContractStatus): 'green' | 'orange' | 'red' {
  if (status === 'active') return 'green';
  if (status === 'pending') return 'orange';
  return 'red';
}

function contractLabel(status: ContractStatus): string {
  if (status === 'active') return 'Ativo';
  if (status === 'pending') return 'Pendente';
  return 'Cancelado';
}

function isThisMonth(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function Dashboard() {
  const { profile, role } = useAuth();
  const { navigate } = useNav();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentStudents, setRecentStudents] = useState<StudentRow[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => { if (!cancelled) setLoading(false); }, 1500);
    async function load() {
      if (!profile) return;
      try {
        if (role === 'student') {
          const { data: workouts } = await supabase
            .from('workouts')
            .select('id, name, status, created_at')
            .eq('student_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(5);
          if (cancelled) return;
          setRecentWorkouts((workouts ?? []) as WorkoutRow[]);
          setStats({ studentsCount: 0, workoutsCount: workouts?.length ?? 0, templatesCount: 0, exercisesCount: 0, activeStudentsCount: 0, duesThisMonth: 0, activeContracts: 0, pendingContracts: 0, cancelledContracts: 0 });
        } else {
          const [studentsRes, workoutsRes, templatesRes, exercisesRes] = await Promise.all([
            supabase.from('profiles')
              .select('id, full_name, email, created_at, phone, payment_status, contract_due_date, contract_status')
              .eq('assigned_personal_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(6),
            supabase.from('workouts').select('id, name, status, created_at, student:profiles!workouts_student_id_fkey(full_name)').eq('personal_id', profile.id).order('created_at', { ascending: false }).limit(5),
            supabase.from('workout_templates').select('id', { count: 'exact', head: true }),
            supabase.from('exercises').select('id', { count: 'exact', head: true }),
          ]);
          if (cancelled) return;
          const { count: workoutsCount } = await supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('personal_id', profile.id);
          const { count: studentsCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('assigned_personal_id', profile.id);
          if (cancelled) return;
          const students = (studentsRes.data ?? []) as StudentRow[];
          setRecentStudents(students);
          setRecentWorkouts((workoutsRes.data ?? []) as unknown as WorkoutRow[]);
          const duesThisMonth = students.filter((s) => s.payment_status !== 'paid' && isThisMonth(s.contract_due_date)).length;
          const activeContracts = students.filter((s) => s.contract_status === 'active').length;
          const pendingContracts = students.filter((s) => s.contract_status === 'pending').length;
          const cancelledContracts = students.filter((s) => s.contract_status === 'cancelled').length;
          const activeStudentsCount = students.filter((s) => s.contract_status === 'active').length;
          setStats({
            studentsCount: studentsCount ?? 0, workoutsCount: workoutsCount ?? 0, templatesCount: templatesRes.count ?? 0, exercisesCount: exercisesRes.count ?? 0,
            activeStudentsCount, duesThisMonth, activeContracts, pendingContracts, cancelledContracts,
          });
        }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Olá, ${profile?.full_name?.split(' ')[0] || 'treinador'}`}
        description={role === 'student' ? 'Veja seus treinos atribuídos abaixo.' : 'Visão geral da sua operação de Personal Trainer.'}
        actions={
          role !== 'student' && (
            <Button leftIcon={<Users className="h-4 w-4" />} onClick={() => navigate({ name: 'students' })}>
              Novo aluno
            </Button>
          )
        }
      />

      {role === 'student' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Meus treinos"
            value={stats?.workoutsCount ?? 0}
            icon={<Dumbbell className="h-6 w-6" />}
            tone="brand"
            onClick={() => navigate({ name: 'workouts' })}
          />
        </div>
      ) : (
        <>
          {/* CRM Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CrmCard
              label="Alunos Ativos"
              value={stats?.activeStudentsCount ?? 0}
              icon={<Users className="h-6 w-6" />}
              tone="brand"
              caption={`${stats?.studentsCount ?? 0} alunos no total`}
              onClick={() => navigate({ name: 'students' })}
            />
            <CrmCard
              label="Mensalidades a Vencer"
              value={stats?.duesThisMonth ?? 0}
              icon={<DollarSign className="h-6 w-6" />}
              tone="orange"
              caption="Vencem neste mês"
              onClick={() => navigate({ name: 'students' })}
            />
            <CrmCard
              label="Contratos"
              value={stats?.activeContracts ?? 0}
              icon={<FileText className="h-6 w-6" />}
              tone="blue"
              caption={`${stats?.pendingContracts ?? 0} pendentes · ${stats?.cancelledContracts ?? 0} cancelados`}
              onClick={() => navigate({ name: 'students' })}
            />
          </div>

          {/* Career Accelerator Banner */}
          <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0D0D0D] via-[#111] to-[#0D0D0D] p-6 ring-1 ring-[#00E676]/20">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00E676]/15 text-[#00E676] ring-1 ring-inset ring-[#00E676]/30">
                <Rocket className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-white">Acelerador de Carreira &amp; Tráfego Pago</h3>
                <p className="mt-1 text-sm text-white/60">Escale seu número de alunos com estratégias de tráfego pago direcionadas para Personal Trainers.</p>
              </div>
              <a
                href="https://wa.me/5511999999999?text=Quero%20saber%20mais%20sobre%20o%20Acelerador%20de%20Carreira"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#00E676] px-5 text-sm font-bold text-[#0D0D0D] transition-colors hover:bg-[#00C853]"
              >
                <TrendingUp className="h-4 w-4" />
                Quero escalar
              </a>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Fichas de Treino"
              value={stats?.workoutsCount ?? 0}
              icon={<Dumbbell className="h-6 w-6" />}
              tone="blue"
              onClick={() => navigate({ name: 'workouts' })}
            />
            <StatCard
              label="Modelos disponíveis"
              value={stats?.templatesCount ?? 0}
              icon={<Library className="h-6 w-6" />}
              tone="orange"
              onClick={() => navigate({ name: 'templates' })}
            />
            <StatCard
              label="Exercícios na biblioteca"
              value={stats?.exercisesCount ?? 0}
              icon={<Video className="h-6 w-6" />}
              tone="purple"
              onClick={() => navigate({ name: 'exercises' })}
            />
          </div>
        </>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {role !== 'student' && (
          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-ink-900">Alunos recentes</h2>
              <button
                onClick={() => navigate({ name: 'students' })}
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Ver todos <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {recentStudents.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-500">Nenhum aluno cadastrado ainda.</p>
            ) : (
              <ul className="space-y-2">
                {recentStudents.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => navigate({ name: 'student-detail', studentId: s.id })}
                      className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-ink-50 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
                        {initials(s.full_name || s.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900">{s.full_name || 'Sem nome'}</p>
                        <p className="truncate text-xs text-ink-500">{s.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge tone={paymentTone(s.payment_status)}>{paymentLabel(s.payment_status)}</Badge>
                        <span className="text-xs text-ink-400">{formatDate(s.created_at)}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className={`rounded-2xl border border-ink-100 bg-white p-5 shadow-card ${role === 'student' ? 'lg:col-span-2' : ''}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-ink-900">{role === 'student' ? 'Seus treinos' : 'Treinos recentes'}</h2>
            <button
              onClick={() => navigate({ name: 'workouts' })}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {recentWorkouts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-ink-500">{role === 'student' ? 'Nenhum treino atribuído a você ainda.' : 'Nenhuma ficha criada ainda.'}</p>
              {role !== 'student' && (
                <Button className="mt-4" leftIcon={<Sparkles className="h-4 w-4" />} onClick={() => navigate({ name: 'templates' })}>
                  Explorar modelos
                </Button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {recentWorkouts.map((w) => (
                <li key={w.id}>
                  <button
                    onClick={() => navigate({ name: 'workout-detail', workoutId: w.id })}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-ink-50 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{w.name}</p>
                      <p className="truncate text-xs text-ink-500">
                        {w.student?.full_name ? `${w.student.full_name} · ` : ''}{formatDate(w.created_at)}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold capitalize px-2.5 py-1 rounded-full ${
                      w.status === 'active' ? 'bg-brand-50 text-brand-700' : w.status === 'paused' ? 'bg-orange-50 text-orange-700' : 'bg-ink-100 text-ink-600'
                    }`}>
                      {w.status === 'active' ? 'Ativo' : w.status === 'paused' ? 'Pausado' : 'Concluído'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

interface CrmCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone: 'brand' | 'blue' | 'orange' | 'purple';
  caption?: string;
  onClick?: () => void;
}

function CrmCard({ label, value, icon, tone, caption, onClick }: CrmCardProps) {
  const toneClasses: Record<string, { bg: string; text: string; ring: string }> = {
    brand: { bg: 'bg-brand-50', text: 'text-brand-700', ring: 'ring-brand-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-100' },
  };
  const t = toneClasses[tone];
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 text-left shadow-card transition-all ${onClick ? 'hover:shadow-cardHover hover:border-ink-200 cursor-pointer' : ''}`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.text} ring-1 ring-inset ${t.ring}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-extrabold text-ink-900 leading-tight">{value}</p>
        <p className="text-sm font-medium text-ink-500 truncate">{label}</p>
        {caption && <p className="text-xs text-ink-400 mt-0.5 truncate">{caption}</p>}
      </div>
      {onClick && (
        <ArrowRight className="h-5 w-5 text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-ink-500" />
      )}
    </Component>
  );
}
