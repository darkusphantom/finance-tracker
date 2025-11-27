'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { MainNav } from './main-nav';
import { Bot } from 'lucide-react';
import { LogoutButton } from './logout-button';

export function DashboardLayout({
  children,
  title,
  headerActions,
}: {
  children: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
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
      </Sidebar>
      <SidebarInset>
        <div className="p-4 sm:p-6">
          <header className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
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
