'use client';
import { useStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, TrendingUp, Award } from 'lucide-react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/auth';

import CodePreview from './CodePreview';
import StudentAIAssistant from './StudentAIAssistant';

interface StudentPanelProps {
    roomName: string;
    lessonId?: string | null;
}

export default function StudentPanel({ roomName, lessonId }: StudentPanelProps) {
    const { activeQuiz, setActiveQuiz } = useStore();
    const room = useRoomContext();
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [liveContent, setLiveContent] = useState<any>(null);
    const [quizExplanation, setQuizExplanation] = useState<string>('');
    const [quizStats, setQuizStats] = useState({ total: 0, correct: 0 });
    const [studentId, setStudentId] = useState<string | null>(null);
    const { user } = useStore();

    // Récupérer l'ID de l'étudiant depuis le store ou l'API
    useEffect(() => {
        if (user?.id) {
            setStudentId(user.id);
        } else {
            const getStudentId = async () => {
                try {
                    const res = await fetch('/api/auth/me');
                    if (res.ok) {
                        const data = await res.json();
                        if (data?.id) {
                            setStudentId(data.id);
                        }
                    }
                } catch (error) {
                    console.error('Erreur récupération session:', error);
                }
            };
            getStudentId();
        }
    }, [user]);

    // Listen for Realtime Quiz Data
    useEffect(() => {
        if (!room) return;
        const onDataReceived = (payload: Uint8Array, participant: any) => {
            const decoder = new TextDecoder();
            const strData = decoder.decode(payload);
            try {
                const data = JSON.parse(strData);
                if (data.type === 'QUIZ_START') {
                    setActiveQuiz(data.quiz);
                    setIsSubmitted(false);
                    setSelectedAnswer(null);
                    setIsCorrect(null);
                    setLiveContent(null); // Clear content on quiz start
                } else if (data.type === 'SHOW_CODE') {
                    setLiveContent(data);
                    setActiveQuiz(null); // Clear quiz if code is shown
                }
            } catch (e) {
                console.error('Failed to parse data message', e);
            }
        };

        room.on(RoomEvent.DataReceived, onDataReceived);
        return () => {
            room.off(RoomEvent.DataReceived, onDataReceived);
        };
    }, [room, setActiveQuiz]);

    const handleSubmit = async () => {
        if (!selectedAnswer || !activeQuiz || !studentId || !lessonId) return;

        setIsSubmitted(true);
        const correct = selectedAnswer === activeQuiz.correctAnswer;
        setIsCorrect(correct);

        // Sauvegarder la réponse dans la base de données
        try {
            if (activeQuiz.id && activeQuiz.id.startsWith('temp-')) {
                // Quiz temporaire, ne pas sauvegarder
                console.log('Quiz temporaire, réponse non sauvegardée');
            } else if (activeQuiz.id) {
                const res = await fetch('/api/quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'response',
                        quizId: activeQuiz.id,
                        studentId,
                        answer: selectedAnswer,
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    setQuizStats(prev => ({
                        total: prev.total + 1,
                        correct: prev.correct + (correct ? 1 : 0),
                    }));
                }
            }
        } catch (error) {
            console.error('Erreur sauvegarde réponse:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4 relative">
            <StudentAIAssistant lessonId={lessonId} />
            
            <div className="max-w-4xl w-full space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Salle de classe : {roomName}</h1>
                    {quizStats.total > 0 && (
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                                <span className="text-sm font-semibold text-slate-700">
                                    {quizStats.correct}/{quizStats.total} correctes
                                </span>
                            </div>
                            {quizStats.total > 0 && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                                    <Award className="w-5 h-5 text-yellow-500" />
                                    <span className="text-sm font-semibold text-slate-700">
                                        {Math.round((quizStats.correct / quizStats.total) * 100)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Live Code/Content Display */}
                {liveContent ? (
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-indigo-100 w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase">Partagé par le professeur</span>
                            <button onClick={() => setLiveContent(null)} className="text-slate-400 hover:text-slate-600">Fermer</button>
                        </div>
                        {liveContent.text && <p className="text-sm text-slate-700 mb-4">{liveContent.text}</p>}
                        {liveContent.code && (
                            <div className="h-[400px] border rounded-lg overflow-hidden">
                                <CodePreview html={liveContent.code.html} css={liveContent.code.css} js={liveContent.code.js} />
                            </div>
                        )}
                    </div>
                ) : null}

                {activeQuiz ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-100 w-full max-w-2xl mx-auto"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="inline-block px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-xs font-bold">
                                QUIZ EN DIRECT
                            </span>
                            {activeQuiz.type && (
                                <span className="text-xs text-slate-500">
                                    {activeQuiz.type === 'multiple_choice' ? 'Choix multiples' : 
                                     activeQuiz.type === 'true_false' ? 'Vrai/Faux' : 'Question ouverte'}
                                </span>
                            )}
                        </div>
                        
                        <h2 className="text-xl font-semibold text-slate-800 mb-6">
                            {activeQuiz.question}
                        </h2>

                        {activeQuiz.options && Array.isArray(activeQuiz.options) && activeQuiz.options.length > 0 && (
                            <div className="space-y-3 mb-6">
                                {activeQuiz.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrectOption = option === activeQuiz.correctAnswer;
                                    const showCorrect = isSubmitted && isCorrectOption;
                                    const showIncorrect = isSubmitted && isSelected && !isCorrectOption;

                                    return (
                                        <motion.button
                                            key={idx}
                                            disabled={isSubmitted}
                                            onClick={() => setSelectedAnswer(option)}
                                            whileHover={!isSubmitted ? { scale: 1.02 } : {}}
                                            whileTap={!isSubmitted ? { scale: 0.98 } : {}}
                                            className={`w-full p-4 text-left rounded-xl border transition-all ${
                                                isSelected && !isSubmitted
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                                                    : showCorrect
                                                    ? 'bg-green-50 border-green-500 text-green-800'
                                                    : showIncorrect
                                                    ? 'bg-red-50 border-red-500 text-red-800'
                                                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-600">
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <span className="flex-1">{option}</span>
                                                {showCorrect && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                                                {showIncorrect && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}

                        {!isSubmitted ? (
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedAnswer}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
                            >
                                Valider ma réponse
                            </button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl mb-4 ${
                                    isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    {isCorrect ? (
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-600" />
                                    )}
                                    <span className="font-bold text-lg">
                                        {isCorrect ? 'Excellent !' : 'Pas tout à fait'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 ml-9">
                                    {isCorrect
                                        ? 'Vous avez bien compris ! Continuez comme ça.'
                                        : `La bonne réponse était : "${activeQuiz.correctAnswer}". Ne vous découragez pas, continuez d'écouter le cours !`}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    !liveContent && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center text-slate-400">
                            Aucun quiz actif pour le moment.
                            <br />
                            Écoutez le professeur.
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
