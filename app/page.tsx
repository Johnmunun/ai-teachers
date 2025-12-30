'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Code2, 
  Sparkles, 
  Users, 
  CreditCard, 
  Brain, 
  Play, 
  ChevronRight,
  Terminal,
  Zap,
  BookOpen,
  MessageSquare,
  Shield
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: "Assistant IA en Direct",
    description: "Une IA intelligente qui suit le cours et explique les concepts complexes en temps réel.",
    color: "cyan"
  },
  {
    icon: Terminal,
    title: "Code Exécutable",
    description: "Écrivez, exécutez et visualisez le code instantanément avec des animations spectaculaires.",
    color: "violet"
  },
  {
    icon: CreditCard,
    title: "Paiement par Tranches",
    description: "Gérez vos paiements facilement. Payez en plusieurs fois et suivez votre évolution.",
    color: "rose"
  },
  {
    icon: BookOpen,
    title: "Historique des Séances",
    description: "Retrouvez tout ce qui a été vu. L'IA vous aide à réviser avec une pédagogie adaptée.",
    color: "amber"
  },
  {
    icon: Users,
    title: "Espace Étudiant",
    description: "Chaque étudiant a son compte personnel avec suivi de progression et rappels.",
    color: "emerald"
  },
  {
    icon: Zap,
    title: "Temps Réel",
    description: "Technologie LiveKit pour une synchronisation parfaite entre prof et étudiants.",
    color: "blue"
  }
];

const codeSnippet = `// CodingLive - Votre assistant IA
async function apprendreLeProgramming() {
  const etudiant = await rejoindreClasse();
  
  while (etudiant.motivation) {
    const concept = await ia.expliquer();
    await etudiant.pratiquer(concept);
    etudiant.niveau++;
  }
  
  return "🎓 Développeur Certifié!";
}`;

