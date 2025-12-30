'use client';

import { useEffect, useState, useRef } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import TeacherPanel from '@/components/TeacherPanel';
import StudentPanel from '@/components/StudentPanel';
import { useStore } from '@/lib/store';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Code2, Loader2, AlertCircle } from 'lucide-react';

export default function ClassroomPage() {
    const { id: roomId } = useParams();
    const searchParams = useSearchParams();

    // Auth & session extraction
    const role = (searchParams.get('role') as 'teacher' | 'student') || 'student';
    const username = searchParams.get('name') || `User-${Math.floor(Math.random() * 1000)}`;
    const lessonId = searchParams.get('lessonId') || null;

    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Use stable reference for setUser to avoid infinite loops
    const setUser = useStore((state) => state.setUser);
    const hasInitialized = useRef(false);

    useEffect(() => {
        // Only set user once to avoid infinite loops
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            setUser({ id: username, name: username, role: role === 'teacher' ? 'TEACHER' : 'STUDENT' });
        }

        // Fetch Token
        (async () => {
            try {
                const resp = await fetch(`/api/livekit/token?room=${roomId}&username=${username}&role=${role}`);
                
                if (!resp.ok) {
                    const errorData = await resp.json();
                    throw new Error(errorData.error || 'Erreur lors de la connexion à la classe');
                }
                
                const data = await resp.json();
                
                if (!data.token) {
                    throw new Error('Token non reçu du serveur');
                }
                
                setToken(data.token);
                setError(null);
            } catch (e: any) {
                console.error('Error fetching token:', e);
                setError(e.message || 'Erreur lors de la connexion. Veuillez réessayer.');
            } finally {
                setIsLoading(false);
            }
        })();
    }, [roomId, username, role, setUser]);

    if (isLoading || !token) {
        return (
            <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center gap-6">
                {error ? (
                    <>
                        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/50">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="text-center max-w-md">
                            <h2 className="text-xl font-semibold text-white mb-2">Erreur de connexion</h2>
                            <p className="text-red-300 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition"
                            >
                                Réessayer
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                                <Code2 className="w-8 h-8 text-white" />
                            </div>
                        </motion.div>
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-white mb-2">Connexion à la classe...</h2>
                            <p className="text-slate-400">Préparation de l'environnement</p>
                        </div>
                        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                    </>
                )}
            </div>
        );
    }

    return (
        <LiveKitRoom
            video={false}
            audio={true}
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            data-lk-theme="default"
            style={{ height: '100vh' }}
            connectOptions={{
                autoSubscribe: true,
            }}
            options={{
                publishDefaults: {
                    videoSimulcastLayers: [],
                    audioPreset: {
                        maxBitrate: 16000,
                    },
                },
            }}
        >
            {role === 'teacher' ? (
                <TeacherPanel 
                    roomName={roomId as string} 
                    lessonId={lessonId}
                />
            ) : (
                <StudentPanel 
                    roomName={roomId as string}
                    lessonId={lessonId}
                />
            )}
        </LiveKitRoom>
    );
}
