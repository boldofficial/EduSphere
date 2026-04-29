'use client';

import React, { useState } from 'react';
import { BookMarked, Plus, Search, FileText, ListChecks, Edit, Download, Trash2, Tags, Brain, XCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, fetchAll } from '@/lib/hooks/use-data';
import { useSchoolStore } from '@/lib/store';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/providers/toast-provider';

const NIGERIAN_SUBJECTS = [
    'English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Literature', 'Government', 'Economics', 'Commerce', 'Account',
    'Geography', 'History', 'Civic Education', 'Christian Religious Studies',
    'Islamic Religious Studies', 'Agricultural Science', 'Food & Nutrition',
    'Technical Drawing', 'Visual Art', 'Music'
];

const EXAM_TYPES = [
    { value: 'utme', label: 'UTME (JAMB)' },
    { value: 'wassce', label: 'WASSCE' },
    { value: 'neco', label: 'NECO' },
    { value: 'post_utme', label: 'Post-UTME' },
    { value: 'internal', label: 'Internal Exam' },
];

const QUESTION_TYPES = [
    { value: 'mcq', label: 'Multiple Choice', icon: '☰' },
    { value: 'true_false', label: 'True/False', icon: '✓✗' },
    { value: 'fill_blank', label: 'Fill in the Blank', icon: '_' },
];

