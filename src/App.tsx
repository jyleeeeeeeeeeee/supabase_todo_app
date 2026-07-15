import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import TodoApp from './components/TodoApp';

function Root() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-lime-50 to-green-100">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
      </div>
    );
  }

  return session ? <TodoApp /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
