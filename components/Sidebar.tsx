'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  LayoutDashboard,
  BookOpen,
  CreditCard,
  History,
  Brain,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Calendar,
  Menu,
  X
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: 'TEACHER' | 'STUDENT';
    image?: string;
  };
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

const teacherLinks = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/classrooms', label: 'Cours rapides', icon: BookOpen },
  { href: '/dashboard/training', label: 'Formations complètes', icon: GraduationCap },
  { href: '/dashboard/students', label: 'Étudiants', icon: Users },
  { href: '/dashboard/payments', label: 'Paiements', icon: CreditCard },
  { href: '/dashboard/sessions', label: 'Historique', icon: History },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];

const studentLinks = [
  { href: '/dashboard', label: 'Mon espace', icon: LayoutDashboard },
  { href: '/dashboard/progression', label: 'Ma progression', icon: Calendar },
  { href: '/dashboard/courses', label: 'Mes cours', icon: BookOpen },
  { href: '/dashboard/grades', label: 'Mes notes', icon: GraduationCap },
  { href: '/dashboard/payments', label: 'Mes paiements', icon: CreditCard },
  { href: '/dashboard/history', label: 'Historique', icon: History },
  { href: '/dashboard/revisions', label: 'Révisions IA', icon: Brain },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];

export default function Sidebar({ user, isMobileOpen = false, onMobileToggle }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  
  const links = user.role === 'TEACHER' ? teacherLinks : studentLinks;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsCollapsed(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    try {
      // Essayer avec signOut de next-auth/react
      await signOut({ 
        callbackUrl: '/login',
        redirect: false // On gère la redirection manuellement pour éviter les erreurs
      });
      
      // Redirection manuelle après signOut
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: supprimer la session et rediriger
      if (typeof window !== 'undefined') {
        // Nettoyer le localStorage si nécessaire
        localStorage.removeItem('codinglive_settings');
        window.location.href = '/login';
      }
    }
  };

  const handleLinkClick = () => {
    if (isMobile && onMobileToggle) {
      onMobileToggle();
    }
  };

  // Mobile sidebar content
  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={handleLinkClick}>
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 blur-lg opacity-40" />
            </div>
            <AnimatePresence>
              {(!isCollapsed || isMobile) && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-lg font-bold whitespace-nowrap"
                >
                  <span className="text-cyan-400">Coding</span>
                  <span className="text-white">Live</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          {isMobile && onMobileToggle && (
            <button
              onClick={onMobileToggle}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {user.image ? (
              <img 
                src={user.image} 
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0a0f1a]" />
          </div>
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 min-w-0"
              >
                <div className="font-medium text-white truncate">{user.name}</div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    user.role === 'TEACHER' 
                      ? 'bg-violet-500/20 text-violet-400' 
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {user.role === 'TEACHER' ? 'Enseignant' : 'Étudiant'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={handleLinkClick}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-violet-500 rounded-r-full"
                />
              )}
              
              <link.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
              
              <AnimatePresence>
                {(!isCollapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="whitespace-nowrap"
                  >
                    {link.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state (desktop only) */}
              {isCollapsed && !isMobile && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {link.label}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                </div>
              )}
            </Link>
          );
        })}

        {/* Quick Actions */}
        {user.role === 'TEACHER' && (
          <div className="pt-4 mt-4 border-t border-white/5">
            <AnimatePresence>
              {(!isCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Actions rapides
                </motion.div>
              )}
            </AnimatePresence>
            
            <Link
              href="/classroom/new"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-all group"
            >
              <Sparkles className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {(!isCollapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="whitespace-nowrap"
                  >
                    Démarrer un cours
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        )}

        {user.role === 'STUDENT' && (
          <div className="pt-4 mt-4 border-t border-white/5">
            <Link
              href="/dashboard/revisions"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-rose-500/10 border border-violet-500/20 text-violet-400 hover:border-violet-500/40 transition-all group"
            >
              <GraduationCap className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {(!isCollapsed || isMobile) && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="whitespace-nowrap"
                  >
                    <div className="text-sm font-medium">Réviser avec l'IA</div>
                    <div className="text-xs text-slate-500">Nathalie vous attend</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>
        )}
      </nav>

      {/* Logout & Collapse */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="whitespace-nowrap"
              >
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Réduire</span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileToggle}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed left-0 top-0 h-screen w-[280px] bg-[#0a0f1a] border-r border-white/5 flex flex-col z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed && !isMobile ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex fixed left-0 top-0 h-screen bg-[#0a0f1a] border-r border-white/5 flex-col z-40"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}

// Mobile menu button component
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#0a0f1a]/90 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 transition"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}

