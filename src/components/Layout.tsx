import { type ReactNode, useState } from 'react';
import {
  LayoutDashboard, Users, Dumbbell, Library, Video, LogOut, Menu, X, UserCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNav, type Route } from '@/context/NavContext';
import { initials } from '@/lib/utils';
import { BrandLogo } from '@/components/BrandLogo';

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  route: Route;
  roles: Array<'admin' | 'personal' | 'student'>;
  match: (r: Route) => boolean;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard', icon: LayoutDashboard, route: { name: 'dashboard' },
    roles: ['admin', 'personal', 'student'],
    match: (r) => r.name === 'dashboard',
  },
  {
    label: 'Alunos', icon: Users, route: { name: 'students' },
    roles: ['admin', 'personal'],
    match: (r) => r.name === 'students' || r.name === 'student-detail',
  },
  {
    label: 'Fichas de Treino', icon: Dumbbell, route: { name: 'workouts' },
    roles: ['admin', 'personal'],
    match: (r) => r.name === 'workouts' || r.name === 'workout-detail' || r.name === 'workout-edit' || r.name === 'workout-new',
  },
  {
    label: 'Modelos de Treino', icon: Library, route: { name: 'templates' },
    roles: ['admin', 'personal'],
    match: (r) => r.name === 'templates',
  },
  {
    label: 'Biblioteca de Exercícios', icon: Video, route: { name: 'exercises' },
    roles: ['admin', 'personal', 'student'],
    match: (r) => r.name === 'exercises',
  },
];

const studentNavItems: NavItem[] = [
  {
    label: 'Dashboard', icon: LayoutDashboard, route: { name: 'dashboard' },
    roles: ['student'],
    match: (r) => r.name === 'dashboard',
  },
  {
    label: 'Meus Treinos', icon: Dumbbell, route: { name: 'workouts' },
    roles: ['student'],
    match: (r) => r.name === 'workouts' || r.name === 'workout-detail',
  },
  {
    label: 'Biblioteca de Exercícios', icon: Video, route: { name: 'exercises' },
    roles: ['student'],
    match: (r) => r.name === 'exercises',
  },
];

export function Layout({ children }: { children: ReactNode }) {
  const { profile, role, signOut } = useAuth();
  const { route, navigate } = useNav();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = role === 'student' ? studentNavItems : navItems;
  const visibleItems = items.filter((item) => item.roles.includes(role ?? 'personal'));

  const handleNavigate = (r: Route) => {
    navigate(r);
    setMobileOpen(false);
  };

  const SidebarContent = (
    <div className="flex h-full flex-col bg-[#050605]">
      <div className="border-b border-white/10 px-5 py-5"><BrandLogo light /></div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const active = item.match(route);
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <button
                  onClick={() => handleNavigate(item.route)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    active
                      ? 'bg-brand-400/15 text-brand-300 ring-1 ring-inset ring-brand-400/25'
                      : 'text-white/65 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-brand-400' : 'text-white/35 group-hover:text-brand-300'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => handleNavigate({ name: 'profile' })}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
            route.name === 'profile' ? 'bg-brand-400/15' : 'hover:bg-white/10'
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-white text-xs font-bold">
            {initials(profile?.full_name || profile?.email || '')}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold text-white">{profile?.full_name || 'Usuário'}</p>
            <p className="truncate text-xs text-white/50 capitalize">{role === 'personal' ? 'Personal Trainer' : role === 'admin' ? 'Administrador' : 'Aluno'}</p>
          </div>
          <UserCircle className="h-5 w-5 text-white/35" />
        </button>
        <button
          onClick={signOut}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050605]">
      <div className="flex">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#050605] sticky top-0 h-screen">
          {SidebarContent}
        </aside>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-72 bg-[#050605] shadow-xl animate-slide-up">{SidebarContent}</aside>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-[#050605]/90 backdrop-blur px-4 py-3">
            <BrandLogo compact light />
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-white/70 hover:bg-white/10"
            >
              <Menu className="h-6 w-6" />
            </button>
          </header>

          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed top-3 right-3 z-50 rounded-lg bg-white p-2 shadow-lg"
            >
              <X className="h-5 w-5 text-ink-700" />
            </button>
          )}

          <main className="flex-1 bg-[#0D0D0D] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
