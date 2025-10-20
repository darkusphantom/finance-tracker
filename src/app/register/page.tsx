import { RegisterForm } from '@/components/register-form';
import { Bot } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <Bot className="w-12 h-12 text-primary" />
          <h1 className="text-3xl font-bold">Crear Cuenta</h1>
          <p className="text-muted-foreground text-center">
            Únete a Notion Finance para tomar el control de tu dinero.
          </p>
        </div>
        <p className="text-xl font-bold text-center">No te vas a registrar, wey</p>
        {
          /*
          <RegisterForm />
          */
        }
         <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
