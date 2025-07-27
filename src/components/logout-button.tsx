'use client';

import { logoutAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
      <span>Cerrar Sesión</span>
    </Button>
  );
}
