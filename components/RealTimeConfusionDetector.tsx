'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfusionEvent {
    id: string;
    studentId: string;
    studentName: string;
    score: number;
    reason?: string;
    detectedAt: Date;
}

interface RealTimeConfusionDetectorProps {
    lessonId: string;
    onConfusionDetected?: (event: ConfusionEvent) => void;
}

export default function RealTimeConfusionDetector({
    lessonId,
    onConfusionDetected,
}: RealTimeConfusionDetectorProps) {
    const [confusionEvents, setConfusionEvents] = useState<ConfusionEvent[]>([]);
    const [isOpen, setIsOpen] = useState(true);

    // Polling pour les nouveaux événements de confusion
    useEffect(() => {
        if (!lessonId) return;

        const fetchConfusionEvents = async () => {
            try {
                const res = await fetch(`/api/confusion/detect?lessonId=${lessonId}&limit=10`);
                const data = await res.json();
                
                if (data.events) {
                    const events: ConfusionEvent[] = data.events.map((e: any) => ({
                        id: e.id,
                        studentId: e.studentId,
                        studentName: e.student?.name || 'Étudiant',
                        score: e.score,
                        reason: e.reason,
                        detectedAt: new Date(e.detectedAt),
                    }));

                    // Trouver les nouveaux événements
                    const newEvents = events.filter(
                        (e) => !confusionEvents.find((ce) => ce.id === e.id)
                    );

                    // Ajouter les nouveaux événements
                    if (newEvents.length > 0) {
                        setConfusionEvents((prev) => [...newEvents, ...prev].slice(0, 10));
                        
                        // Notifier le callback
                        newEvents.forEach((event) => {
                            if (onConfusionDetected) {
                                onConfusionDetected(event);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching confusion events:', error);
            }
        };

        // Poll toutes les 5 secondes
        const interval = setInterval(fetchConfusionEvents, 5000);
        fetchConfusionEvents(); // Appel initial

        return () => clearInterval(interval);
    }, [lessonId, confusionEvents, onConfusionDetected]);

    // Filtrer seulement les événements avec score élevé (>0.6)
    const highConfusionEvents = confusionEvents.filter((e) => e.score > 0.6);

    if (highConfusionEvents.length === 0 && !isOpen) {
        return null;
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-20 left-4 z-50 w-80 max-w-[calc(100vw-2rem)]"
                >
                    <div className="bg-gradient-to-r from-red-900/90 to-orange-900/90 border border-red-500/50 rounded-lg shadow-xl backdrop-blur-md">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-red-500/30">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                <h3 className="text-red-300 font-bold text-sm">
                                    Confusion Détectée
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-red-400 hover:text-red-300 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Events List */}
                        <div className="max-h-96 overflow-y-auto p-2">
                            {highConfusionEvents.length === 0 ? (
                                <p className="text-sm text-red-300/70 p-4 text-center">
                                    Aucune confusion détectée récemment
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {highConfusionEvents.map((event) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-red-950/50 p-3 rounded-lg border border-red-500/30"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-red-200">
                                                        {event.studentName}
                                                    </p>
                                                    <p className="text-xs text-red-300/70">
                                                        {event.detectedAt.toLocaleTimeString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs font-bold text-red-400">
                                                        {Math.round(event.score * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                            {event.reason && (
                                                <p className="text-xs text-red-300/80 mt-2">
                                                    {event.reason}
                                                </p>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        {highConfusionEvents.length > 0 && (
                            <div className="p-3 border-t border-red-500/30 bg-red-950/30">
                                <p className="text-xs text-red-300">
                                    {highConfusionEvents.length} étudiant
                                    {highConfusionEvents.length > 1 ? 's' : ''} en difficulté
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

