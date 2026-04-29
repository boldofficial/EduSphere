'use client';

import React, { useState } from 'react';
import { Book, Plus, Search, Users, Calendar, Clock, BookOpen, AlertTriangle, Library, CheckCircle, XCircle, GraduationCap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, fetchAll } from '@/lib/hooks/use-data';
import { useSchoolStore } from '@/lib/store';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/providers/toast-provider';

const CATEGORY_COLORS: Record<string, string> = {
    fiction: 'bg-pink-100 text-pink-700',
    'non-fiction': 'bg-blue-100 text-blue-700',
    textbook: 'bg-green-100 text-green-700',
    reference: 'bg-purple-100 text-purple-700',
};

export default function LibraryPage() {
    const { currentRole } = useSchoolStore();
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'books' | 'borrow' | 'members'>('books');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        total_copies: 1,
        category: '',
        shelf_location: '',
    });

    const { data: books = [], isLoading: booksLoading } = useQuery({
        queryKey: queryKeys.libraryBooks,
        queryFn: () => fetchAll<any>('library/books/'),
    });

    const { data: borrowRecords = [], isLoading: borrowLoading } = useQuery({
        queryKey: queryKeys.libraryBorrow,
        queryFn: () => fetchAll<any>('library/borrow/'),
    });

    const { data: members = [], isLoading: membersLoading } = useQuery({
        queryKey: queryKeys.libraryMembers,
        queryFn: () => fetchAll<any>('library/members/'),
    });

    const { data: students = [] } = useQuery({
        queryKey: queryKeys.students,
        queryFn: () => fetchAll<any>('academic/students/'),
    });

    const createBook = useMutation({
        mutationFn: async (data: typeof formData) => {
            const response = await apiClient.post('library/books/', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.libraryBooks });
            setShowModal(false);
            setFormData({ title: '', author: '', isbn: '', total_copies: 1, category: '', shelf_location: '' });
            addToast('Book added successfully', 'success');
        },
        onError: () => {
            addToast('Failed to add book', 'error');
        },
    });

    const [borrowModalOpen, setBorrowModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [borrowForm, setBorrowForm] = useState({ student: '', due_date: '' });

    const borrowBook = useMutation({
        mutationFn: async (data: { book: number; student: string; due_date: string }) => {
            const response = await apiClient.post('library/borrow/', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.libraryBooks });
            queryClient.invalidateQueries({ queryKey: queryKeys.libraryBorrow });
            setBorrowModalOpen(false);
            setSelectedBook(null);
            setBorrowForm({ student: '', due_date: '' });
            addToast('Book borrowed successfully', 'success');
        },
        onError: () => {
            addToast('Failed to borrow book', 'error');
        },
    });

    const filteredBooks = books.filter((book: any) =>
        book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAdmin = currentRole === 'admin' || currentRole === 'super_admin';
    
    const availableBooks = books.filter((b: any) => b.available_copies > 0).length;
    const borrowedBooks = books.reduce((acc: number, b: any) => acc + (b.total_copies - (b.available_copies || 0)), 0);
    const overdueRecords = borrowRecords.filter((r: any) => r.status === 'overdue').length;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createBook.mutate(formData);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Library Management</h1>
                    <p className="text-gray-600">Manage books, borrowing, and members</p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-md"
                    >
                        <Plus className="h-4 w-4" />
                        Add Book
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Total Books</p>
                            <p className="text-3xl font-bold">{books.length}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><Library className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Available</p>
                            <p className="text-3xl font-bold">{availableBooks}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><BookOpen className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Borrowed</p>
                            <p className="text-3xl font-bold">{borrowedBooks}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><Book className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm">Overdue</p>
                            <p className="text-3xl font-bold">{overdueRecords}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><AlertTriangle className="h-6 w-6" /></div>
                    </div>
                </div>
            </div>

            {/* Add Book Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Book" size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <Input 
                            placeholder="Book title" 
                            required 
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Author</label>
                        <Input 
                            placeholder="Author name" 
                            required 
                            value={formData.author}
                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">ISBN</label>
                        <Input 
                            placeholder="ISBN number" 
                            value={formData.isbn}
                            onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Total Copies</label>
                            <Input 
                                type="number" 
                                min="1" 
                                value={formData.total_copies}
                                onChange={(e) => setFormData({ ...formData, total_copies: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select 
                                className="w-full border rounded-md px-3 py-2"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">Select category</option>
                                <option value="fiction">Fiction</option>
                                <option value="non-fiction">Non-Fiction</option>
                                <option value="textbook">Textbook</option>
                                <option value="reference">Reference</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Shelf Location</label>
                        <Input 
                            placeholder="e.g., Shelf A-1" 
                            value={formData.shelf_location}
                            onChange={(e) => setFormData({ ...formData, shelf_location: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={createBook.isPending}>
                            {createBook.isPending ? 'Adding...' : 'Add Book'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Borrow Book Modal */}
            <Modal isOpen={borrowModalOpen} onClose={() => { setBorrowModalOpen(false); setSelectedBook(null); }} title={`Borrow: ${selectedBook?.title || ''}`} size="md">
                <form onSubmit={(e) => { e.preventDefault(); borrowBook.mutate({ book: selectedBook.id, student: borrowForm.student, due_date: borrowForm.due_date }); }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Student</label>
                        <select 
                            className="w-full border rounded-md px-3 py-2"
                            value={borrowForm.student}
                            onChange={(e) => setBorrowForm({ ...borrowForm, student: e.target.value })}
                            required
                        >
                            <option value="">Choose student...</option>
                            {students.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <Input 
                            type="date" 
                            required 
                            value={borrowForm.due_date}
                            onChange={(e) => setBorrowForm({ ...borrowForm, due_date: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" onClick={() => { setBorrowModalOpen(false); setSelectedBook(null); }}>Cancel</Button>
                        <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={borrowBook.isPending}>
                            {borrowBook.isPending ? 'Processing...' : 'Borrow Book'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Tabs */}
            <div className="flex gap-2 border-b overflow-x-auto">
                {[
                    { id: 'books', label: 'Books', icon: Book, count: books.length },
                    { id: 'borrow', label: 'Borrowing', icon: Calendar, count: borrowRecords.length },
                    { id: 'members', label: 'Members', icon: Users, count: members.length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium whitespace-nowrap ${
                            activeTab === tab.id 
                                ? 'border-b-2 border-brand-600 text-brand-600' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                        <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-100">{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
            </div>

            {/* Books Grid */}
            {activeTab === 'books' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {booksLoading ? (
                        <p className="col-span-full text-center py-8 text-gray-500">Loading...</p>
                    ) : filteredBooks.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <Book className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No books found</p>
                            <p className="text-gray-400 text-sm">Add your first book to get started</p>
                        </div>
                    ) : (
                        filteredBooks.map((book: any) => (
                            <div key={book.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                                <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    <Book className="h-12 w-12 text-gray-400" />
                                </div>
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900 line-clamp-1">{book.title}</h3>
                                        {book.category && (
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${CATEGORY_COLORS[book.category] || 'bg-gray-100 text-gray-600'}`}>
                                                {book.category}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">{book.author}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-1 text-gray-600">
                                            <BookOpen className="h-3 w-3" />
                                            {book.available_copies}/{book.total_copies} available
                                        </span>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                                            book.available_copies > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {book.available_copies > 0 ? 'Available' : 'Out'}
                                        </span>
                                    </div>
                                    {isAdmin && book.available_copies > 0 && (
                                        <button
                                            onClick={() => { setSelectedBook(book); setBorrowModalOpen(true); }}
                                            className="w-full mt-3 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition"
                                        >
                                            Borrow Book
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Borrow Records Table */}
            {activeTab === 'borrow' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Borrow Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {borrowLoading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center">Loading...</td></tr>
                            ) : borrowRecords.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No borrow records</td></tr>
                            ) : (
                                borrowRecords.map((record: any) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                                                    <GraduationCap className="h-4 w-4 text-brand-600" />
                                                </div>
                                                <span className="font-medium">{record.student_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Book className="h-4 w-4 text-gray-400" />
                                                <span>{record.book_title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{record.borrow_date}</td>
                                        <td className="px-6 py-4 text-gray-600">{record.due_date}</td>
                                        <td className="px-6 py-4">
                                            {record.status === 'returned' ? (
                                                <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                                    <CheckCircle className="h-3 w-3" /> Returned
                                                </span>
                                            ) : record.status === 'overdue' ? (
                                                <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                                                    <XCircle className="h-3 w-3" /> Overdue
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                                                    <Clock className="h-3 w-3" /> Borrowed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Members Grid */}
            {activeTab === 'members' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {membersLoading ? (
                        <p className="col-span-full text-center py-8 text-gray-500">Loading...</p>
                    ) : members.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No library members</p>
                            <p className="text-gray-400 text-sm">Students will automatically become members when they borrow books</p>
                        </div>
                    ) : (
                        members.map((member: any) => (
                            <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center">
                                    <Users className="h-6 w-6 text-brand-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{member.student_name}</h3>
                                    <p className="text-sm text-gray-500">Member since {member.member_since}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {member.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}