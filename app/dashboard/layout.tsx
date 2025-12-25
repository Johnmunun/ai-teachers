import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = {
    name: session.user.name || 'Utilisateur',
    email: session.user.email || '',
    role: (session.user as any).role || 'STUDENT',
    image: session.user.image || undefined,
  };

  return <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>;
}


