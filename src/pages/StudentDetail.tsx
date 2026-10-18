import { useEffect, useState } from 'react';
import { User, Dumbbell, MessageCircle, Plus, Mail, Phone, ArrowLeft, Calendar, DollarSign, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { initials, formatDate, whatsappLink } from '@/lib/utils';
import type { Profile, Workout, PaymentStatus, ContractStatus } from '@/types';

const PAYMENT_LABEL: Record<PaymentStatus, string> = { paid: 'Em dia', pending: 'A vencer', overdue: 'Atrasado' };
const PAYMENT_TONE: Record<PaymentStatus, 'green' | 'orange' | 'red'> = { paid: 'green', pending: 'orange', overdue: 'red' };
const CONTRACT_LABEL: Record<ContractStatus, string> = { active: 'Ativo', pending: 'Pendente', cancelled: 'Cancelado' };
const CONTRACT_TONE: Record<ContractStatus, 'green' | 'orange' | 'red'> = { active: 'green', pending: 'orange', cancelled: 'red' };

export function StudentDetail({ studentId }: { studentId: string }) {
  const { profile } = useAuth();
  const { navigate } = useNav();
  const [student, setStudent] = useState<Profile | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, w] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', studentId).maybeSingle(),
        supabase.from('workouts').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
      ]);
      setStudent(s.data as Profile | null);
      setWorkouts((w.data ?? []) as Workout[]);
      setLoading(false);
    }
    load();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return <EmptyState icon={<User className="h-7 w-7" />} title="Aluno não encontrado" />;
  }

  const message = `Olá, ${student.full_name || 'aluno'}! Seu acesso ao ROI Shape está liberado. 🚀\nAcesse: https://app.roishape.com.br\nLogin: ${student.email}\nSenha: •••••• (definida no cadastro)`;
  const billingMessage = `Olá, ${student.full_name || 'aluno'}! 👋\nEste é um lembrete amigável sobre sua mensalidade no ROI Shape.\nVencimento: ${student.contract_due_date ? formatDate(student.contract_due_date) : 'a combinar'}\nStatus: ${PAYMENT_LABEL[student.payment_status]}\n\nQualquer dúvida, estou à disposição! 💪`;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={student.full_name || 'Aluno'}
        back={{ label: 'Alunos', onClick: () => navigate({ name: 'students' }) }}
        actions={
          <>
            <a
              href={whatsappLink(student.phone ?? '', billingMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-50 px-4 text-sm font-semibold text-orange-700 ring-1 ring-inset ring-orange-200 transition-colors hover:bg-orange-100"
            >
              <Send className="h-4 w-4" /> Cobrança
            </a>
            <a
              href={whatsappLink(student.phone ?? '', message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-50 px-4 text-sm font-semibold text-green-700 ring-1 ring-inset ring-green-200 transition-colors hover:bg-green-100"
            >
              <MessageCircle className="h-4 w-4" /> Enviar acesso
            </a>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate({ name: 'workout-new', studentId })}>
              Novo treino
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-900 text-xl font-bold text-white">
              {initials(student.full_name || student.email)}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-ink-900 truncate">{student.full_name || 'Sem nome'}</h2>
              <Badge tone="brand" className="mt-1">Aluno</Badge>
            </div>
          </div>
          <dl className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-ink-400" />
              <span className="text-ink-700">{student.email}</span>
            </div>
            {student.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-ink-400" />
                <span className="text-ink-700">{student.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-ink-400" />
              <span className="text-ink-700">Desde {formatDate(student.created_at)}</span>
            </div>
          </dl>

          {/* CRM summary */}
          <div className="mt-6 rounded-xl border border-ink-100 bg-ink-50 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-500">CRM</p>
            <div className="flex flex-wrap gap-2">
              <Badge tone={PAYMENT_TONE[student.payment_status]}>
                <DollarSign className="h-3 w-3" /> {PAYMENT_LABEL[student.payment_status]}
              </Badge>
              <Badge tone={CONTRACT_TONE[student.contract_status]}>
                Contrato: {CONTRACT_LABEL[student.contract_status]}
              </Badge>
            </div>
            {student.contract_due_date && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-600">
                <Calendar className="h-3.5 w-3.5" />
                Vencimento: {formatDate(student.contract_due_date)}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-ink-900">Fichas de treino</h2>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate({ name: 'workout-new', studentId })}>
              Montar treino
            </Button>
          </div>
          {workouts.length === 0 ? (
            <EmptyState icon={<Dumbbell className="h-7 w-7" />} title="Nenhuma ficha ainda" description="Monte a primeira ficha de treino para este aluno." action={<Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate({ name: 'workout-new', studentId })}>Criar treino</Button>} />
          ) : (
            <ul className="space-y-2">
              {workouts.map((w) => (
                <li key={w.id}>
                  <button
                    onClick={() => navigate({ name: 'workout-detail', workoutId: w.id })}
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-ink-50 transition-colors border border-ink-100"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{w.name}</p>
                      <p className="text-xs text-ink-500">{formatDate(w.created_at)}</p>
                    </div>
                    {w.goal && <Badge tone="gray">{w.goal}</Badge>}
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
      {profile?.id === student.assigned_personal_id && (
        <p className="mt-4 text-center text-xs text-ink-400">Aluno vinculado a você</p>
      )}
    </div>
  );
}
