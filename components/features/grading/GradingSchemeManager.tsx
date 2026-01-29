'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Plus, Trash2, Edit2, Save, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import { useToast } from '@/components/providers/toast-provider';

// Fetch Schemes
function useGradingSchemes() {
    return useQuery({
        queryKey: ['grading-schemes'],
        queryFn: async () => {
            const res = await apiClient.get('/grading-schemes/');
            return (res.data.results || res.data) as Types.GradingScheme[];
        }
    });
}

export const GradingSchemeManager = () => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const { data: schemes = [], isLoading } = useGradingSchemes();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Types.GradingScheme>>({});

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (data: Partial<Types.GradingScheme>) => {
            await apiClient.post('/grading-schemes/', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grading-schemes'] });
            addToast('Scheme created successfully', 'success');
            setEditingId(null);
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<Types.GradingScheme> }) => {
            await apiClient.patch(`/grading-schemes/${id}/`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grading-schemes'] });
            addToast('Scheme updated successfully', 'success');
            setEditingId(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/grading-schemes/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grading-schemes'] });
            addToast('Scheme deleted', 'success');
        }
    });

    const handleEdit = (scheme: Types.GradingScheme) => {
        setEditingId(scheme.id);
        const form = JSON.parse(JSON.stringify(scheme));
        if (!form.ranges) form.ranges = [];
        setEditForm(form);
    };

    const handleCreate = () => {
        const newScheme: Partial<Types.GradingScheme> = {
            name: 'New Grading Scheme',
            description: 'Description here',
            ranges: [
                { id: Utils.generateId(), grade: 'A', min_score: 75, max_score: 100, remark: 'Excellent', gpa_point: 4.0, created_at: Date.now(), updated_at: Date.now() },
                { id: Utils.generateId(), grade: 'B', min_score: 65, max_score: 74, remark: 'Very Good', gpa_point: 3.0, created_at: Date.now(), updated_at: Date.now() },
                { id: Utils.generateId(), grade: 'C', min_score: 55, max_score: 64, remark: 'Good', gpa_point: 2.0, created_at: Date.now(), updated_at: Date.now() },
                { id: Utils.generateId(), grade: 'D', min_score: 40, max_score: 54, remark: 'Fair', gpa_point: 1.0, created_at: Date.now(), updated_at: Date.now() },
                { id: Utils.generateId(), grade: 'F', min_score: 0, max_score: 39, remark: 'Fail', gpa_point: 0.0, created_at: Date.now(), updated_at: Date.now() },
            ]
        };
        createMutation.mutate(newScheme);
    };

    const handleSave = () => {
        if (!editingId || !editForm) return;
        updateMutation.mutate({ id: editingId, data: editForm });
    };

    const updateRange = (index: number, field: keyof Types.GradeRange, value: any) => {
        if (!editForm.ranges) return;
        const newRanges = [...editForm.ranges];
        (newRanges[index] as any)[field] = value;
        setEditForm({ ...editForm, ranges: newRanges });
    };

    const addRange = () => {
        const currentRanges = editForm.ranges || [];
        const newRange: Types.GradeRange = {
            id: Utils.generateId(),
            grade: '?', min_score: 0, max_score: 0, remark: '-', gpa_point: 0,
            created_at: Date.now(), updated_at: Date.now()
        };
        setEditForm({ ...editForm, ranges: [...currentRanges, newRange] });
    };

    const removeRange = (index: number) => {
        if (!editForm.ranges) return;
        const newRanges = editForm.ranges.filter((_, i) => i !== index);
        setEditForm({ ...editForm, ranges: newRanges });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Grading Schemes</h2>
                <Button onClick={handleCreate} className="gap-2"><Plus size={16} /> Create New Scheme</Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {schemes.map(scheme => (
                    <div key={scheme.id} className="bg-white p-6 rounded-xl border shadow-sm">
                        {editingId === scheme.id ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Scheme Name"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                    <Input
                                        label="Description"
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    />
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-bold text-sm mb-2 uppercase text-gray-500">Grade Ranges</h4>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-6 gap-2 text-xs font-bold text-gray-500 uppercase">
                                            <span>Grade</span>
                                            <span>Min</span>
                                            <span>Max</span>
                                            <span className="col-span-2">Remark</span>
                                            <span>GPA</span>
                                        </div>
                                        {editForm.ranges?.map((range, idx) => (
                                            <div key={range.id || idx} className="grid grid-cols-6 gap-2 items-center">
                                                <input className="p-2 border rounded" value={range.grade} onChange={e => updateRange(idx, 'grade', e.target.value)} />
                                                <input className="p-2 border rounded" type="number" value={range.min_score} onChange={e => updateRange(idx, 'min_score', Number(e.target.value))} />
                                                <input className="p-2 border rounded" type="number" value={range.max_score} onChange={e => updateRange(idx, 'max_score', Number(e.target.value))} />
                                                <input className="p-2 border rounded col-span-2" value={range.remark} onChange={e => updateRange(idx, 'remark', e.target.value)} />
                                                <div className="flex gap-2 items-center">
                                                    <input className="p-2 border rounded w-full" type="number" step="0.1" value={range.gpa_point} onChange={e => updateRange(idx, 'gpa_point', Number(e.target.value))} />
                                                    <button onClick={() => removeRange(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                        <Button variant="outline" size="sm" onClick={addRange} className="w-full mt-2"><Plus size={14} /> Add Grade Range</Button>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                    <Button onClick={handleSave} className="gap-2"><Save size={16} /> Save Changes</Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            {scheme.name}
                                            {scheme.is_default && <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full uppercase">Default</span>}
                                        </h3>
                                        <p className="text-gray-500 text-sm">{scheme.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(scheme)} className="p-2 hover:bg-gray-100 rounded text-gray-600"><Edit2 size={16} /></button>
                                        {!scheme.is_default && <button onClick={() => deleteMutation.mutate(scheme.id)} className="p-2 hover:bg-red-50 rounded text-red-500"><Trash2 size={16} /></button>}
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-xs text-gray-500 uppercase">
                                                <th className="text-left py-2">Grade</th>
                                                <th className="text-center py-2">Range</th>
                                                <th className="text-left py-2">Remark</th>
                                                <th className="text-center py-2">GPA</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {scheme.ranges?.sort((a, b) => b.min_score - a.min_score).map(range => (
                                                <tr key={range.id} className="border-b last:border-0">
                                                    <td className="py-2 font-bold">{range.grade}</td>
                                                    <td className="py-2 text-center">{range.min_score} - {range.max_score}</td>
                                                    <td className="py-2 text-gray-600">{range.remark}</td>
                                                    <td className="py-2 text-center">{range.gpa_point}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
