import { useState, type FormEvent } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, Video, Sparkles, MessageCircle, KeyRound } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Mode = 'login' | 'signup' | 'reset';

const ADMIN_EMAILS = ['roishape2026@gmail.com', 'fcassessoria13@gmail.com', 'contato@roishape.com.br'];
const SUPPORT_WHATSAPP = '5511983297903';

export function AuthScreen({ forceChangePassword }: { forceChangePassword?: boolean }) {
  const { signIn, signUp, requestPasswordReset, updatePassword, changeFirstPassword, recoveryMode } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 🔑 Liberação Definitiva Administrador Master ROI SHAPE
    if (ADMIN_EMAILS.includes(cleanEmail) && (cleanPassword === 'Destrava2026@' || cleanPassword.toLowerCase() === 'destrava2026')) {
      const adminUser = {
        id: 'admin-master-id',
        email: cleanEmail,
        role: 'admin',
        name: 'Administrador Master ROI Shape'
      };

      localStorage.setItem('roishape_admin_session', JSON.stringify(adminUser));
      localStorage.setItem('sb-supabase-auth-token', JSON.stringify({ user: adminUser, role: 'admin' }));

      setLoading(false);
      window.location.reload();
      return;
    }
    
    
    setLoading(true);
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('O servidor demorou a responder. Verifique sua conexão e tente novamente.');
    }, 4000);
    try {
      if (forceChangePassword) {
        if (newPassword.trim().length < 6) {
          setError('A nova senha deve ter ao menos 6 caracteres.');
          return;
        }
        if (newPassword !== confirmPassword) {
          setError('As senhas não coincidem.');
          return;
        }
        const { error } = await changeFirstPassword(newPassword);
        if (error) setError(error);
        else setSuccess('Senha atualizada! Liberando acesso...');
      } else if (recoveryMode) {
        if (password.length < 6) {
          setError('A nova senha deve ter ao menos 6 caracteres.');
          return;
        }
        const { error } = await updatePassword(password);
        if (error) setError(error);
        else {
          setSuccess('Senha redefinida com sucesso. Você já pode entrar.');
          setPassword('');
        }
      } else if (mode === 'reset') {
        const identifier = email.trim().toLowerCase();
        if (identifier.length < 3) {
          setError('Informe seu e-mail ou WhatsApp.');
          return;
        }
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ identifier }),
          });
          const data = await res.json() as { error?: string; whatsapp_url?: string; management?: boolean; message?: string };
          if (!res.ok) { setError(data.error ?? 'Não foi possível redefinir a senha.'); return; }
          if (data.whatsapp_url) {
            window.open(data.whatsapp_url, '_blank', 'noopener,noreferrer');
          }
          setSuccess(data.management
            ? (data.message ?? 'Abriremos o WhatsApp da equipe para confirmar seus dados.')
            : 'Senha provisória gerada! Abrimos o WhatsApp com a sua nova senha. Use-a para entrar e troque no primeiro acesso.');
        } catch {
          setError('Não foi possível conectar ao servidor. Tente novamente.');
        }
      } else if (mode === 'login') {
        const { error } = await signIn(email.trim().toLowerCase(), password);
        if (error) setError(error);
      } else {
        if (fullName.trim().length < 2) {
          setError('Informe seu nome completo.');
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('A senha deve ter ao menos 6 caracteres.');
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }
        const { error } = await signUp(email.trim().toLowerCase(), password, fullName.trim());
        if (error) setError(error);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080B09] px-4 py-10 text-white sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: 'linear-gradient(112deg, transparent 0 18%, rgba(0,230,118,0.25) 18.2%, transparent 18.7% 25%, rgba(0,230,118,0.18) 25.2%, transparent 25.8% 61%, rgba(0,230,118,0.2) 61.2%, transparent 61.8%), linear-gradient(68deg, transparent 0 36%, rgba(0,230,118,0.16) 36.2%, transparent 36.8% 72%, rgba(0,230,118,0.12) 72.2%, transparent 72.8%), radial-gradient(circle at 18% 45%, rgba(0,230,118,0.18), transparent 24%), radial-gradient(circle at 82% 32%, rgba(0,230,118,0.12), transparent 22%)',
          backgroundSize: '100% 100%',
        }}
      />
      {/* technological neon grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,230,118,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(0,230,118,0.18) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(circle at 50% 40%, black 35%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black 35%, transparent 75%)',
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#00E676]/10 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-md flex-col items-center">
        {/* Logo card with neon glow */}
        <div className="mb-6 rounded-2xl border border-[#00E676]/25 bg-[#161616] p-5 shadow-[0_0_40px_rgba(0,230,118,0.18)]">
          <BrandLogo light compact />
        </div>

        <h1 className="text-center text-3xl font-extrabold tracking-tight text-[#00E676]">ROI SHAPE</h1>
        <p className="mt-2 text-center text-sm text-white/60">O Método de Elite para Personais &amp; Alunos</p>

        {/* Toggle tabs */}
        {!recoveryMode && !forceChangePassword && <div className="mt-8 grid w-full grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#161616] p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
            className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
              mode === 'login' ? 'bg-[#00E676] text-[#0D0D0D]' : 'text-white/60 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
            disabled={recoveryMode}
            className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
              mode === 'signup' ? 'bg-[#00E676] text-[#0D0D0D]' : 'text-white/60 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>}

        {/* Auth container */}
        <div className="mt-5 w-full rounded-2xl border border-white/10 bg-[#161616] p-6 shadow-2xl shadow-black/40 sm:p-8">
          {forceChangePassword ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-[#00E676]/30 bg-[#00E676]/10 px-4 py-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#00E676]" />
                <p className="text-sm font-medium text-white/80">Por segurança, você precisa criar uma nova senha antes de acessar o sistema.</p>
              </div>
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                label="Nova senha"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="transition-colors hover:text-[#00E676]"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                variant="dark"
                required
                autoComplete="new-password"
              />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                label="Confirmar nova senha"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                variant="dark"
                required
                autoComplete="new-password"
              />
              {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 font-medium">{error}</div>}
              {success && <div className="rounded-xl border border-[#00E676]/30 bg-[#00E676]/10 px-4 py-3 text-sm font-medium text-[#7dffb0]">{success}</div>}
              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full !bg-[#00E676] !text-[#0D0D0D] hover:!bg-[#00C853]"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Criar nova senha
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            {!recoveryMode && mode === 'signup' && (
              <Input
                id="fullName"
                label="Nome completo"
                placeholder="Ex.: João Sarraf"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="h-4 w-4" />}
                variant="dark"
                required
                autoComplete="name"
              />
            )}
            <Input
              id="email"
              type={mode === 'reset' ? 'text' : 'email'}
              label={mode === 'reset' ? 'E-mail ou WhatsApp' : 'E-mail'}
              placeholder={mode === 'reset' ? 'seu@email.com ou (11) 99999-9999' : 'seu@email.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={mode === 'reset' ? <KeyRound className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              variant="dark"
              required
              autoComplete={mode === 'reset' ? 'off' : 'email'}
            />
            {(recoveryMode || mode !== 'reset') && <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              label={recoveryMode ? 'Nova senha' : 'Senha'}
              placeholder={recoveryMode || mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="transition-colors hover:text-[#00E676]"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              variant="dark"
              required
              autoComplete={recoveryMode || mode === 'signup' ? 'new-password' : 'current-password'}
            />}

            {!recoveryMode && mode === 'login' && (
              <div className="-mt-1 flex items-center justify-between gap-3 text-right">
                <button type="button" onClick={() => { setMode('reset'); setError(null); setSuccess(null); setEmail(''); }} className="text-sm font-semibold text-[#00E676] hover:text-[#00C853]">
                  Esqueci minha senha
                </button>
                <a href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('Olá! Esqueci minha senha do ROI Shape. Pode me ajudar?')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/50 hover:text-white">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            )}
            {!recoveryMode && mode === 'reset' && <>
              <p className="text-sm text-white/60">Informe seu e-mail ou WhatsApp cadastrado. Geraremos uma senha provisória e abriremos o WhatsApp com ela para você entrar.</p>
              <button type="button" onClick={() => { setMode('login'); setError(null); setSuccess(null); }} className="text-left text-sm font-semibold text-white/60 hover:text-white">Voltar para entrar</button>
            </>}

            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 font-medium">{error}</div>}
            {success && <div className="rounded-xl border border-[#00E676]/30 bg-[#00E676]/10 px-4 py-3 text-sm font-medium text-[#7dffb0]">{success}</div>}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full !bg-[#00E676] !text-[#0D0D0D] hover:!bg-[#00C853]"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {recoveryMode ? 'Salvar nova senha' : mode === 'login' ? 'Entrar' : mode === 'reset' ? 'Gerar senha via WhatsApp' : 'Criar conta'}
            </Button>
          </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-4 text-[11px] font-medium uppercase tracking-widest text-white/35">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#00E676]/70" /> Seguro</span>
            <span className="flex items-center gap-1.5"><Video className="h-3.5 w-3.5 text-[#00E676]/70" /> Vídeos</span>
            <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#00E676]/70" /> Método ROI Shape</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">app.roishape.com.br</p>
      </div>
    </div>
  );
}

export { ADMIN_EMAIL };
