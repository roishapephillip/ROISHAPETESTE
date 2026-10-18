import { useState, type FormEvent } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, Video, Sparkles, MessageCircle } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Mode = 'login' | 'signup';

const ADMIN_EMAIL = 'fcassessoria13@gmail.com';
const SUPPORT_WHATSAPP = '5511999999999';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Safety timeout: if Supabase doesn't respond within 3s, stop loading and show a message.
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('O servidor demorou a responder. Verifique sua conexão e tente novamente.');
    }, 3000);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (mode === 'login') {
        const { error } = await signIn(trimmedEmail, password);
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
        const { error } = await signUp(trimmedEmail, password, fullName.trim());
        if (error) setError(error);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0D0D0D] px-4 py-10 text-white sm:px-6">
      {/* technological neon grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
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
        <div className="mt-8 grid w-full grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#161616] p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
              mode === 'login' ? 'bg-[#00E676] text-[#0D0D0D]' : 'text-white/60 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
              mode === 'signup' ? 'bg-[#00E676] text-[#0D0D0D]' : 'text-white/60 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Auth container */}
        <div className="mt-5 w-full rounded-2xl border border-white/10 bg-[#161616] p-6 shadow-2xl shadow-black/40 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
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
              type="email"
              label="E-mail"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              variant="dark"
              required
              autoComplete="email"
            />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              label="Senha"
              placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
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
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            {mode === 'login' && (
              <div className="-mt-1 text-right">
                <a
                  href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('Olá! Esqueci minha senha do ROI Shape. Pode me ajudar a redefinir?')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00E676] hover:text-[#00C853]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Esqueceu a senha? Fale com seu Personal no WhatsApp
                </a>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full !bg-[#00E676] !text-[#0D0D0D] hover:!bg-[#00C853]"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {mode === 'login' ? 'Entrar ->' : 'Criar conta ->'}
            </Button>
          </form>

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
