'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Plus, Clock, Zap, Sparkles, X } from 'lucide-react';
import { useRoomContext } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';

interface QuizManagerProps {
    lessonId: string | null;
    transcript: string;
}

interface Quiz {
    id?: string;
    question: string;
    options: string[];
    correctAnswer: string;
    type: 'multiple_choice' | 'true_false' | 'open';
    difficulty?: 'easy' | 'medium' | 'hard';
    scheduledAt?: Date | null;
}

export default function QuizManager({ lessonId, transcript }: QuizManagerProps) {
    const [showModal, setShowModal] = useState(false);
    const [quizMode, setQuizMode] = useState<'ai' | 'manual' | null>(null);
    const [quiz, setQuiz] = useState<Quiz>({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        type: 'multiple_choice',
        difficulty: 'medium',
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [scheduleType, setScheduleType] = useState<'instant' | 'scheduled'>('instant');
    const [scheduledTime, setScheduledTime] = useState('');

    const room = useRoomContext();

    const generateAIQuiz = async () => {
        if (!lessonId || !transcript || transcript.trim().length < 10) {
            alert('Le transcript doit contenir au moins 10 caractères pour générer un quiz');
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch('/api/ai/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    transcript,
                    difficulty: quiz.difficulty,
                    questionType: quiz.type,
                }),
            });

            const data = await res.json();
            if (data.quiz) {
                setQuiz({
                    question: data.quiz.question,
                    options: data.quiz.options || [],
                    correctAnswer: data.quiz.correctAnswer,
                    type: data.quiz.type || quiz.type,
                    difficulty: data.quiz.difficulty || quiz.difficulty,
                });
            } else {
                alert('Erreur lors de la génération du quiz');
            }
        } catch (error) {
            console.error('Erreur génération quiz:', error);
            alert('Erreur lors de la génération du quiz');
        } finally {
            setIsGenerating(false);
        }
    };

    const sendQuizToStudents = async (quizData: Quiz) => {
        if (!room || !room.localParticipant) {
            console.warn("Non connecté à LiveKit");
            return;
        }

        if (room.state !== ConnectionState.Connected) {
            console.warn("La connexion LiveKit n'est pas encore établie");
            return;
        }

        try {
            const payload = JSON.stringify({
                type: 'QUIZ_START',
                quiz: {
                    id: quizData.id || 'temp-' + Date.now(),
                    question: quizData.question,
                    options: quizData.options.filter(opt => opt.trim()),
                    correctAnswer: quizData.correctAnswer,
                    type: quizData.type,
                },
            });
            const encoder = new TextEncoder();
            await room.localParticipant.publishData(encoder.encode(payload), { reliable: true });
        } catch (error) {
            console.error("Erreur lors de l'envoi du quiz:", error);
            throw error;
        }
    };

    const saveAndSendQuiz = async () => {
        if (!quiz.question.trim()) {
            alert('La question est requise');
            return;
        }

        if (quiz.type === 'multiple_choice' && quiz.options.filter(opt => opt.trim()).length < 2) {
            alert('Au moins 2 options sont requises');
            return;
        }

        if (!quiz.correctAnswer.trim()) {
            alert('La réponse correcte est requise');
            return;
        }

        if (quiz.type === 'multiple_choice' && !quiz.options.includes(quiz.correctAnswer)) {
            alert('La réponse correcte doit être parmi les options');
            return;
        }

        setIsSaving(true);
        try {
            // Sauvegarder le quiz
            if (lessonId) {
                const res = await fetch('/api/quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'create',
                        lessonId,
                        question: quiz.question,
                        options: quiz.options.filter(opt => opt.trim()),
                        correctAnswer: quiz.correctAnswer,
                    }),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || 'Erreur lors de la sauvegarde');
                }

                const data = await res.json();
                const savedQuiz = { ...quiz, id: data.quiz.id };
                
                // Envoyer aux étudiants
                await sendQuizToStudents(savedQuiz);
                
                // Réinitialiser
                setQuiz({
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: '',
                    type: 'multiple_choice',
                    difficulty: 'medium',
                });
                setShowModal(false);
                setQuizMode(null);
            }
        } catch (error: any) {
            console.error('Erreur sauvegarde quiz:', error);
            alert(error.message || 'Erreur lors de la sauvegarde du quiz');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTypeChange = (type: 'multiple_choice' | 'true_false' | 'open') => {
        setQuiz({
            ...quiz,
            type,
            options: type === 'true_false' ? ['Vrai', 'Faux'] : type === 'open' ? [] : ['', '', '', ''],
            correctAnswer: type === 'true_false' ? 'Vrai' : '',
        });
    };

    return (
        <>
            <motion.button
                onClick={() => setShowModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg transition shadow-md hover:shadow-purple-500/20"
            >
                <HelpCircle className="w-5 h-5" />
                <span className="hidden sm:inline">Créer un Quiz</span>
                <span className="sm:hidden">Quiz</span>
            </motion.button>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !isGenerating && !isSaving && setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <HelpCircle className="w-6 h-6 text-purple-400" />
                                        Créer un Quiz
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-slate-400 hover:text-white transition"
                                        disabled={isGenerating || isSaving}
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {!quizMode ? (
                                    <div className="space-y-4">
                                        <p className="text-slate-300 mb-6">Choisissez le type de quiz :</p>
                                        
                                        <motion.button
                                            onClick={() => setQuizMode('ai')}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full p-6 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/50 rounded-xl hover:border-purple-400 transition text-left"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <Sparkles className="w-6 h-6 text-purple-400" />
                                                <h3 className="text-lg font-bold text-white">Quiz IA Automatique</h3>
                                            </div>
                                            <p className="text-slate-400 text-sm">
                                                Génère automatiquement un quiz à partir du contenu du cours
                                            </p>
                                        </motion.button>

                                        <motion.button
                                            onClick={() => setQuizMode('manual')}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full p-6 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/50 rounded-xl hover:border-cyan-400 transition text-left"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <Plus className="w-6 h-6 text-cyan-400" />
                                                <h3 className="text-lg font-bold text-white">Quiz Manuel</h3>
                                            </div>
                                            <p className="text-slate-400 text-sm">
                                                Créez votre propre quiz personnalisé
                                            </p>
                                        </motion.button>
                                    </div>
                                ) : quizMode === 'ai' ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                Type de question
                                            </label>
                                            <select
                                                value={quiz.type}
                                                onChange={(e) => handleTypeChange(e.target.value as any)}
                                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                            >
                                                <option value="multiple_choice">Choix multiples</option>
                                                <option value="true_false">Vrai/Faux</option>
                                                <option value="open">Question ouverte</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                Difficulté
                                            </label>
                                            <select
                                                value={quiz.difficulty}
                                                onChange={(e) => setQuiz({ ...quiz, difficulty: e.target.value as any })}
                                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                            >
                                                <option value="easy">Facile</option>
                                                <option value="medium">Moyen</option>
                                                <option value="hard">Difficile</option>
                                            </select>
                                        </div>

                                        <motion.button
                                            onClick={generateAIQuiz}
                                            disabled={isGenerating || !transcript || transcript.trim().length < 10}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Génération en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5" />
                                                    Générer avec l'IA
                                                </>
                                            )}
                                        </motion.button>

                                        {quiz.question && (
                                            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                                <h3 className="text-white font-semibold mb-2">Question générée :</h3>
                                                <p className="text-slate-300 mb-4">{quiz.question}</p>
                                                {quiz.options.length > 0 && (
                                                    <div className="space-y-2">
                                                        {quiz.options.map((opt, idx) => (
                                                            <div key={idx} className="text-slate-400 text-sm">
                                                                {String.fromCharCode(65 + idx)}. {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-green-400 text-sm mt-2">
                                                    ✓ Réponse correcte : {quiz.correctAnswer}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setQuizMode(null);
                                                    setQuiz({
                                                        question: '',
                                                        options: ['', '', '', ''],
                                                        correctAnswer: '',
                                                        type: 'multiple_choice',
                                                        difficulty: 'medium',
                                                    });
                                                }}
                                                className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                                                disabled={isGenerating || isSaving}
                                            >
                                                Retour
                                            </button>
                                            <button
                                                onClick={saveAndSendQuiz}
                                                disabled={!quiz.question || isSaving}
                                                className="flex-1 py-2 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSaving ? 'Envoi...' : 'Envoyer aux étudiants'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                Type de question
                                            </label>
                                            <select
                                                value={quiz.type}
                                                onChange={(e) => handleTypeChange(e.target.value as any)}
                                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                            >
                                                <option value="multiple_choice">Choix multiples</option>
                                                <option value="true_false">Vrai/Faux</option>
                                                <option value="open">Question ouverte</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                Question *
                                            </label>
                                            <textarea
                                                value={quiz.question}
                                                onChange={(e) => setQuiz({ ...quiz, question: e.target.value })}
                                                placeholder="Entrez votre question..."
                                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                                                rows={3}
                                            />
                                        </div>

                                        {quiz.type === 'multiple_choice' && (
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                    Options *
                                                </label>
                                                {quiz.options.map((opt, idx) => (
                                                    <input
                                                        key={idx}
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOptions = [...quiz.options];
                                                            newOptions[idx] = e.target.value;
                                                            setQuiz({ ...quiz, options: newOptions });
                                                        }}
                                                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 mb-2"
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                Réponse correcte *
                                            </label>
                                            {quiz.type === 'multiple_choice' ? (
                                                <select
                                                    value={quiz.correctAnswer}
                                                    onChange={(e) => setQuiz({ ...quiz, correctAnswer: e.target.value })}
                                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                                >
                                                    <option value="">Sélectionnez...</option>
                                                    {quiz.options.filter(opt => opt.trim()).map((opt, idx) => (
                                                        <option key={idx} value={opt}>
                                                            {opt}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={quiz.correctAnswer}
                                                    onChange={(e) => setQuiz({ ...quiz, correctAnswer: e.target.value })}
                                                    placeholder={quiz.type === 'true_false' ? 'Vrai ou Faux' : 'Réponse attendue'}
                                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                                                />
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setQuizMode(null);
                                                    setQuiz({
                                                        question: '',
                                                        options: ['', '', '', ''],
                                                        correctAnswer: '',
                                                        type: 'multiple_choice',
                                                        difficulty: 'medium',
                                                    });
                                                }}
                                                className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                                                disabled={isSaving}
                                            >
                                                Retour
                                            </button>
                                            <button
                                                onClick={saveAndSendQuiz}
                                                disabled={!quiz.question || isSaving}
                                                className="flex-1 py-2 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSaving ? 'Envoi...' : 'Envoyer aux étudiants'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

