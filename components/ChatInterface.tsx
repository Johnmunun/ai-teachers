import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Send, Mic, Play, Monitor } from 'lucide-react';
import CodePreview from './CodePreview';
import { useRoomContext } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';

const ChatInterface = forwardRef((props, ref) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    let room: any;
    try {
        room = useRoomContext();
    } catch { }

    const broadcastToClass = async (msg: any) => {
        if (!room || !room.localParticipant) {
            console.warn("Non connecté à LiveKit");
            return;
        }

        // Vérifier que la connexion est établie
        if (room.state !== ConnectionState.Connected) {
            console.warn("La connexion LiveKit n'est pas encore établie. État:", room.state);
            return;
        }

        try {
            const payload = JSON.stringify({
                type: 'SHOW_CODE',
                code: msg.code,
                text: msg.content // Sending only Text + Code (Audio base64 is too large for DataChannel > 64kb)
            });
            const encoder = new TextEncoder();
            await room.localParticipant.publishData(encoder.encode(payload), { reliable: true });
        } catch (error) {
            console.error("Erreur lors de la publication des données:", error);
        }
    };

    // Allow parent to trigger AI
    useImperativeHandle(ref, () => ({
        sendToAi: async (text: string, isTeacher: boolean = true) => {
            await processMessage(text, isTeacher);
        }
    }));

    const processMessage = async (text: string, isTeacher: boolean = false) => {
        const userMsg = { role: 'user', content: text };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text,
                    context: 'classroom',
                    forceAudio: isTeacher, // Force l'audio pour le prof
                    forceBroadcast: isTeacher // Force le broadcast pour le prof
                }),
            });
            const data = await res.json();

            // Ne pas ajouter de message si Nathalie est en mode silencieux
            if (data.silent && !data.text) {
                setIsLoading(false);
                return;
            }

            const aiMsg = {
                role: 'ai',
                content: data.text,
                audio: data.audio,
                code: data.code
            };

            setMessages((prev) => [...prev, aiMsg]);

            // Pour le prof : TOUJOURS jouer l'audio et broadcaster
            if (isTeacher) {
                if (data.audio) {
                    playAudio(data.audio);
                } else {
                    // Si pas d'audio, en générer un
                    try {
                        const audioRes = await fetch('/api/ai/interact', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                message: `Génère l'audio pour: ${data.text}`,
                                generateAudioOnly: true
                            }),
                        });
                        const audioData = await audioRes.json();
                        if (audioData.audio) {
                            playAudio(audioData.audio);
                            aiMsg.audio = audioData.audio;
                        }
                    } catch (e) {
                        console.error('Error generating audio:', e);
                    }
                }
                // Toujours broadcaster pour le prof
                broadcastToClass(aiMsg);
            } else {
                // Pour les étudiants : comportement normal
                if (data.audio) {
                    playAudio(data.audio);
                }
                if (data.broadcast) {
                    broadcastToClass(aiMsg);
                }
            }

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        const text = input;
        setInput('');
        // Par défaut, on considère que c'est le prof qui envoie (dans TeacherPanel)
        await processMessage(text, true);
    };

    const playAudio = (base64: string) => {
        if (audioRef.current) {
            // Arrêter toute lecture en cours pour éviter les conflits
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            
            // Attendre un peu avant de charger le nouvel audio
            setTimeout(() => {
                if (audioRef.current) {
                    console.log("Tentative de lecture audio...");
                    audioRef.current.src = `data:audio/mp3;base64,${base64}`;
                    audioRef.current.load(); // Recharger l'élément audio
                    
                    // Jouer avec gestion d'erreur
                    audioRef.current.play().catch(e => {
                        console.error("Erreur lecture audio:", e);
                        // Si l'erreur est due à une interruption, réessayer après un court délai
                        if (e.name === 'AbortError' || e.name === 'NotAllowedError') {
                            setTimeout(() => {
                                if (audioRef.current) {
                                    audioRef.current.play().catch(err => {
                                        console.error("Erreur lecture audio (2e tentative):", err);
                                    });
                                }
                            }, 100);
                        }
                    });
                }
            }, 50);
        }
    };

    return (
        <div className="flex flex-col h-[500px]">
            {/* Same UI ... */}
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-600" />
                Nathalie (AI Co-Teacher)
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        </div>

                        {msg.audio && (
                            <button
                                onClick={() => playAudio(msg.audio)}
                                className="mt-1 text-xs flex items-center gap-1 text-indigo-500 hover:text-indigo-700 font-medium"
                            >
                                <Play className="w-3 h-3" /> Rejouer vocalement
                            </button>
                        )}

                        {msg.code && (
                            <div className="w-full mt-2 h-64 border rounded-lg overflow-hidden relative group">
                                <CodePreview html={msg.code.html} css={msg.code.css} js={msg.code.js} />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={() => broadcastToClass(msg)}
                                        className="bg-black/70 hover:bg-black text-white text-xs px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-sm"
                                    >
                                        <Monitor className="w-3 h-3" /> Diffuser à la classe
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="text-xs text-slate-400 animate-pulse">Nathalie réfléchit...</div>
                )}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Parlez à Nathalie..."
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    onClick={sendMessage}
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg disabled:opacity-50 transition"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>

            <audio ref={audioRef} className="hidden" />
        </div>
    );
});

ChatInterface.displayName = 'ChatInterface';
export default ChatInterface;
