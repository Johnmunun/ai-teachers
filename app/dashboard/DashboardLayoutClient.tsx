'use client';

import { useState } from 'react';
import Sidebar, { MobileMenuButton } from '@/components/Sidebar';

interface DashboardLayoutClientProps {
  user: {
    name: string;
    email: string;
    role: 'TEACHER' | 'STUDENT';
    image?: string;
  };
  children: React.ReactNode;
}

export default function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#030712]">
      <MobileMenuButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <Sidebar 
        user={user} 
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={() => setIsMobileMenuOpen(false)}
      />
      <main className="lg:ml-[280px] min-h-screen pt-16 lg:pt-0 px-4 lg:px-8 pb-8">
        {children}
      </main>
    </div>
  );
}