const codeSnippetMobile = `// CodingLive - IA
async function apprendre() {
  const etudiant = await rejoindreClasse();
  while (etudiant.motivation) {
    await ia.expliquer();
    etudiant.niveau++;
  }
}`;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 grid-bg opacity-50" />
      <div className="fixed inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-violet-500/5" />
      
      {/* Floating Orbs */}
      <div className="fixed top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-cyan-500/20 rounded-full blur-[100px] float opacity-50 sm:opacity-100" />
      <div className="fixed bottom-20 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-violet-500/20 rounded-full blur-[120px] float opacity-50 sm:opacity-100" style={{ animationDelay: '-3s' }} />
      <div className="fixed top-1/2 left-1/2 w-32 h-32 sm:w-64 sm:h-64 bg-rose-500/10 rounded-full blur-[80px] float opacity-30 sm:opacity-100 hidden sm:block" style={{ animationDelay: '-1.5s' }} />

      {/* Navigation */}
      <nav className="relative z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                  <Code2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 blur-lg opacity-50 group-hover:opacity-75 transition" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight">
                <span className="text-cyan-400">Coding</span>
                <span className="text-white">Live</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link href="#features" className="text-slate-400 hover:text-white transition text-sm">Fonctionnalités</Link>
              <Link href="#how-it-works" className="text-slate-400 hover:text-white transition text-sm">Comment ça marche</Link>
              <Link href="#pricing" className="text-slate-400 hover:text-white transition text-sm">Tarifs</Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                href="/login" 
                className="hidden sm:inline text-slate-300 hover:text-white transition text-sm font-medium"
              >
                Connexion
              </Link>
              <Link 
                href="/login?register=true" 
                className="btn-glow bg-gradient-to-r from-cyan-500 to-violet-600 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                <span className="hidden sm:inline">Commencer</span>
                <span className="sm:hidden">OK</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-8 sm:pt-12 md:pt-20 pb-12 sm:pb-16 md:pb-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left order-2 lg:order-1"
            >
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 sm:mb-6">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                <span className="text-cyan-400 text-xs sm:text-sm font-medium">Propulsé par l'IA</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-4 sm:mb-6">
                <span className="text-white">Vivez le</span>
                <br />
                <span className="gradient-text">Code en Direct</span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-400 mb-6 sm:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
                Une plateforme révolutionnaire où l'IA vous accompagne en temps réel. 
                Apprenez à coder avec un assistant virtuel qui s'adapte à votre rythme.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 mb-8 sm:mb-12 justify-center lg:justify-start px-2 sm:px-0">
                <Link 
                  href="/login?register=true"
                  className="btn-glow group flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 sm:px-8 py-2.5 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-lg font-semibold hover:shadow-xl hover:shadow-cyan-500/30 transition-all w-full sm:w-auto"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="sm:hidden">Rejoindre</span>
                  <span className="hidden sm:inline">Rejoindre un cours</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform hidden sm:block" />
                </Link>
                <Link 
                  href="#demo"
                  className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white/5 border border-white/10 text-white px-4 sm:px-8 py-2.5 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-lg font-medium hover:bg-white/10 transition-all w-full sm:w-auto"
                >
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="sm:hidden">Démo</span>
                  <span className="hidden sm:inline">Voir la démo</span>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6 md:gap-12 justify-center lg:justify-start px-2 sm:px-0">
                <div className="text-center sm:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-white">500+</div>
                  <div className="text-slate-500 text-xs sm:text-sm">Étudiants formés</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-white">50+</div>
                  <div className="text-slate-500 text-xs sm:text-sm">Cours disponibles</div>
                </div>
                <div className="text-center sm:text-left col-span-2 sm:col-span-1">
                  <div className="text-2xl sm:text-3xl font-bold text-white">98%</div>
                  <div className="text-slate-500 text-xs sm:text-sm">Satisfaction</div>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Code Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative order-1 lg:order-2 mb-6 sm:mb-8 lg:mb-0"
            >
              <div className="relative max-w-full">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-xl sm:rounded-2xl blur-xl sm:blur-2xl" />
                
                {/* Code Window */}
                <div className="relative code-block overflow-hidden">
                  {/* Window Header */}
                  <div className="flex items-center justify-between px-2.5 sm:px-4 py-1.5 sm:py-3 border-b border-white/5">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-[9px] sm:text-xs text-slate-500 font-mono">main.js</span>
                    <div className="hidden sm:flex items-center gap-2 text-cyan-400">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                      <span className="text-[10px] sm:text-xs">IA Active</span>
                    </div>
                  </div>

                  {/* Code Content - Mobile version */}
                  <div className="p-2.5 sm:p-4 md:p-6 font-mono">
                    {/* Mobile code snippet (hidden on desktop) */}
                    <pre className="text-slate-300 leading-tight sm:hidden">
                      {codeSnippetMobile.split('\n').map((line, i) => (
                        <motion.div
                          key={`mobile-${i}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="flex"
                        >
                          <span className="text-slate-600 w-5 select-none text-[9px]">{i + 1}</span>
                          <span 
                            className="text-[9px] break-words"
                            dangerouslySetInnerHTML={{ 
                              __html: line
                                .replace(/(\/\/.*)/g, '<span class="text-slate-500">$1</span>')
                                .replace(/(".*?")/g, '<span class="text-emerald-400">$1</span>')
                                .replace(/(async|await|function|const|while|return|if)/g, '<span class="text-violet-400">$1</span>')
                                .replace(/(\w+)(?=\()/g, '<span class="text-cyan-400">$1</span>')
                            }}
                          />
                        </motion.div>
                      ))}
                    </pre>
                    {/* Desktop code snippet (hidden on mobile) */}
                    <pre className="hidden sm:block text-slate-300 leading-relaxed">
                      {codeSnippet.split('\n').map((line, i) => (
                        <motion.div
                          key={`desktop-${i}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="flex"
                        >
                          <span className="text-slate-600 w-6 md:w-8 select-none text-[10px] md:text-xs">{i + 1}</span>
                          <span 
                            className="text-[10px] md:text-xs"
                            dangerouslySetInnerHTML={{ 
                              __html: line
                                .replace(/(\/\/.*)/g, '<span class="text-slate-500">$1</span>')
                                .replace(/(".*?")/g, '<span class="text-emerald-400">$1</span>')
                                .replace(/(async|await|function|const|while|return|if)/g, '<span class="text-violet-400">$1</span>')
                                .replace(/(\w+)(?=\()/g, '<span class="text-cyan-400">$1</span>')
                            }}
                          />
                        </motion.div>
                      ))}
                    </pre>
                  </div>

                  {/* Scanline Effect */}
                  <div className="absolute inset-0 pointer-events-none scanline overflow-hidden" />
                </div>

                {/* Floating Badge - Hidden on mobile */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="hidden sm:block absolute -bottom-4 sm:-bottom-6 -right-4 sm:-right-6 glass rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3"
                >
                  <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-xs sm:text-sm">Nathalie IA</div>
                    <div className="text-emerald-400 text-[9px] sm:text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                      En ligne
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-12 sm:py-16 lg:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto px-4">
              Une plateforme complète pour enseigner et apprendre le développement
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative glass rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-cyan-500/30 transition-all duration-300"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${feature.color}-400`} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-12 sm:py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-violet-600" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            
            <div className="relative px-4 sm:px-6 md:px-8 py-12 sm:py-14 md:py-16 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                Prêt à commencer votre voyage ?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/80 mb-6 sm:mb-8 max-w-xl mx-auto px-2 sm:px-0">
                Rejoignez des centaines d'étudiants qui apprennent à coder avec l'IA
              </p>
              <Link 
                href="/login?register=true"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-slate-100 transition-all shadow-xl w-full sm:w-auto max-w-xs sm:max-w-none mx-auto"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                S'inscrire gratuitement
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="font-semibold text-sm sm:text-base">
                <span className="text-cyan-400">Coding</span>
                <span className="text-white">Live</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500">
              <Link href="#" className="hover:text-white transition">Confidentialité</Link>
              <Link href="#" className="hover:text-white transition">Conditions</Link>
              <Link href="#" className="hover:text-white transition">Contact</Link>
            </div>

            <div className="text-xs sm:text-sm text-slate-500 text-center sm:text-left">
              © 2024 CodingLive. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
