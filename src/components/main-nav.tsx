import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Wallet, PiggyBank, ReceiptText } from 'lucide-react';

export function MainNav() {
  // For this single-page app, only Dashboard is "active".
  // In a multi-page app, you'd use usePathname() to determine active state.
  const menuItems = [
    { href: '#', label: 'Dashboard', icon: LayoutDashboard, active: true },
    { href: '#', label: 'Accounts', icon: Wallet, active: false },
    { href: '#', label: 'Debts', icon: PiggyBank, active: false },
    { href: '#', label: 'Transactions', icon: ReceiptText, active: false },
  ];

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton
            href={item.href}
            isActive={item.active}
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
