import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

const ADMIN_EMAIL = 'fcassessoria13@gmail.com';

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos. Verifique e tente novamente.';
  }
  if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) {
    return 'Seu cadastro está quase pronto. Tente entrar novamente — a confirmação de e-mail foi desativada.';
  }
  if (m.includes('password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'Este e-mail já está cadastrado. Faça login para continuar.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  return message;
}

function buildFallbackProfile(userId: string, email: string): Profile {
  const role: UserRole = email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'personal';
  return {
    id: userId,
    email,
    full_name: email.split('@')[0],
    role,
    phone: null,
    avatar_url: null,
    assigned_personal_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    payment_status: 'paid',
    contract_due_date: null,
    contract_status: 'active',
    must_change_password: false,
  };
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  mustChangePassword: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  changeFirstPassword: (newPassword: string) => Promise<{ error: string | null }>;
  recoveryMode: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  const ensureAdminRole = async (userId: string, email: string, current: Profile): Promise<Profile> => {
    if (email.toLowerCase() === ADMIN_EMAIL && current.role !== 'admin') {
      const { data: updated } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId)
        .select('*')
        .maybeSingle();
      return (updated as Profile) ?? current;
    }
    return current;
  };

  const fetchProfile = async (userId: string, email?: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Profile fetch error:', error);
      if (email) setProfile(buildFallbackProfile(userId, email));
      return;
    }
    if (data) {
      const profile = data as Profile;
      const finalProfile = email ? await ensureAdminRole(userId, email, profile) : profile;
      setProfile(finalProfile);
    } else if (email) {
      // No profile row yet (e.g. login before trigger fired, or brand-new signup).
      const role: UserRole = email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'personal';
      const { data: created, error: createErr } = await supabase
        .from('profiles')
        .insert({ id: userId, email, full_name: email.split('@')[0], role })
        .select('*')
        .maybeSingle();
      setProfile(createErr ? buildFallbackProfile(userId, email) : (created as Profile));
    }
  };

  useEffect(() => {
    // Safety timeout: never stay in loading state longer than 3 seconds,
    // even if Supabase is unreachable or the profile fetch hangs.
 const timeoutId = setTimeout(() => setLoading(false), 3000);

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        fetchProfile(data.session.user.id, data.session.user.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      setSession(newSession);
      if (newSession) {
        setLoading(false);
        (async () => {
          await fetchProfile(newSession.user.id, newSession.user.email);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: friendlyAuthError(error.message) };
    // Garante que o perfil exista imediatamente após o login, mesmo se a trigger ainda não rodou.
    if (data.user) {
      await fetchProfile(data.user.id, data.user.email);
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const role: UserRole = trimmedEmail === ADMIN_EMAIL ? 'admin' : 'personal';
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) return { error: friendlyAuthError(error.message) };
    // signUp pode retornar sem sessão se a confirmação de e-mail estiver ligada.
    // Nesse caso, tentamos logar imediatamente para dar bypass na confirmação.
    if (data.user && !data.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (signInErr) return { error: friendlyAuthError(signInErr.message) };
    }
    // Set a fallback profile immediately so the UI never gets stuck waiting.
    if (data.user) {
      setProfile(buildFallbackProfile(data.user.id, data.user.email ?? trimmedEmail));
      setLoading(false);
      fetchProfile(data.user.id, data.user.email);
    }
    return { error: null };
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    });
    return { error: error ? friendlyAuthError(error.message) : null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      setRecoveryMode(false);
      await supabase.auth.signOut();
    }
    return { error: error ? friendlyAuthError(error.message) : null };
  };

  const changeFirstPassword = async (newPassword: string) => {
    if (!session?.user || !profile) return { error: 'Sessão inválida.' };
    if (newPassword.trim().length < 6) return { error: 'A nova senha deve ter ao menos 6 caracteres.' };
    const { error: authErr } = await supabase.auth.updateUser({ password: newPassword.trim() });
    if (authErr) return { error: friendlyAuthError(authErr.message) };
    const { error: dbErr } = await supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', profile.id);
    if (dbErr) return { error: 'Senha atualizada, mas houve um erro ao liberar o acesso. Tente novamente.' };
    setProfile({ ...profile, must_change_password: false });
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.user) await fetchProfile(session.user.id, session.user.email);
  };

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    mustChangePassword: profile?.must_change_password ?? false,
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    changeFirstPassword,
    recoveryMode,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