const DIFFICULTY_LEVELS = [
    { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-800' },
];

export default function QuestionBankPage() {
    const { currentRole } = useSchoolStore();
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'banks' | 'questions'>('banks');
    const [showModal, setShowModal] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedBank, setSelectedBank] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        description: '',
        class_level: '',
        term: '',
    });
    const [questionForm, setQuestionForm] = useState({
        question_text: '',
        question_type: 'mcq',
        difficulty: 'medium',
        options: { a: '', b: '', c: '', d: '' },
        correct_answer: 'a',
        explanation: '',
        topic: '',
    });
    const [importForm, setImportForm] = useState({
        subject: 'Mathematics',
        exam_type: 'wassce',
        year: '2023',
        count: 10,
    });
    const [importedQuestions, setImportedQuestions] = useState<any[]>([]);

    const { data: banks = [], isLoading: banksLoading } = useQuery({
        queryKey: queryKeys.questionBanks,
        queryFn: () => fetchAll<any>('learning/question-banks/'),
    });

    const { data: subjects = [] } = useQuery({
        queryKey: queryKeys.subjects,
        queryFn: () => fetchAll<any>('academic/subjects/'),
    });

    const { data: questions = [], isLoading: questionsLoading } = useQuery({
        queryKey: ['bankQuestions', selectedBank?.id],
        queryFn: () => selectedBank ? fetchAll<any>(`learning/question-banks/${selectedBank.id}/questions/`) : Promise.resolve([]),
        enabled: !!selectedBank,
    });

    const createBank = useMutation({
        mutationFn: async (data: typeof formData) => {
            const matchedSubject = subjects.find(
                (s: any) => s?.name?.toLowerCase() === data.subject.trim().toLowerCase()
            );

            const payload: Record<string, unknown> = {
                name: data.name,
                description: data.description || '',
            };

            if (matchedSubject?.id) {
                payload.subject = matchedSubject.id;
            } else {
                payload.subject_input = data.subject;
            }

            const response = await apiClient.post('learning/question-banks/', payload);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.questionBanks });
            setShowModal(false);
            setFormData({ name: '', subject: '', description: '', class_level: '', term: '' });
            addToast('Question bank created successfully', 'success');
            setSelectedBank(data);
            setShowQuestionModal(true);
        },
        onError: () => {
            addToast('Failed to create question bank', 'error');
        },
    });

    const addQuestion = useMutation({
        mutationFn: async (data: typeof questionForm) => {
            const response = await apiClient.post(`learning/question-banks/${selectedBank.id}/questions/`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.questionBanks });
            queryClient.invalidateQueries({ queryKey: ['bankQuestions', selectedBank?.id] });
            setQuestionForm({
                question_text: '',
                question_type: 'mcq',
                difficulty: 'medium',
                options: { a: '', b: '', c: '', d: '' },
                correct_answer: 'a',
                explanation: '',
                topic: '',
            });
            addToast('Question added successfully', 'success');
        },
        onError: () => {
            addToast('Failed to add question', 'error');
        },
    });

    const importFromAPI = useMutation({
        mutationFn: async () => {
            const response = await fetch(
                `/api/aloc/questions?subject=${encodeURIComponent(importForm.subject)}&exam_type=${encodeURIComponent(importForm.exam_type)}&year=${encodeURIComponent(importForm.year)}&count=${importForm.count}`,
                { cache: 'no-store' }
            );
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData?.error || `API Error: ${response.status}`);
            }
            
            const data = await response.json();
            const questions = Array.isArray(data?.questions) ? data.questions : [];

            // Transform ALOC response to our format
            return questions.map((q: any, i: number) => ({
                id: q.id || Date.now() + i,
                question_text: q.question || q.question_text,
                question_type: 'mcq',
                difficulty: q.difficulty || 'medium',
                options: {
                    a: q.option_a || q.options?.a || '',
                    b: q.option_b || q.options?.b || '',
                    c: q.option_c || q.options?.c || '',
                    d: q.option_d || q.options?.d || '',
                },
                correct_answer: q.correct_answer || q.answer || 'a',
                topic: importForm.subject,
                explanation: q.explanation || '',
            }));
        },
        onSuccess: (data) => {
            setImportedQuestions(data);
            addToast(`Found ${data.length} questions ready to import`, 'success');
        },
        onError: (error: any) => {
            addToast(error?.message || 'Failed to fetch questions from API', 'error');
        },
    });

    const saveImportedQuestions = useMutation({
        mutationFn: async () => {
            for (const q of importedQuestions) {
                await apiClient.post(`learning/question-banks/${selectedBank.id}/questions/`, {
                    question_text: q.question_text,
                    question_type: q.question_type,
                    difficulty: q.difficulty,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    topic: q.topic,
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.questionBanks });
            queryClient.invalidateQueries({ queryKey: ['bankQuestions', selectedBank?.id] });
            setShowImportModal(false);
            setImportedQuestions([]);
            addToast('Questions imported successfully', 'success');
        },
        onError: () => {
            addToast('Failed to save imported questions', 'error');
        },
    });

    const filteredBanks = banks.filter((bank: any) =>
        bank.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.subject_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAdmin = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createBank.mutate(formData);
    };

    const handleAddQuestion = (e: React.FormEvent) => {
        e.preventDefault();
        addQuestion.mutate(questionForm);
    };

    const getDifficultyColor = (difficulty: string) => {
        const found = DIFFICULTY_LEVELS.find(d => d.value === difficulty);
        return found ? found.color : 'bg-gray-100 text-gray-800';
    };

    const openBank = (bank: any) => {
        setSelectedBank(bank);
        setView('questions');
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {view === 'questions' && (
                        <button
                            onClick={() => { setView('banks'); setSelectedBank(null); }}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            ← Back
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {view === 'banks' ? 'Question Bank' : selectedBank?.name || 'Questions'}
                        </h1>
                        <p className="text-gray-600">
                            {view === 'banks' ? 'Create and manage reusable questions for exams' : `${questions.length} questions in this bank`}
                        </p>
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        {view === 'questions' && selectedBank && (
                            <>
                                <button 
                                    onClick={() => setShowQuestionModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Question
                                </button>
                                <button 
                                    onClick={() => setShowImportModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    <Download className="h-4 w-4" />
                                    Import
                                </button>
                            </>
                        )}
                        {view === 'banks' && (
                            <button 
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                            >
                                <Plus className="h-4 w-4" />
                                New Question Bank
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Create Bank Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Question Bank" size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Bank Name</label>
                        <Input 
                            placeholder="e.g., JSS1 Mathematics Mid-Term" 
                            required 
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Subject</label>
                        <select 
                            className="w-full border rounded-md px-3 py-2"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                        >
                            <option value="">Select subject</option>
                            {NIGERIAN_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea 
                            className="w-full border rounded-md px-3 py-2" 
                            rows={2}
                            placeholder="Brief description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Class/Level</label>
                            <Input 
                                placeholder="e.g., JSS1" 
                                value={formData.class_level}
                                onChange={(e) => setFormData({ ...formData, class_level: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Term</label>
                            <select 
                                className="w-full border rounded-md px-3 py-2"
                                value={formData.term}
                                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                            >
                                <option value="">Select term</option>
                                <option value="first">First Term</option>
                                <option value="second">Second Term</option>
                                <option value="third">Third Term</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={createBank.isPending}>
                            {createBank.isPending ? 'Creating...' : 'Create Bank'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Add Question Modal */}
            <Modal isOpen={showQuestionModal} onClose={() => setShowQuestionModal(false)} title="Add Question" size="lg">
                <form onSubmit={handleAddQuestion} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Question</label>
                        <textarea 
                            className="w-full border rounded-md px-3 py-2" 
                            rows={3}
                            placeholder="Enter your question..."
                            required
                            value={questionForm.question_text}
                            onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Question Type</label>
                            <select 
                                className="w-full border rounded-md px-3 py-2"
                                value={questionForm.question_type}
                                onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value })}
                            >
                                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Difficulty</label>
                            <select 
                                className="w-full border rounded-md px-3 py-2"
                                value={questionForm.difficulty}
                                onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                            >
                                {DIFFICULTY_LEVELS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </div>
                    </div>
                    {questionForm.question_type === 'mcq' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Options (select correct answer)</label>
                            {['a', 'b', 'c', 'd'].map(opt => (
                                <div key={opt} className="flex items-center gap-2">
                                    <input 
                                        type="radio" 
                                        name="correct" 
                                        checked={questionForm.correct_answer === opt}
                                        onChange={() => setQuestionForm({ ...questionForm, correct_answer: opt })}
                                    />
                                    <span className="font-medium w-6">{opt.toUpperCase()}.</span>
                                    <Input 
                                        placeholder={`Option ${opt.toUpperCase()}`}
                                        value={questionForm.options[opt as keyof typeof questionForm.options]}
                                        onChange={(e) => setQuestionForm({ 
                                            ...questionForm, 
                                            options: { ...questionForm.options, [opt]: e.target.value }
                                        })}
                                        className="flex-1"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    {questionForm.question_type === 'true_false' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Correct Answer</label>
                            <select 
                                className="w-full border rounded-md px-3 py-2"
                                value={questionForm.correct_answer}
                                onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                            >
                                <option value="true">True</option>
                                <option value="false">False</option>
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1">Topic/Tag</label>
                        <Input 
                            placeholder="e.g., Algebra, Mechanics"
                            value={questionForm.topic}
                            onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Explanation (optional)</label>
                        <textarea 
                            className="w-full border rounded-md px-3 py-2" 
                            rows={2}
                            placeholder="Explain the correct answer..."
                            value={questionForm.explanation}
                            onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" onClick={() => setShowQuestionModal(false)}>Cancel</Button>
                        <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={addQuestion.isPending}>
                            {addQuestion.isPending ? 'Adding...' : 'Add Question'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Import Modal */}
            <Modal isOpen={showImportModal} onClose={() => { setShowImportModal(false); setImportedQuestions([]); }} title="Import Questions from Past Exams" size="lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Subject</label>
                            <select 
                                className="w-full border rounded-md px-3 py-2"
                                value={importForm.subject}
                                onChange={(e) => setImportForm({ ...importForm, subject: e.target.value })}
                            >
                                {NIGERIAN_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Exam Type</label>
                            <select 
                                className="w-full border rounded-md px-3 py-2"
                                value={importForm.exam_type}
                                onChange={(e) => setImportForm({ ...importForm, exam_type: e.target.value })}
                            >
                                {EXAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Year</label>
                            <select 
                                className="w-full border rounded-md px-3 py-2"
                                value={importForm.year}
                                onChange={(e) => setImportForm({ ...importForm, year: e.target.value })}
                            >
                                {Array.from({ length: 15 }, (_, i) => 2024 - i).map(y => (
                                    <option key={y} value={String(y)}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Number of Questions</label>
                            <Input 
                                type="number" 
                                min="1" 
                                max="40"
                                value={importForm.count}
                                onChange={(e) => setImportForm({ ...importForm, count: parseInt(e.target.value) || 10 })}
                            />
                        </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                        💡 This connects to ALOC/QBoard API to fetch real past questions. Free tier: 7,000 calls/month
                    </div>
                    {!selectedBank && (
                        <p className="text-orange-500 text-sm">⚠️ Please save the question bank first before importing questions.</p>
                    )}
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" onClick={() => { setShowImportModal(false); setImportedQuestions([]); }}>Cancel</Button>
                        <Button 
                            onClick={() => importFromAPI.mutate()} 
                            disabled={importFromAPI.isPending || !selectedBank}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {importFromAPI.isPending ? 'Searching...' : 'Search Questions'}
                        </Button>
                    </div>

                    {importedQuestions.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                                <span className="font-medium">{importedQuestions.length} Questions Found</span>
                                <Button 
                                    onClick={() => saveImportedQuestions.mutate()}
                                    disabled={saveImportedQuestions.isPending}
                                    className="bg-green-600 hover:bg-green-700 text-sm"
                                >
                                    {saveImportedQuestions.isPending ? 'Importing...' : `Import All to ${selectedBank?.name}`}
                                </Button>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {importedQuestions.slice(0, 5).map((q, i) => (
                                    <div key={i} className="p-3 border-b text-sm">
                                        <p className="font-medium">{i + 1}. {q.question_text.substring(0, 80)}...</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`px-2 py-0.5 text-xs rounded ${getDifficultyColor(q.difficulty)}`}>{q.difficulty}</span>
                                        </div>
                                    </div>
                                ))}
                                {importedQuestions.length > 5 && (
                                    <p className="p-3 text-gray-500 text-center text-sm">+ {importedQuestions.length - 5} more questions</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Stats - Only show on banks view */}
            {view === 'banks' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg"><BookMarked className="h-6 w-6" /></div>
                            <div>
                                <p className="text-3xl font-bold">{banks.length}</p>
                                <p className="text-blue-100">Question Banks</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg"><Brain className="h-6 w-6" /></div>
                            <div>
                                <p className="text-3xl font-bold">{banks.reduce((acc: number, b: any) => acc + (b.questions_count || 0), 0)}</p>
                                <p className="text-green-100">Total Questions</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg"><Tags className="h-6 w-6" /></div>
                            <div>
                                <p className="text-3xl font-bold">{new Set(banks.map((b: any) => b.subject_name)).size}</p>
                                <p className="text-purple-100">Subjects</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder={view === 'banks' ? 'Search question banks...' : 'Search questions...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
            </div>

            {/* Banks Grid */}
            {view === 'banks' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {banksLoading ? (
                        <p className="col-span-full text-center py-8 text-gray-500">Loading...</p>
                    ) : filteredBanks.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <BookMarked className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No question banks yet</p>
                            <p className="text-gray-400 text-sm">Create your first question bank to get started</p>
                        </div>
                    ) : (
                        filteredBanks.map((bank: any) => (
                            <div 
                                key={bank.id} 
                                onClick={() => openBank(bank)}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-brand-200 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 bg-gradient-to-br from-brand-50 to-brand-100 rounded-lg">
                                        <BookMarked className="h-5 w-5 text-brand-600" />
                                    </div>
                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                        {bank.class_level || 'All Levels'}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 group-hover:text-brand-600 transition">{bank.name}</h3>
                                <p className="text-sm text-gray-500 mb-3">{bank.subject_name}</p>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1 text-gray-600">
                                        <HelpCircle className="h-4 w-4" />
                                        {bank.questions_count || 0} questions
                                    </span>
                                    <span className="flex items-center gap-1 text-gray-600">
                                        <Tags className="h-4 w-4" />
                                        {bank.term || 'All Terms'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Questions List */}
            {view === 'questions' && (
                <div className="space-y-4">
                    {questionsLoading ? (
                        <p className="text-center py-8 text-gray-500">Loading questions...</p>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No questions in this bank yet</p>
                            <p className="text-gray-400 text-sm">Add questions manually or import from past exams</p>
                        </div>
                    ) : (
                        questions.map((q: any, index: number) => (
                            <div key={q.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{q.question_text}</p>
                                        {q.question_type === 'mcq' && q.options && (
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {Object.entries(q.options).map(([key, val]: [string, any]) => (
                                                    <div 
                                                        key={key}
                                                        className={`p-2 rounded-lg text-sm ${
                                                            q.correct_answer === key 
                                                                ? 'bg-green-100 border-green-300 text-green-800' 
                                                                : 'bg-gray-50 border-gray-200'
                                                        }`}
                                                    >
                                                        <span className="font-medium">{key.toUpperCase()}.</span> {val}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(q.difficulty)}`}>
                                                {q.difficulty}
                                            </span>
                                            {q.topic && (
                                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                                    {q.topic}
                                                </span>
                                            )}
                                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
                                                {q.question_type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
