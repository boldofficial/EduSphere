'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useClasses, useSubjects } from '@/lib/hooks/use-data';
import { Loader2, Plus, Video, FileText, Image as ImageIcon } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FileUpload } from '@/components/ui/file-upload';

interface CreateAssignmentModalProps {
    children: React.ReactNode;
}

export function CreateAssignmentModal({ children }: CreateAssignmentModalProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        student_class: '',
        subject: '',
        due_date: '',
        points: 100,
        attachment_url: '',
        video_url: '',
        image_url: ''
    });

    const { data: classes } = useClasses();
    const { data: subjects } = useSubjects();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiClient.post('/learning/assignments/', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            setOpen(false);
            setFormData({
                title: '',
                description: '',
                student_class: '',
                subject: '',
                due_date: '',
                points: 100,
                attachment_url: '',
                video_url: '',
                image_url: ''
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>{children}</div>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Assignment" size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Algebra Homework 3"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Class</label>
                            <Select
                                required
                                value={formData.student_class}
                                onChange={e => setFormData({ ...formData, student_class: e.target.value })}
                            >
                                <option value="">Select Class</option>
                                {classes?.map(c => (
                                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Subject</label>
                            <Select
                                required
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            >
                                <option value="">Select Subject</option>
                                {subjects?.map(s => (
                                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Due Date</label>
                            <Input
                                type="datetime-local"
                                required
                                value={formData.due_date}
                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Points</label>
                            <Input
                                type="number"
                                required
                                value={formData.points}
                                onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <RichTextEditor
                            placeholder="Detailed instructions for students..."
                            value={formData.description}
                            onChange={val => setFormData({ ...formData, description: val })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                File Attachment
                            </label>
                            <FileUpload
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                value={formData.attachment_url}
                                onChange={val => setFormData({ ...formData, attachment_url: val || '' })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-green-500" />
                                Image/Photo
                            </label>
                            <FileUpload
                                accept="image/*"
                                value={formData.image_url}
                                onChange={val => setFormData({ ...formData, image_url: val || '' })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Video className="w-4 h-4 text-red-500" />
                            Embedded Video URL (YouTube/Vimeo)
                        </label>
                        <Input
                            value={formData.video_url}
                            onChange={e => setFormData({ ...formData, video_url: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Assignment
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

interface CreateQuizModalProps {
    children: React.ReactNode;
}

export function CreateQuizModal({ children }: CreateQuizModalProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        student_class: '',
        subject: '',
        start_time: '',
        end_time: '',
        duration_minutes: 60
    });

    const { data: classes } = useClasses();
    const { data: subjects } = useSubjects();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiClient.post('/learning/quizzes/', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
            setOpen(false);
            setFormData({
                title: '',
                description: '',
                student_class: '',
                subject: '',
                start_time: '',
                end_time: '',
                duration_minutes: 60
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>{children}</div>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Quiz / Exam">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Mid-Term Mathematics Exam"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Class</label>
                            <Select
                                required
                                value={formData.student_class}
                                onChange={e => setFormData({ ...formData, student_class: e.target.value })}
                            >
                                <option value="">Select Class</option>
                                {classes?.map(c => (
                                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Subject</label>
                            <Select
                                required
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            >
                                <option value="">Select Subject</option>
                                {subjects?.map(s => (
                                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Time</label>
                            <Input
                                type="datetime-local"
                                required
                                value={formData.start_time}
                                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Time</label>
                            <Input
                                type="datetime-local"
                                required
                                value={formData.end_time}
                                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Duration (Minutes)</label>
                        <Input
                            type="number"
                            required
                            value={formData.duration_minutes}
                            onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Quiz
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

interface CreateQuestionModalProps {
    quizId: string;
    onSuccess?: () => void;
    children: React.ReactNode;
}

export function CreateQuestionModal({ quizId, onSuccess, children }: CreateQuestionModalProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        text: '',
        question_type: 'mcq',
        points: 1,
        options: [
            { text: '', is_correct: false },
            { text: '', is_correct: false },
            { text: '', is_correct: false },
            { text: '', is_correct: false }
        ]
    });

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const payload = { ...data, quiz: quizId };
            const res = await apiClient.post('/learning/questions/', payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions', quizId] });
            setOpen(false);
            if (onSuccess) onSuccess();
            // Reset form
            setFormData({
                text: '',
                question_type: 'mcq',
                points: 1,
                options: [
                    { text: '', is_correct: false },
                    { text: '', is_correct: false },
                    { text: '', is_correct: false },
                    { text: '', is_correct: false }
                ]
            });
        }
    });

    const handleOptionChange = (idx: number, field: string, value: any) => {
        const newOptions = [...formData.options];
        newOptions[idx] = { ...newOptions[idx], [field]: value };
        setFormData({ ...formData, options: newOptions });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validation: Ensure at least one correct option for MCQ
        if (formData.question_type === 'mcq' && !formData.options.some(o => o.is_correct)) {
            alert('Please select at least one correct option.');
            return;
        }
        mutation.mutate(formData);
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>{children}</div>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Question" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Question Text</label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                            value={formData.text}
                            onChange={e => setFormData({ ...formData, text: e.target.value })}
                            placeholder="Enter the question here..."
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="space-y-2 w-1/2">
                            <label className="text-sm font-medium">Type</label>
                            <Select
                                value={formData.question_type}
                                onChange={e => setFormData({ ...formData, question_type: e.target.value })}
                            >
                                <option value="mcq">Multiple Choice</option>
                                <option value="theory">Theory / Essay</option>
                            </Select>
                        </div>
                        <div className="space-y-2 w-1/2">
                            <label className="text-sm font-medium">Points</label>
                            <Input
                                type="number"
                                required
                                value={formData.points}
                                onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    {formData.question_type === 'mcq' && (
                        <div className="space-y-3 border p-4 rounded-md bg-gray-50">
                            <label className="text-sm font-medium block">Options</label>
                            {formData.options.map((option, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <Input
                                        type="radio"
                                        name="correct_option"
                                        className="w-4 h-4 mt-1"
                                        checked={option.is_correct}
                                        onChange={() => {
                                            // Reset others to false (single choice logic for simplicity, extend for multiple later)
                                            const newOps = formData.options.map((o, i) => ({ ...o, is_correct: i === idx }));
                                            setFormData({ ...formData, options: newOps });
                                        }}
                                    />
                                    <Input
                                        placeholder={`Option ${idx + 1}`}
                                        value={option.text}
                                        onChange={e => handleOptionChange(idx, 'text', e.target.value)}
                                        required={idx < 2} // Require at least 2 options
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Question
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
