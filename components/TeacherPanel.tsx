'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Mic, MicOff, BookOpen, Square, Sparkles, CheckCircle2, FileText, X } from 'lucide-react';
import AICoTeacher from './AICoTeacher';
import ChatInterface from './ChatInterface';
import StudentsList from './StudentsList';
import { useRouter } from 'next/navigation';
import { useLocalParticipant } from '@livekit/components-react';
import { createLocalAudioTrack, Track } from 'livekit-client';
import debounce from 'lodash.debounce';

interface TeacherPanelProps {
    roomName: string;
    lessonId?: string | null;
}

interface SessionSummary {
    summary: string;
    keyPoints: string[];
    conceptsCovered: string[];
    recommendations: string;
    homeworkSuggestions: string[];
}

export default function TeacherPanel({ roomName, lessonId }: TeacherPanelProps) {
    const router = useRouter();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [showEndModal, setShowEndModal] = useState(false);
    const [isEndingSession, setIsEndingSession] = useState(false);
    const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
    const { addAiSuggestion } = useStore();
    const chatRef = useRef<any>(null);
    const isListeningRef = useRef(false);
    
    // LiveKit hooks
    const { localParticipant } = useLocalParticipant();
    const [isMicEnabled, setIsMicEnabled] = useState(false);

    // Utiliser Whisper pour la transcription au lieu de webkitSpeechRecognition
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isListening && typeof window !== 'undefined' && navigator.mediaDevices) {
            // Démarrer l'enregistrement audio pour Whisper
            const startRecording = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const mediaRecorder = new MediaRecorder(stream, {
                        mimeType: 'audio/webm;codecs=opus'
                    });
                    
                    mediaRecorderRef.current = mediaRecorder;
                    audioChunksRef.current = [];

                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            audioChunksRef.current.push(event.data);
                        }
                    };

                    mediaRecorder.onstop = async () => {
                        // Envoyer l'audio à Whisper pour transcription
                        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                        await transcribeAudio(audioBlob);
                        audioChunksRef.current = [];
                    };

                    // Démarrer l'enregistrement
                    mediaRecorder.start();
                    
                    // Envoyer des chunks toutes les 3 secondes pour transcription continue
                    recordingIntervalRef.current = setInterval(() => {
                        if (mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                            mediaRecorder.start(); // Redémarrer pour le prochain chunk
                        }
                    }, 3000);

                } catch (error) {
                    console.error('Error accessing microphone:', error);
                    setIsListening(false);
                }
            };

            startRecording();
        } else if (!isListening && mediaRecorderRef.current) {
            // Arrêter l'enregistrement
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }
            if (mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        }

        return () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isListening]);

    const transcribeAudio = async (audioBlob: Blob) => {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/ai/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            const data = await response.json();
            const text = data.text?.trim();

            if (text) {
                console.log('Whisper Transcript:', text);
                setTranscript((prev) => prev + ' ' + text);

                // Si le texte contient "nathalie", activer Nathalie
                if (text.toLowerCase().includes('nathalie') || text.toLowerCase().includes('nath')) {
                    console.log("Activating Nathalie via Whisper...");
                    chatRef.current?.sendToAi(text, true); // true = isTeacher
                } else {
                    // Analyser le texte pour suggestions
                    analyzeTextDebounced(text);
                }
            }
        } catch (error) {
            console.error('Error transcribing audio:', error);
        }
    };

    // Toggle LiveKit microphone
    const toggleLiveKitMicrophone = async () => {
        if (!localParticipant) {
            console.warn('Local participant not available');
            return;
        }

        try {
            // Check if microphone track already exists
            const micPublications = Array.from(localParticipant.audioTrackPublications.values());
            const micPub = micPublications.find(pub => pub.source === Track.Source.Microphone);
            
            if (micPub && micPub.track) {
                // Track exists, toggle mute/unmute
                if (micPub.isMuted) {
                    await localParticipant.setMicrophoneEnabled(true);
                    setIsMicEnabled(true);
                } else {
                    await localParticipant.setMicrophoneEnabled(false);
                    setIsMicEnabled(false);
                }
            } else {
                // No track exists, create and publish one
                const audioTrack = await createLocalAudioTrack({
                    deviceId: undefined, // Use default microphone
                });
                await localParticipant.publishTrack(audioTrack, {
                    source: Track.Source.Microphone,
                });
                setIsMicEnabled(true);
            }
        } catch (error) {
            console.error('Error toggling microphone:', error);
            // Try alternative method
            try {
                await localParticipant.setMicrophoneEnabled(!isMicEnabled);
                setIsMicEnabled(!isMicEnabled);
            } catch (e) {
                console.error('Failed to toggle microphone:', e);
            }
        }
    };

    const toggleMicrophone = async () => {
        // Toggle LiveKit microphone first
        await toggleLiveKitMicrophone();
        
        // Then toggle Whisper transcription
        setIsListening(!isListening);
        isListeningRef.current = !isListening;
    };

    // Initialize microphone on mount and listen for track changes
    useEffect(() => {
        if (!localParticipant) return;

        const updateMicStatus = () => {
            const micPublications = Array.from(localParticipant.audioTrackPublications.values());
            const micPub = micPublications.find(pub => pub.source === Track.Source.Microphone);
            if (micPub) {
                setIsMicEnabled(!micPub.isMuted);
            } else {
                setIsMicEnabled(false);
            }
        };

        // Initial check
        updateMicStatus();

        // Listen for track publications
        const handleTrackPublished = () => {
            updateMicStatus();
        };

        const handleTrackUnpublished = () => {
            updateMicStatus();
        };

        localParticipant.on('trackPublished', handleTrackPublished);
        localParticipant.on('trackUnpublished', handleTrackUnpublished);

        return () => {
            localParticipant.off('trackPublished', handleTrackPublished);
            localParticipant.off('trackUnpublished', handleTrackUnpublished);
        };
    }, [localParticipant]);

    const analyzeText = async (text: string) => {
        try {
            const res = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: text }),
            });
            const data = await res.json();
            if (data && data.suggestion) {
                addAiSuggestion(data.suggestion);
            }
        } catch (err) {
            console.error('AI Analysis failed:', err);
        }
    };

    // Debounced version de analyzeText (attendre 2 secondes après le dernier appel)
    const analyzeTextDebounced = useMemo(
        () => debounce(async (text: string) => {
            await analyzeText(text);
        }, 2000),
        [addAiSuggestion]
    );

    // Cleanup du debounce au unmount
    useEffect(() => {
        return () => {
            analyzeTextDebounced.cancel();
        };
    }, [analyzeTextDebounced]);

    const endSession = async () => {
        if (!lessonId) {
            router.push('/dashboard/classrooms');
            return;
        }

        setIsEndingSession(true);
        try {
            const res = await fetch('/api/sessions/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    transcript
                })
            });
            const data = await res.json();
            if (data.summary) {
                setSessionSummary(data.summary);
            }
        } catch (err) {
            console.error('Error ending session:', err);
        } finally {
            setIsEndingSession(false);
        }
    };

    const closeAndRedirect = () => {
        router.push('/dashboard/classrooms');
    };

    return (
        <div className="relative h-full p-4 sm:p-6 bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-cyan-500/30">
            <div className="max-w-6xl mx-auto">
                {/* Header Sci-Fi */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8 border-b border-white/10 pb-4 sm:pb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                            CLASSE : {roomName.toUpperCase()}
                        </h1>
                        <p className="text-slate-400 text-xs sm:text-sm tracking-widest uppercase">Système de Co-Enseignement Actif</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                        <motion.button
                            onClick={toggleMicrophone}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold uppercase tracking-wider transition-all overflow-hidden text-sm sm:text-base ${isMicEnabled && isListening
                                ? 'bg-red-500/10 text-red-400 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                                }`}
                        >
                            {isMicEnabled && isListening ? (
                                <>
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                    <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">Micro Actif</span>
                                    <span className="sm:hidden">Micro</span>
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent w-[50%]"
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    />
                                </>
                            ) : (
                                <>
                                    <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">{isMicEnabled ? 'Micro Muet' : 'Standby'}</span>
                                    <span className="sm:hidden">{isMicEnabled ? 'Muet' : 'Standby'}</span>
                                </>
                            )}
                        </motion.button>
                        
                        <motion.button
                            onClick={() => setShowEndModal(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/50 font-bold uppercase tracking-wider hover:bg-rose-500/20 transition-all text-sm sm:text-base"
                        >
                            <Square className="w-4 h-4" />
                            Terminer
                        </motion.button>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
                    <div className="lg:col-span-8 space-y-4 sm:space-y-6">
                        {/* Transcription View */}
                        <div className="bg-slate-900/50 backdrop-blur rounded-xl sm:rounded-2xl border border-white/5 p-4 sm:p-6 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 opacity-50"></div>
                            <h2 className="text-base sm:text-lg font-bold text-cyan-400 mb-3 sm:mb-4 flex items-center gap-2 uppercase tracking-wide">
                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                                Flux Audio
                            </h2>
                            <div className="p-3 sm:p-4 bg-black/40 rounded-xl h-[150px] sm:h-[200px] overflow-y-auto text-sm sm:text-base text-slate-300 leading-relaxed font-mono border border-white/5">
                                {transcript || <span className="text-slate-600 italic">En attente de données vocales...</span>}
                                {isListening && (
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ repeat: Infinity, duration: 0.8 }}
                                        className="inline-block w-2.5 h-4 bg-cyan-500 ml-1 align-middle"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Interactive AI Chat */}
                        <div className="bg-slate-900/50 backdrop-blur rounded-xl sm:rounded-2xl border border-white/5 p-1">
                            <ChatInterface ref={chatRef} />
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                        {/* Status Card */}
                        <motion.div
                            initial={false}
                            animate={isListening ? { borderColor: 'rgba(34,211,238,0.3)', boxShadow: '0 0 10px rgba(34,211,238,0.1)' } : {}}
                            className="bg-slate-900 rounded-2xl border border-white/5 p-6 h-full"
                        >
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Status Système</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">Microphone</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-sm ${isMicEnabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                        {isMicEnabled ? 'ONLINE' : 'OFFLINE'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">IA Engine</span>
                                    <span className="text-xs font-bold px-2 py-1 rounded-sm bg-cyan-500/20 text-cyan-400">
                                        NATHALIE_V4
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">Élèves Connectés</span>
                                    <span className="text-lg font-mono text-white">3</span>
                                </div>
                            </div>

                            {/* Listening Visualizer Fake */}
                            {isListening && (
                                <div className="mt-8 h-16 flex items-end justify-center gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-2 bg-gradient-to-t from-cyan-600 to-cyan-300 rounded-t-sm"
                                            animate={{ height: ['10%', '100%', '30%'] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 0.5 + Math.random() * 0.5,
                                                ease: "easeInOut",
                                                repeatType: "mirror"
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </main>
            </div>

            {/* AI Component Overlay (Floating) */}
            <AICoTeacher />

            {/* End Session Modal */}
            <AnimatePresence>
                {showEndModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !isEndingSession && !sessionSummary && setShowEndModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            {!sessionSummary ? (
                                // Confirmation / Loading
                                <div className="p-8 text-center">
                                    {isEndingSession ? (
                                        <>
                                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                                                <Sparkles className="w-8 h-8 text-white animate-pulse" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2">Génération du récapitulatif...</h2>
                                            <p className="text-slate-400">L'IA analyse la session pour créer un résumé complet.</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/20 flex items-center justify-center">
                                                <Square className="w-8 h-8 text-rose-400" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2">Terminer la session ?</h2>
                                            <p className="text-slate-400 mb-8">
                                                L'IA va générer un récapitulatif pour vous et vos étudiants.
                                            </p>
                                            <div className="flex gap-4 justify-center">
                                                <button
                                                    onClick={() => setShowEndModal(false)}
                                                    className="px-6 py-3 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    onClick={endSession}
                                                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-medium hover:shadow-lg transition"
                                                >
                                                    Terminer et générer le récapitulatif
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                // Summary Display
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <h2 className="text-xl font-bold text-white">Session terminée</h2>
                                        </div>
                                        <button
                                            onClick={closeAndRedirect}
                                            className="p-2 text-slate-400 hover:text-white transition"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Summary */}
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                Résumé
                                            </h3>
                                            <p className="text-slate-300 leading-relaxed">{sessionSummary.summary}</p>
                                        </div>

                                        {/* Key Points */}
                                        {sessionSummary.keyPoints?.length > 0 && (
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">
                                                    Points clés
                                                </h3>
                                                <ul className="space-y-2">
                                                    {sessionSummary.keyPoints.map((point, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-slate-300">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                                            {point}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Recommendations */}
                                        {sessionSummary.recommendations && (
                                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">
                                                    Recommandations
                                                </h3>
                                                <p className="text-slate-300">{sessionSummary.recommendations}</p>
                                            </div>
                                        )}

                                        {/* Homework */}
                                        {sessionSummary.homeworkSuggestions?.length > 0 && (
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                                    Exercices suggérés
                                                </h3>
                                                <ul className="space-y-2">
                                                    {sessionSummary.homeworkSuggestions.map((hw, i) => (
                                                        <li key={i} className="text-slate-300">• {hw}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={closeAndRedirect}
                                        className="w-full mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-medium hover:shadow-lg transition"
                                    >
                                        Retour aux cours
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
