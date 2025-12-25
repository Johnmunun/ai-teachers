'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    setIsRegister(searchParams.get('register') === 'true');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isRegister) {
        // Validation
        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setIsLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères');
          setIsLoading(false);
          return;
        }

        // Register API call
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            name: formData.name,
            email: formData.email,
            password: formData.password
          })
        });

        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Erreur lors de l\'inscription');
          setIsLoading(false);
          return;
        }

        setSuccess('Compte créé avec succès ! Redirection...');
        setTimeout(() => {
          setIsRegister(false);
        }, 1500);
      } else {
        // Login with NextAuth
        const { signIn } = await import('next-auth/react');
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        });

        if (result?.error) {
          if (result.error.includes('blocked')) {
            setError('Votre compte a été bloqué. Contactez l\'administrateur.');
          } else {
            setError('Email ou mot de passe incorrect');
          }
          setIsLoading(false);
          return;
        }

        setSuccess('Connexion réussie ! Redirection...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (err) {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 grid-bg opacity-30" />
      <div className="fixed top-0 right-0 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] bg-cyan-500/10 rounded-full blur-[100px] sm:blur-[120px] lg:blur-[150px]" />
      <div className="fixed bottom-0 left-0 w-[300px] sm:w-[500px] lg:w-[600px] h-[300px] sm:h-[500px] lg:h-[600px] bg-violet-500/10 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px]" />

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-8 xl:p-12">
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <Code2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold">
                <span className="text-cyan-400">Coding</span>
                <span className="text-white">Live</span>
              </span>
            </Link>

            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Apprenez à coder
              <br />
              <span className="gradient-text">avec l'IA</span>
            </h1>

            <p className="text-xl text-slate-400 mb-8">
              Rejoignez une communauté d'apprenants passionnés et 
              maîtrisez le développement avec notre assistant virtuel intelligent.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              {['Cours en direct', 'Assistant IA', 'Paiement flexible', 'Révisions'].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
                >
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-300">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Decorative Code Block */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute -bottom-20 -right-20 w-80 opacity-30"
          >
            <div className="code-block p-4 text-xs font-mono text-slate-500">
              <div><span className="text-violet-400">const</span> success = <span className="text-cyan-400">await</span> learn();</div>
              <div><span className="text-violet-400">if</span> (success) {'{'}</div>
              <div className="pl-4">celebrate(<span className="text-emerald-400">"🎉"</span>);</div>
              <div>{'}'}</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 lg:hidden">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <Code2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold">
              <span className="text-cyan-400">Coding</span>
              <span className="text-white">Live</span>
            </span>
          </Link>

          {/* Form Card */}
          <div className="glass rounded-xl sm:rounded-2xl p-6 sm:p-8">
            {/* Toggle */}
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl mb-8">
              <button
                onClick={() => setIsRegister(false)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  !isRegister 
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => setIsRegister(true)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  isRegister 
                    ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Inscription
              </button>
            </div>

            {/* Title */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isRegister ? 'Créer un compte' : 'Bon retour !'}
              </h2>
              <p className="text-slate-400">
                {isRegister 
                  ? 'Rejoignez CodingLive et commencez votre apprentissage'
                  : 'Connectez-vous pour accéder à vos cours'
                }
              </p>
            </div>

            {/* Alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm">{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-400 text-sm">{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {isRegister && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm text-slate-400 mb-2">Nom complet</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Jean Dupont"
                        required={isRegister}
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vous@exemple.com"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isRegister && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm text-slate-400 mb-2">Confirmer le mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        required={isRegister}
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isRegister && (
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300 transition">
                    Mot de passe oublié ?
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-glow w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-600 text-white py-4 rounded-xl font-semibold hover:shadow-xl hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isRegister ? 'Créer mon compte' : 'Se connecter'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[#0f172a] text-slate-500 text-sm">ou</span>
              </div>
            </div>

            {/* Demo Access */}
            <Link
              href="/classroom/demo?role=student&name=Visiteur"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-medium hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
              Essayer la démo gratuite
            </Link>
          </div>

          {/* Terms */}
          <p className="text-center text-sm text-slate-500 mt-6">
            En continuant, vous acceptez nos{' '}
            <Link href="/terms" className="text-cyan-400 hover:underline">Conditions</Link>
            {' '}et{' '}
            <Link href="/privacy" className="text-cyan-400 hover:underline">Politique de confidentialité</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
