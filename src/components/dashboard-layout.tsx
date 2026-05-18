'use client';

import { useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { MainNav } from './main-nav';
import { Bot, Menu } from 'lucide-react';
import { LogoutButton } from './logout-button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function DashboardLayout({
  children,
  title,
  headerActions,
}: {
  children: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const SidebarNavContent = (
    <>
      <SidebarHeader className="p-4">
        <a href="/dashboard" className="flex items-center gap-2">
          <Bot className="w-8 h-8 text-primary" />
          <span className="text-lg font-semibold">Notion Finance</span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <MainNav />
      </SidebarContent>
      <SidebarFooter>
        <LogoutButton />
      </SidebarFooter>
    </>
  );

  return (
    <SidebarProvider>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar>{SidebarNavContent}</Sidebar>
      </div>

      <SidebarInset>
        <div className="p-4 sm:p-6">
          <header className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              {/* Mobile Sidebar (Sheet) */}
              <div className="md:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Toggle Menu">
                      <Menu className="w-6 h-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[18rem] p-0 flex flex-col bg-sidebar text-sidebar-foreground">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    {SidebarNavContent}
                  </SheetContent>
                </Sheet>
              </div>

              <h1 className="text-xl md:text-3xl font-bold tracking-tight">
                {title}
              </h1>
            </div>
            {headerActions}
          </header>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
