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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 grid-bg opacity-50" />
      <div className="fixed inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-violet-500/5" />
      
      {/* Floating Orbs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-[100px] float" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-violet-500/20 rounded-full blur-[120px] float" style={{ animationDelay: '-3s' }} />
      <div className="fixed top-1/2 left-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] float" style={{ animationDelay: '-1.5s' }} />

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
      <section className="relative z-10 pt-12 sm:pt-20 pb-16 sm:pb-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
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

              <p className="text-base sm:text-lg lg:text-xl text-slate-400 mb-6 sm:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Une plateforme révolutionnaire où l'IA vous accompagne en temps réel. 
                Apprenez à coder avec un assistant virtuel qui s'adapte à votre rythme.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12 justify-center lg:justify-start">
                <Link 
                  href="/login?register=true"
                  className="btn-glow group flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
                >
                  <Play className="w-5 h-5" />
                  Rejoindre un cours
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="#demo"
                  className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-white/10 transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                  Voir la démo
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 sm:gap-12 justify-center lg:justify-start">
                <div>
                  <div className="text-3xl font-bold text-white">500+</div>
                  <div className="text-slate-500 text-sm">Étudiants formés</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">50+</div>
                  <div className="text-slate-500 text-sm">Cours disponibles</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">98%</div>
                  <div className="text-slate-500 text-sm">Satisfaction</div>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Code Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-2xl blur-2xl" />
                
                {/* Code Window */}
                <div className="relative code-block overflow-hidden">
                  {/* Window Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs text-slate-500 font-mono">main.js</span>
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span className="text-xs">IA Active</span>
                    </div>
                  </div>

                  {/* Code Content */}
                  <div className="p-6 font-mono text-sm">
                    <pre className="text-slate-300 leading-relaxed">
                      {codeSnippet.split('\n').map((line, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="flex"
                        >
                          <span className="text-slate-600 w-8 select-none">{i + 1}</span>
                          <span 
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

                {/* Floating Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="absolute -bottom-6 -right-6 glass rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Nathalie IA</div>
                    <div className="text-emerald-400 text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto px-4">
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
                className="group relative glass rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-violet-600" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            
            <div className="relative px-8 py-16 text-center">
              <h2 className="text-4xl font-bold text-white mb-4">
                Prêt à commencer votre voyage ?
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-xl mx-auto">
                Rejoignez des centaines d'étudiants qui apprennent à coder avec l'IA
              </p>
              <Link 
                href="/login?register=true"
                className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-slate-100 transition-all shadow-xl"
              >
                <Zap className="w-5 h-5" />
                S'inscrire gratuitement
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <Code2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">
                <span className="text-cyan-400">Coding</span>
                <span className="text-white">Live</span>
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="#" className="hover:text-white transition">Confidentialité</Link>
              <Link href="#" className="hover:text-white transition">Conditions</Link>
              <Link href="#" className="hover:text-white transition">Contact</Link>
            </div>

            <div className="text-sm text-slate-500">
              © 2024 CodingLive. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
