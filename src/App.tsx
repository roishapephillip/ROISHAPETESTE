import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NavProvider, useNav } from '@/context/NavContext';
import { Layout } from '@/components/Layout';
import { AuthScreen } from '@/pages/AuthScreen';
import { Dashboard } from '@/pages/Dashboard';
import { Students } from '@/pages/Students';
import { StudentDetail } from '@/pages/StudentDetail';
import { Workouts } from '@/pages/Workouts';
import { WorkoutDetail } from '@/pages/WorkoutDetail';
import { WorkoutBuilder } from '@/pages/WorkoutBuilder';
import { Templates } from '@/pages/Templates';
import { ExerciseLibrary } from '@/pages/ExerciseLibrary';
import { ProfilePage } from '@/pages/Profile';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    </div>
  );
}

function Router() {
  const { route } = useNav();
  const { role } = useAuth();

  switch (route.name) {
    case 'dashboard':
      return <Dashboard />;
    case 'students':
      return role === 'student' ? <Dashboard /> : <Students />;
    case 'student-detail':
      return role === 'student' ? <Dashboard /> : <StudentDetail studentId={route.studentId} />;
    case 'workouts':
      return <Workouts />;
    case 'workout-detail':
      return <WorkoutDetail workoutId={route.workoutId} />;
    case 'workout-edit':
      return <WorkoutDetail workoutId={route.workoutId} editMode />;
    case 'workout-new':
      return role === 'student' ? <Dashboard /> : <WorkoutBuilder studentId={route.studentId} templateId={route.templateId} />;
    case 'templates':
      return role === 'student' ? <Dashboard /> : <Templates />;
    case 'exercises':
      return <ExerciseLibrary />;
    case 'profile':
      return <ProfilePage />;
    default:
      return <Dashboard />;
  }
}

function AppInner() {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;

  return (
    <NavProvider>
      <Layout>
        <Router />
      </Layout>
    </NavProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
