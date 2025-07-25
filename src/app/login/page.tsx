import { LoginForm } from '@/components/login-form';
import { Bot } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
            <Bot className="w-12 h-12 text-primary" />
            <h1 className="text-3xl font-bold">Notion Finance</h1>
            <p className="text-muted-foreground text-center">
                Inicia sesión para gestionar tus finanzas.
            </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
