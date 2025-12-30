import { create } from 'zustand';

interface User {
    id: string;
    name: string;
    role: 'TEACHER' | 'STUDENT';
}

interface AIConcept {
    concept: string;
    // suggestion: string; // REMOVED (Legacy)
    type: 'explanation' | 'example' | 'quiz';
    content: string; // Unified field name
    code?: {
        html: string;
        css?: string;
        js?: string;
    };
    quizData?: {
        id?: string;
        question: string;
        options: string[];
        correctAnswer: string;
        type?: 'multiple_choice' | 'true_false' | 'open';
    };
}

interface AppState {
    user: User | null;
    setUser: (user: User) => void;

    aiSuggestions: AIConcept[];
    addAiSuggestion: (suggestion: AIConcept) => void;
    removeAiSuggestion: (index: number) => void;
    clearAiSuggestions: () => void;

    activeQuiz: AIConcept['quizData'] | null;
    setActiveQuiz: (quiz: AIConcept['quizData'] | null) => void;
}

export const useStore = create<AppState>((set) => ({
    user: null, // In real app, persist this or hydrate from auth session
    setUser: (user) => set({ user }),

    aiSuggestions: [],
    addAiSuggestion: (suggestion) => set((state) => ({ aiSuggestions: [...state.aiSuggestions, suggestion] })),
    removeAiSuggestion: (index: number) => set((state) => ({ aiSuggestions: state.aiSuggestions.filter((_, i) => i !== index) })),
    clearAiSuggestions: () => set({ aiSuggestions: [] }),

    activeQuiz: null,
    setActiveQuiz: (quiz) => set({ activeQuiz: quiz }),
}));
