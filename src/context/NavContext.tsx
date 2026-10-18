import { createContext, useContext, useState, type ReactNode } from 'react';

export type Route =
  | { name: 'dashboard' }
  | { name: 'students' }
  | { name: 'workouts' }
  | { name: 'templates' }
  | { name: 'exercises' }
  | { name: 'student-detail'; studentId: string }
  | { name: 'workout-detail'; workoutId: string }
  | { name: 'workout-edit'; workoutId: string }
  | { name: 'workout-new'; studentId: string; templateId?: string }
  | { name: 'profile' };

interface NavContextValue {
  route: Route;
  navigate: (route: Route) => void;
}

const NavContext = createContext<NavContextValue | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });

  const navigate = (next: Route) => {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return <NavContext.Provider value={{ route, navigate }}>{children}</NavContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
