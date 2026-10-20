import { useEffect, useState, type FormEvent } from 'react';
import { Users, Search, Plus, MessageCircle, Dumbbell, X, UserPlus, Send, DollarSign, Calendar, Pencil, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/EmptyState';
import { formatDate, initials, whatsappLink } from '@/lib/utils';
import type { PaymentStatus, ContractStatus, Profile } from '@/types';

type StudentWithCount = Profile & {
  workout_count?: number;
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  paid: 'Em dia',
  pending: 'A vencer',
  overdue: 'Atrasado',
};

const PAYMENT_TONE: Record<PaymentStatus, 'green' | 'orange' | 'red'> = {
  paid: 'green',
  pending: 'orange',
  overdue: 'red',
};

const CONTRACT_LABEL: Record<ContractStatus, string> = {
  active: 'Ativo',
  pending: 'Pendente',
  cancelled: 'Cancelado',
};

const CONTRACT_TONE: Record<ContractStatus, 'green' | 'orange' | 'red'> = {
  active: 'green',
  pending: 'orange',
  cancelled: 'red',
};

export function Students() {
  const { profile } = useAuth();
  const { navigate } = useNav();
  const [students, setStudents] = useState<StudentWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editCrmOpen, setEditCrmOpen] = useState(false);
  const [editCrm, setEditCrm] = useState<StudentWithCount | null>(null);
  const [crmSaving, setCrmSaving] = useState(false);

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string; full_name: string; phone: string } | null>(null);
  const [autoWhatsappUrl, setAutoWhatsappUrl] = useState<string | null>(null);
  const [resetStudent, setResetStudent] = useState<StudentWithCount | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    load();
  }, []);

  async function load() {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*, workout_count:workouts!workouts_student_id_fkey(count)')
      .eq('assigned_personal_id', profile.id)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    const list = (data ?? []) as StudentWithCount[];
    list.forEach((s) => { s.workout_count = (s.workout_count as unknown as { count: number } | null)?.count ?? 0; });
    setStudents(list);
    setLoading(false);
  }

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchesText = !q || (s.full_name ?? '').toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.phone ?? '').includes(q);
    const matchesPayment = paymentFilter === 'all' || s.payment_status === paymentFilter;
    return matchesText && matchesPayment;
  });

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!profile) return;
    if (form.full_name.trim().length < 2) { setError('Informe o nome completo.'); return; }
    if (form.password.trim().length < 6) { setError('A senha deve ter ao menos 6 caracteres.'); return; }
    if (!form.email.includes('@')) { setError('E-mail inválido.'); return; }
    if (form.email.trim().toLowerCase() === (profile.email ?? '').toLowerCase()) {
      setError('Você não pode cadastrar um aluno com o seu próprio e-mail. Use um e-mail diferente.');
      return;
    }
    setCreating(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password.trim(),
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          personal_id: profile.id,
        }),
      });
      const data = await res.json() as { error?: string; id?: string; email?: string; full_name?: string; phone?: string | null };
      if (!res.ok || !data.id) {
        setError(data.error ?? 'Erro ao criar aluno. Tente novamente.');
        setCreating(false);
        return;
      }
      const creds = { email: data.email ?? form.email.trim().toLowerCase(), password: form.password.trim(), full_name: data.full_name ?? form.full_name.trim(), phone: data.phone ?? form.phone.trim() };
      const msg = buildInviteMessage(creds.full_name, creds.email, creds.password);
      const waUrl = whatsappLink(creds.phone, msg);
      setCreatedCreds(creds);
      setForm({ full_name: '', email: '', phone: '', password: '' });
      showToast('Aluno cadastrado com sucesso e convite gerado!');
      await load();
      if (waUrl) {
        setAutoWhatsappUrl(waUrl);
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setError('Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.');
    } finally {
      setCreating(false);
    }
  }

  const APP_URL = 'https://app.roishape.com.br';

  function buildInviteMessage(name: string, email: string, password: string): string {
    return `Olá ${name}! O seu acesso ao aplicativo ROI Shape (Método Felipe Sarraf) está liberado.\nAcesse: ${APP_URL}\nSeu e-mail: ${email}\nSua senha inicial: ${password}\n\nImportante: ao entrar pela primeira vez, o sistema vai pedir para você criar uma nova senha pessoal.`;
  }

  function buildAccessMessage(s: StudentWithCount, password?: string) {
    const login = s.email;
    const senha = password ?? '•••••• (definida no cadastro)';
    return `Olá, ${s.full_name || 'aluno'}! Seu acesso ao ROI Shape está liberado.\nAcesse: ${APP_URL}\nLogin: ${login}\nSenha: ${senha}`;
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!profile || !resetStudent) return;
    const normalizedPassword = resetPassword.trim();
    if (normalizedPassword.length < 6) { setError('A senha deve ter ao menos 6 caracteres.'); return; }
    setResetting(true);
    setError(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ action: 'reset_password', student_id: resetStudent.id, password: normalizedPassword, personal_id: profile.id }),
      });
      const data = await res.json() as { error?: string; email?: string; full_name?: string; phone?: string | null };
      if (!res.ok || !data.email || !data.full_name) { setError(data.error ?? 'Não foi possível atualizar o acesso.'); return; }
      setCreatedCreds({ email: data.email, password: normalizedPassword, full_name: data.full_name, phone: data.phone ?? resetStudent.phone ?? '' });
      setResetStudent(null);
      setResetPassword('');
      setCreateOpen(true);
      showToast('Senha do aluno atualizada!');
    } catch {
      setError('Não foi possível atualizar o acesso. Tente novamente.');
    } finally {
      setResetting(false);
    }
  }

  async function quickResetStudent(s: StudentWithCount) {
    const defaultPassword = '@Roi2026';
    setResetting(true);
    setError(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ action: 'reset_password', student_id: s.id, password: defaultPassword, personal_id: profile?.id }),
      });
      const data = await res.json() as { error?: string; email?: string; full_name?: string; phone?: string | null };
      if (!res.ok || !data.email) { setError(data.error ?? 'Não foi possível resetar a senha.'); return; }
      const creds = { email: data.email, password: defaultPassword, full_name: data.full_name ?? s.full_name, phone: data.phone ?? s.phone ?? '' };
      const msg = buildInviteMessage(creds.full_name, creds.email, creds.password);
      const waUrl = whatsappLink(creds.phone, msg);
      setCreatedCreds(creds);
      setCreateOpen(true);
      showToast('Senha do aluno resetada para @Roi2026! Abrindo WhatsApp...');
      if (waUrl) window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setResetting(false);
    }
  }

  function buildBillingMessage(s: StudentWithCount) {
    const due = s.contract_due_date ? formatDate(s.contract_due_date) : 'this month';
    return `Olá, ${s.full_name || 'aluno'}! 👋\nEste é um lembrete amigável sobre sua mensalidade no ROI Shape.\nVencimento: ${due}\nStatus: ${PAYMENT_LABEL[s.payment_status]}\n\nQualquer dúvida, estou à disposição! 💪`;
  }

  function openCrmEdit(s: StudentWithCount) {
    setEditCrm({ ...s });
    setEditCrmOpen(true);
  }

  async function saveCrm() {
    if (!editCrm) return;
    setCrmSaving(true);
    setError(null);
    const { error } = await supabase
      .from('profiles')
      .update({
        payment_status: editCrm.payment_status,
        contract_due_date: editCrm.contract_due_date || null,
        contract_status: editCrm.contract_status,
      })
      .eq('id', editCrm.id);
    setCrmSaving(false);
    if (error) { setError(error.message); return; }
    setStudents((prev) => prev.map((s) => (s.id === editCrm.id ? { ...s, ...editCrm } : s)));
    setEditCrmOpen(false);
    showToast('CRM do aluno atualizado!');
  }

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800 shadow-lg animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          {toast}
        </div>
      )}
      <PageHeader
        title="Alunos"
        description="Gerencie seus alunos, mensalidades e contratos. Crie contas e envie acessos/cobranças pelo WhatsApp."
        actions={
          <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => { setCreateOpen(true); setCreatedCreds(null); setError(null); }}>
            Novo aluno
          </Button>
        }
      />

      <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            placeholder="Buscar por nome, e-mail ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="min-w-[160px]">
            <option value="all">Todos os status</option>
            <option value="paid">Em dia</option>
            <option value="pending">A vencer</option>
            <option value="overdue">Atrasado</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title={students.length === 0 ? 'Nenhum aluno cadastrado' : 'Nenhum resultado'}
          description={students.length === 0 ? 'Crie seu primeiro aluno para começar a montar treinos.' : 'Ajuste a busca para encontrar alunos.'}
          action={students.length === 0 && <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>Cadastrar aluno</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className="group flex flex-col rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all hover:shadow-cardHover">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white">
                  {initials(s.full_name || s.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-ink-900">{s.full_name || 'Sem nome'}</h3>
                  <p className="truncate text-xs text-ink-500">{s.email}</p>
                  {s.phone && <p className="truncate text-xs text-ink-500">{s.phone}</p>}
                </div>
                <button
                  onClick={() => openCrmEdit(s)}
                  className="shrink-0 rounded-lg p-1.5 text-ink-400 opacity-0 transition-opacity hover:bg-ink-100 hover:text-ink-700 group-hover:opacity-100"
                  title="Editar CRM"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge tone={PAYMENT_TONE[s.payment_status]}>
                  <DollarSign className="h-3 w-3" /> {PAYMENT_LABEL[s.payment_status]}
                </Badge>
                <Badge tone={CONTRACT_TONE[s.contract_status]}>
                  {CONTRACT_LABEL[s.contract_status]}
                </Badge>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
                {s.contract_due_date ? (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Venc.: {formatDate(s.contract_due_date)}
                  </span>
                ) : (
                  <span className="text-ink-400">Sem data de vencimento</span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Badge tone="brand"><Dumbbell className="h-3 w-3" /> {s.workout_count ?? 0} treino{(s.workout_count ?? 0) !== 1 ? 's' : ''}</Badge>
                <span className="ml-auto text-xs text-ink-400">{formatDate(s.created_at)}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-ink-100 pt-4">
                <Button variant="outline" size="sm" onClick={() => navigate({ name: 'student-detail', studentId: s.id })}>
                  Ver perfil
                </Button>
                <a
                  href={whatsappLink(s.phone ?? '', buildAccessMessage(s))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-green-50 px-3 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200 transition-colors hover:bg-green-100"
                >
                  <MessageCircle className="h-4 w-4" /> Acesso
                </a>
                <button
                  type="button"
                  onClick={() => { setResetStudent(s); setResetPassword(''); setError(null); }}
                  className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand-50 px-3 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-100"
                >
                  <KeyRound className="h-4 w-4" /> Redefinir senha e enviar acesso
                </button>
                <button
                  type="button"
                  disabled={resetting}
                  onClick={() => quickResetStudent(s)}
                  className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-3 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200 transition-colors hover:bg-amber-100 disabled:opacity-60"
                >
                  <KeyRound className="h-4 w-4" /> Reset rápido (senha @Roi2026)
                </button>
                <a
                  href={whatsappLink(s.phone ?? '', buildBillingMessage(s))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-orange-50 px-3 text-xs font-semibold text-orange-700 ring-1 ring-inset ring-orange-200 transition-colors hover:bg-orange-100"
                >
                  <Send className="h-4 w-4" /> Enviar cobrança via WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create student modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={createdCreds ? 'Acesso do aluno pronto' : 'Cadastrar novo aluno'}
        description={createdCreds ? 'Envie as credenciais abaixo pelo WhatsApp.' : 'Preencha os dados do aluno. A conta será criada e vinculada a você.'}
      >
        {createdCreds ? (
          <div className="space-y-5">
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Aluno cadastrado com sucesso!
              </div>
              <p className="mt-1.5 text-green-700">O convite já foi aberto no WhatsApp. Se não abriu, use o botão abaixo.</p>
            </div>
            <div className="rounded-xl bg-brand-50 border border-brand-200 p-4 text-sm">
              <p className="font-bold text-brand-800">{createdCreds.full_name}</p>
              <dl className="mt-3 space-y-1.5 text-brand-900">
                <div className="flex justify-between gap-3"><dt className="text-brand-600">Login</dt><dd className="font-semibold">{createdCreds.email}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-brand-600">Senha inicial</dt><dd className="font-semibold">{createdCreds.password}</dd></div>
              </dl>
              <p className="mt-3 rounded-lg bg-brand-100 px-3 py-2 text-xs text-brand-700">No primeiro acesso, o aluno será obrigado a trocar a senha por uma pessoal.</p>
            </div>
            <div className="rounded-xl bg-ink-50 border border-ink-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500 mb-2">Mensagem do WhatsApp</p>
              <pre className="whitespace-pre-wrap font-sans text-sm text-ink-700">{buildInviteMessage(createdCreds.full_name, createdCreds.email, createdCreds.password)}</pre>
            </div>
            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1" leftIcon={<X className="h-4 w-4" />} onClick={() => setCreateOpen(false)}>Fechar</Button>
              <a
                href={whatsappLink(createdCreds.phone, buildInviteMessage(createdCreds.full_name, createdCreds.email, createdCreds.password))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                <Send className="h-4 w-4" /> Enviar no WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Nome completo" placeholder="Ex.: Maria Silva" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            <Input label="E-mail" type="email" placeholder="aluno@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="WhatsApp" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Senha temporária" type="text" placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            {error && <ErrorBanner message={error} />}
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" leftIcon={<X className="h-4 w-4" />} onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" leftIcon={<Plus className="h-4 w-4" />} loading={creating}>Criar aluno</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!resetStudent}
        onClose={() => { setResetStudent(null); setError(null); }}
        title="Redefinir acesso do aluno"
        description={resetStudent ? `${resetStudent.full_name || resetStudent.email} receberá uma nova senha.` : undefined}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="Nova senha temporária"
            type="text"
            placeholder="Mínimo 6 caracteres"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            required
          />
          <p className="text-sm text-ink-500">Depois de salvar, o app mostrará o login e a senha em uma mensagem pronta para o WhatsApp.</p>
          {error && <ErrorBanner message={error} />}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="outline" onClick={() => { setResetStudent(null); setError(null); }}>Cancelar</Button>
            <Button type="submit" leftIcon={<KeyRound className="h-4 w-4" />} loading={resetting}>Atualizar acesso</Button>
          </div>
        </form>
      </Modal>

      {/* CRM edit modal */}
      <Modal
        open={editCrmOpen}
        onClose={() => setEditCrmOpen(false)}
        title="Editar CRM do aluno"
        description={editCrm ? editCrm.full_name || editCrm.email : undefined}
      >
        {editCrm && (
          <div className="space-y-4">
            <Select
              label="Status do pagamento"
              value={editCrm.payment_status}
              onChange={(e) => setEditCrm({ ...editCrm, payment_status: e.target.value as PaymentStatus })}
            >
              <option value="paid">Em dia</option>
              <option value="pending">A vencer</option>
              <option value="overdue">Atrasado</option>
            </Select>
            <Select
              label="Status do contrato"
              value={editCrm.contract_status}
              onChange={(e) => setEditCrm({ ...editCrm, contract_status: e.target.value as ContractStatus })}
            >
              <option value="active">Ativo</option>
              <option value="pending">Pendente</option>
              <option value="cancelled">Cancelado</option>
            </Select>
            <Input
              label="Data de vencimento do contrato"
              type="date"
              value={editCrm.contract_due_date ?? ''}
              onChange={(e) => setEditCrm({ ...editCrm, contract_due_date: e.target.value || null })}
              leftIcon={<Calendar className="h-4 w-4" />}
            />
            {error && <ErrorBanner message={error} />}
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" leftIcon={<X className="h-4 w-4" />} onClick={() => setEditCrmOpen(false)}>Cancelar</Button>
              <Button type="button" loading={crmSaving} onClick={saveCrm}>Salvar CRM</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
