'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Wallet, PiggyBank, ReceiptText } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function MainNav() {
  const pathname = usePathname();
  const menuItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/accounts', label: 'Accounts', icon: Wallet },
    { href: '/debts', label: 'Debts', icon: PiggyBank },
    { href: '/transactions', label: 'Transactions', icon: ReceiptText },
  ];

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton
            href={item.href}
            isActive={pathname === item.href}
            asChild
          >
            <a href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
