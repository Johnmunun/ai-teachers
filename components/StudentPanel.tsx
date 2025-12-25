'use client';
import { useStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

import CodePreview from './CodePreview';

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
        if (!selectedAnswer) return;

        // In real app, we would have a quiz ID. Here using mock or implied by sync.
        // For MVP, simply showing UI state.

        // Simulate API call
        // await fetch('/api/quiz', { ... })

        setIsSubmitted(true);
        // Determine correctness locally for MVP if we have the data
        if (activeQuiz && selectedAnswer === activeQuiz.correctAnswer) {
            setIsCorrect(true);
        } else {
            setIsCorrect(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-slate-900">Salle de classe : {roomName}</h1>
                    <p className="text-slate-500">En attente de contenu...</p>
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
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-indigo-100 animate-in zoom-in duration-300 w-full max-w-md">
                        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-4">
                            QUIZ EN DIRECT
                        </span>
                        <h2 className="text-xl font-semibold text-slate-800 mb-6">
                            {activeQuiz.question}
                        </h2>

                        <div className="space-y-3 mb-6">
                            {activeQuiz.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    disabled={isSubmitted}
                                    onClick={() => setSelectedAnswer(option)}
                                    className={`w-full p-4 text-left rounded-xl border transition-all ${selectedAnswer === option
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                        } ${isSubmitted && option === activeQuiz.correctAnswer ? 'bg-green-50 border-green-500' : ''}`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {!isSubmitted ? (
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedAnswer}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition"
                            >
                                Valider ma réponse
                            </button>
                        ) : (
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {isCorrect ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                <span className="font-bold">
                                    {isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse.'}
                                </span>
                            </div>
                        )}
                    </div>
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
