'use client';

import React, { useState } from 'react';
import { Truck, Plus, Search, MapPin, Users, Clock, Route, Car, Phone, Calendar, ArrowRight, Bus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, fetchAll } from '@/lib/hooks/use-data';
import { useSchoolStore } from '@/lib/store';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/providers/toast-provider';

const ROUTE_COLORS = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-teal-500 to-teal-600',
];

export default function TransportPage() {
    const { currentRole } = useSchoolStore();
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'routes' | 'assignments'>('routes');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        start_location: '',
        end_location: '',
        departure_time: '',
        duration: '',
        vehicle_plate: '',
        capacity: '',
        driver_name: '',
        driver_phone: '',
    });

    const { data: routes = [], isLoading: routesLoading } = useQuery({
        queryKey: queryKeys.transportRoutes,
        queryFn: () => fetchAll<any>('transport/routes/'),
    });

    const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
        queryKey: queryKeys.transportAssignments,
        queryFn: () => fetchAll<any>('transport/assignments/'),
    });

    const { data: students = [] } = useQuery({
        queryKey: queryKeys.students,
        queryFn: () => fetchAll<any>('academic/students/'),
    });

    const createRoute = useMutation({
        mutationFn: async (data: typeof formData) => {
            const payload = {
                ...data,
                duration: data.duration ? parseInt(data.duration) : null,
                capacity: data.capacity ? parseInt(data.capacity) : null,
            };
            const response = await apiClient.post('transport/routes/', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transportRoutes });
            setShowModal(false);
            setFormData({ name: '', start_location: '', end_location: '', departure_time: '', duration: '', vehicle_plate: '', capacity: '', driver_name: '', driver_phone: '' });
            addToast('Route added successfully', 'success');
        },
        onError: () => {
            addToast('Failed to add route', 'error');
        },
    });

    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<any>(null);
    const [assignForm, setAssignForm] = useState({ students: [] as string[] });

    const assignStudents = useMutation({
        mutationFn: async (data: { route: number; students: string[] }) => {
            const promises = data.students.map((studentId) =>
                apiClient.post('transport/assignments/', { route: data.route, student: studentId })
            );
            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transportAssignments });
            setAssignModalOpen(false);
            setSelectedRoute(null);
            setAssignForm({ students: [] });
            addToast('Students assigned successfully', 'success');
        },
        onError: () => {
            addToast('Failed to assign students', 'error');
        },
    });

    const filteredRoutes = routes.filter((route: any) =>
        route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.start_location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAdmin = currentRole === 'admin' || currentRole === 'super_admin';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createRoute.mutate(formData);
    };

    // Stats
    const activeRoutes = routes.filter((r: any) => r.is_active).length;
    const totalCapacity = routes.reduce((acc: number, r: any) => acc + (r.capacity || 0), 0);
    const totalAssigned = assignments.length;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Transport Management</h1>
                    <p className="text-gray-600">Manage bus routes and student transportation</p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-md"
                    >
                        <Plus className="h-4 w-4" />
                        Add Route
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Total Routes</p>
                            <p className="text-3xl font-bold">{routes.length}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><Route className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Active Routes</p>
                            <p className="text-3xl font-bold">{activeRoutes}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><Truck className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Assigned Students</p>
                            <p className="text-3xl font-bold">{totalAssigned}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><Users className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Total Capacity</p>
                            <p className="text-3xl font-bold">{totalCapacity}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><Car className="h-6 w-6" /></div>
                    </div>
                </div>
            </div>

            {/* Add Route Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Bus Route" size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Route Name</label>
                        <Input placeholder="e.g., Route A - Ikoyi Express" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Location</label>
                            <Input placeholder="Pickup point" required value={formData.start_location} onChange={(e) => setFormData({ ...formData, start_location: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">End Location</label>
                            <Input placeholder="School" required value={formData.end_location} onChange={(e) => setFormData({ ...formData, end_location: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Departure Time</label>
                            <Input type="time" required value={formData.departure_time} onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Duration (min)</label>
                            <Input type="number" placeholder="30" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Vehicle Plate</label>
                            <Input placeholder="ABC-123XY" value={formData.vehicle_plate} onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Capacity</label>
                            <Input type="number" placeholder="50" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Driver Name</label>
                            <Input placeholder="Driver name" value={formData.driver_name} onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Driver Phone</label>
                            <Input placeholder="Phone number" value={formData.driver_phone} onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={createRoute.isPending}>
                            {createRoute.isPending ? 'Adding...' : 'Add Route'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Assign Students Modal */}
            <Modal isOpen={assignModalOpen} onClose={() => { setAssignModalOpen(false); setSelectedRoute(null); }} title={`Assign Students to ${selectedRoute?.name || ''}`} size="lg">
                <form onSubmit={(e) => { e.preventDefault(); assignStudents.mutate({ route: selectedRoute.id, students: assignForm.students }); }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Select Students</label>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                            {students.map((s: any) => (
                                <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={assignForm.students.includes(String(s.id))}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setAssignForm({ students: [...assignForm.students, String(s.id)] });
                                            } else {
                                                setAssignForm({ students: assignForm.students.filter(id => id !== String(s.id)) });
                                            }
                                        }}
                                    />
                                    <span>{s.first_name} {s.last_name}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{assignForm.students.length} student(s) selected</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" onClick={() => { setAssignModalOpen(false); setSelectedRoute(null); }}>Cancel</Button>
                        <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={assignStudents.isPending || assignForm.students.length === 0}>
                            {assignStudents.isPending ? 'Assigning...' : 'Assign Students'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Tabs */}
            <div className="flex gap-2 border-b overflow-x-auto">
                {[
                    { id: 'routes', label: 'Routes', icon: Route, count: routes.length },
                    { id: 'assignments', label: 'Assignments', icon: Users, count: assignments.length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium whitespace-nowrap ${
                            activeTab === tab.id ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500 hover:text-gray-700'
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
                    placeholder="Search routes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
            </div>

            {/* Routes Grid */}
            {activeTab === 'routes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {routesLoading ? (
                        <p className="col-span-full text-center py-8 text-gray-500">Loading...</p>
                    ) : filteredRoutes.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No routes found</p>
                            <p className="text-gray-400 text-sm">Add your first bus route to get started</p>
                        </div>
                    ) : (
                        filteredRoutes.map((route: any, index: number) => {
                            const colorClass = ROUTE_COLORS[index % ROUTE_COLORS.length];
                            return (
                                <div key={route.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition">
                                    <div className={`h-2 bg-gradient-to-r ${colorClass}`} />
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-lg text-gray-900">{route.name}</h3>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${route.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {route.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">Route Code: {route.id}</p>
                                            </div>
                                            <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClass} text-white`}>
                                                <Bus className="h-5 w-5" />
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                    <MapPin className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs">From</p>
                                                    <p className="font-medium">{route.start_location}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                                    <MapPin className="h-4 w-4 text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs">To</p>
                                                    <p className="font-medium">{route.end_location}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                                                <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                                                <p className="text-gray-500 text-xs">Departure</p>
                                                <p className="font-medium">{route.departure_time || '-'}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                                                <Users className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                                                <p className="text-gray-500 text-xs">Capacity</p>
                                                <p className="font-medium">{route.capacity || 0}</p>
                                            </div>
                                        </div>

                                        {(route.driver_name || route.vehicle_plate) && (
                                            <div className="border-t pt-3 mb-4">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500 flex items-center gap-1">
                                                        <Car className="h-3 w-3" /> {route.vehicle_plate || '-'}
                                                    </span>
                                                    <span className="text-gray-500 flex items-center gap-1">
                                                        <Users className="h-3 w-3" /> {route.driver_name || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-brand-600">{route.active_students}</p>
                                                <p className="text-xs text-gray-500">Students</p>
                                            </div>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => { setSelectedRoute(route); setAssignModalOpen(true); }}
                                                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition"
                                                >
                                                    <Users className="h-4 w-4" />
                                                    Assign
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Assignments Table */}
            {activeTab === 'assignments' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup Point</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {assignmentsLoading ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center">Loading...</td></tr>
                            ) : assignments.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No assignments</td></tr>
                            ) : (
                                assignments.map((assign: any) => (
                                    <tr key={assign.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                                                    <Users className="h-4 w-4 text-brand-600" />
                                                </div>
                                                <span className="font-medium">{assign.student_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">{assign.route_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{assign.pickup_point || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                assign.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {assign.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}