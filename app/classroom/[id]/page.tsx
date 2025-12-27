'use client';

import { useEffect, useState, useRef } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import TeacherPanel from '@/components/TeacherPanel';
import StudentPanel from '@/components/StudentPanel';
import { useStore } from '@/lib/store';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Code2, Loader2, XCircle } from 'lucide-react';

export default function ClassroomPage() {
    const { id: roomId } = useParams();
    const searchParams = useSearchParams();

    // Auth & session extraction
    const role = (searchParams.get('role') as 'teacher' | 'student') || 'student';
    const username = searchParams.get('name') || `User-${Math.floor(Math.random() * 1000)}`;
    const lessonId = searchParams.get('lessonId') || null;
    
    const [isBlocked, setIsBlocked] = useState(false);
    const [checkingBlock, setCheckingBlock] = useState(true);

    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // Use stable reference for setUser to avoid infinite loops
    const setUser = useStore((state) => state.setUser);
    const hasInitialized = useRef(false);

    useEffect(() => {
        // Only set user once to avoid infinite loops
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            setUser({ id: username, name: username, role: role === 'teacher' ? 'TEACHER' : 'STUDENT' });
        }

        // Vérifier si l'étudiant est bloqué (seulement pour les étudiants)
        const checkBlockStatus = async () => {
            if (role === 'student') {
                try {
                        // Vérifier le statut de blocage de l'utilisateur
                        const userRes = await fetch('/api/auth/me');
                        if (userRes.ok) {
                            const userData = await userRes.json();
                            if (userData.user?.isBlocked) {
                                setIsBlocked(true);
                            }
                        }
                } catch (error) {
                    console.error('Error checking block status:', error);
                } finally {
                    setCheckingBlock(false);
                }
            } else {
                setCheckingBlock(false);
            }
        };

        checkBlockStatus();

        // Fetch Token
        (async () => {
            try {
                const resp = await fetch(`/api/livekit/token?room=${roomId}&username=${username}&role=${role}`);
                const data = await resp.json();
                setToken(data.token);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [roomId, username, role, setUser]);

    // Afficher un message si l'étudiant est bloqué
    if (role === 'student' && isBlocked && !checkingBlock) {
        return (
            <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center gap-6 p-4">
                <div className="glass rounded-2xl p-8 max-w-md text-center border border-red-500/30">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Accès refusé</h2>
                    <p className="text-slate-400 mb-4">
                        Vous avez été bloqué dans ce cours. Veuillez contacter votre enseignant pour plus d'informations.
                    </p>
                    <a
                        href="/dashboard/courses"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-violet-600 transition"
                    >
                        Retour aux cours
                    </a>
                </div>
            </div>
        );
    }

    if (isLoading || !token || checkingBlock) {
        return (
            <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center gap-6">
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
