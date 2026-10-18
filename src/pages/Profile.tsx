import { useEffect, useState, type FormEvent } from 'react';
import { User, Save, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { initials } from '@/lib/utils';

export function ProfilePage() {
  const { profile, role, refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName.trim(), phone: phone.trim() || null }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!profile) return null;

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Meu perfil" description="Atualize suas informações pessoais." />

      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-900 text-xl font-bold text-white">
            {initials(profile.full_name || profile.email)}
          </div>
          <div>
            <p className="text-lg font-bold text-ink-900">{profile.full_name || 'Sem nome'}</p>
            <p className="text-sm text-ink-500">{profile.email}</p>
            <Badge tone="brand" className="mt-1.5">{role === 'admin' ? 'Administrador Master' : role === 'personal' ? 'Personal Trainer' : 'Aluno'}</Badge>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} leftIcon={<User className="h-4 w-4" />} />
          <Input label="WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
          <Input label="E-mail" value={profile.email} disabled />
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" leftIcon={<Save className="h-4 w-4" />} loading={saving}>Salvar alterações</Button>
            {saved && <span className="text-sm font-medium text-brand-700 animate-fade-in">Salvo!</span>}
          </div>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">
        <Button variant="danger" leftIcon={<LogOut className="h-4 w-4" />} onClick={signOut}>Encerrar sessão</Button>
      </div>
    </div>
  );
}
