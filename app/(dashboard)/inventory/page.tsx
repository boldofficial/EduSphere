'use client';

import React, { useState } from 'react';
import { Database, Plus, Search, Package, AlertTriangle, CheckCircle, Monitor, Wrench, Car, GraduationCap, DollarSign, Clock, Building2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, fetchAll } from '@/lib/hooks/use-data';
import { useSchoolStore } from '@/lib/store';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/providers/toast-provider';

const CATEGORY_ICONS: Record<string, any> = {
    electronics: Monitor,
    furniture: Building2,
    equipment: Wrench,
    vehicle: Car,
    stationery: Package,
    sports: CheckCircle,
};

const CATEGORY_COLORS: Record<string, string> = {
    electronics: 'from-blue-50 to-blue-100 border-blue-200',
    furniture: 'from-amber-50 to-amber-100 border-amber-200',
    equipment: 'from-green-50 to-green-100 border-green-200',
    vehicle: 'from-purple-50 to-purple-100 border-purple-200',
    stationery: 'from-pink-50 to-pink-100 border-pink-200',
    sports: 'from-orange-50 to-orange-100 border-orange-200',
};

export default function InventoryPage() {
    const { currentRole } = useSchoolStore();
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'assets' | 'items'>('assets');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        status: 'available',
        location: '',
        purchase_cost: '',
        serial_number: '',
    });

    const { data: assets = [], isLoading: assetsLoading } = useQuery({
        queryKey: queryKeys.inventoryAssets,
        queryFn: () => fetchAll<any>('inventory/assets/'),
    });

    const { data: items = [], isLoading: itemsLoading } = useQuery({
        queryKey: queryKeys.inventoryItems,
        queryFn: () => fetchAll<any>('inventory/items/'),
    });

    const { data: students = [] } = useQuery({
        queryKey: queryKeys.students,
        queryFn: () => fetchAll<any>('academic/students/'),
    });

    const createAsset = useMutation({
        mutationFn: async (data: typeof formData) => {
            const payload = { ...data, purchase_cost: data.purchase_cost ? parseFloat(data.purchase_cost) : null };
            const response = await apiClient.post('inventory/assets/', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventoryAssets });
            setShowModal(false);
            setFormData({ name: '', category: '', status: 'available', location: '', purchase_cost: '', serial_number: '' });
            addToast('Asset added successfully', 'success');
        },
        onError: () => {
            addToast('Failed to add asset', 'error');
        },
    });

    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [assignForm, setAssignForm] = useState({ student: '' });

    const assignAsset = useMutation({
        mutationFn: async (data: { asset: number; student: string }) => {
            const response = await apiClient.post('inventory/assignments/', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventoryAssets });
            setAssignModalOpen(false);
            setSelectedAsset(null);
            setAssignForm({ student: '' });
            addToast('Asset assigned successfully', 'success');
        },
        onError: () => {
            addToast('Failed to assign asset', 'error');
        },
    });

    const filteredAssets = assets.filter((item: any) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.asset_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredItems = items.filter((item: any) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAdmin = currentRole === 'admin' || currentRole === 'super_admin';

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-700 border-green-200';
            case 'in_use': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'maintenance': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'lost': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createAsset.mutate(formData);
    };

    // Stats
    const totalValue = assets.reduce((acc: number, a: any) => acc + (a.purchase_cost || 0), 0);
    const availableCount = assets.filter((a: any) => a.status === 'available').length;
    const inUseCount = assets.filter((a: any) => a.status === 'in_use').length;
    const maintenanceCount = assets.filter((a: any) => a.status === 'maintenance').length;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventory & Assets</h1>
                    <p className="text-gray-600">Track and manage school assets</p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-md"
                    >
                        <Plus className="h-4 w-4" />
                        Add Asset
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-200 text-sm">Total Assets</p>
                            <p className="text-3xl font-bold">{assets.length}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><Database className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Available</p>
                            <p className="text-3xl font-bold">{availableCount}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><CheckCircle className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">In Use</p>
                            <p className="text-3xl font-bold">{inUseCount}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><GraduationCap className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 text-sm">Total Value</p>
                            <p className="text-2xl font-bold">₦{totalValue.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><DollarSign className="h-6 w-6" /></div>
                    </div>
                </div>
            </div>

            {/* Add Asset Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Asset" size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Asset Name</label>
                        <Input placeholder="Asset name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select className="w-full border rounded-md px-3 py-2" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                                <option value="">Select category</option>
                                <option value="electronics">Electronics</option>
                                <option value="furniture">Furniture</option>
                                <option value="equipment">Equipment</option>
                                <option value="vehicle">Vehicle</option>
                                <option value="stationery">Stationery</option>
                                <option value="sports">Sports Equipment</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select className="w-full border rounded-md px-3 py-2" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                <option value="available">Available</option>
                                <option value="in_use">In Use</option>
                                <option value="maintenance">Under Maintenance</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Location</label>
                            <Input placeholder="e.g., ICT Room" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Purchase Cost</label>
                            <Input type="number" placeholder="0.00" value={formData.purchase_cost} onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Serial Number</label>
                        <Input placeholder="Serial number" value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={createAsset.isPending}>
                            {createAsset.isPending ? 'Adding...' : 'Add Asset'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Assign Asset Modal */}
            <Modal isOpen={assignModalOpen} onClose={() => { setAssignModalOpen(false); setSelectedAsset(null); }} title={`Assign: ${selectedAsset?.name || ''}`} size="md">
                <form onSubmit={(e) => { e.preventDefault(); assignAsset.mutate({ asset: selectedAsset.id, student: assignForm.student }); }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Assign to Student</label>
                        <select className="w-full border rounded-md px-3 py-2" value={assignForm.student} onChange={(e) => setAssignForm({ student: e.target.value })} required>
                            <option value="">Choose student...</option>
                            {students.map((s: any) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" onClick={() => { setAssignModalOpen(false); setSelectedAsset(null); }}>Cancel</Button>
                        <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={assignAsset.isPending}>
                            {assignAsset.isPending ? 'Assigning...' : 'Assign Asset'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Tabs */}
            <div className="flex gap-2 border-b overflow-x-auto">
                {[
                    { id: 'assets', label: 'Assets', count: assets.length },
                    { id: 'items', label: 'Stock Items', count: items.length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium whitespace-nowrap ${
                            activeTab === tab.id ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
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
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
            </div>

            {/* Assets Grid */}
            {activeTab === 'assets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assetsLoading ? (
                        <p className="col-span-full text-center py-8 text-gray-500">Loading...</p>
                    ) : filteredAssets.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No assets found</p>
                            <p className="text-gray-400 text-sm">Add your first asset to get started</p>
                        </div>
                    ) : (
                        filteredAssets.map((asset: any) => {
                            const IconComponent = CATEGORY_ICONS[asset.category] || Package;
                            const colorClass = CATEGORY_COLORS[asset.category] || 'from-gray-50 to-gray-100 border-gray-200';
                            
                            return (
                                <div key={asset.id} className={`bg-gradient-to-br ${colorClass} rounded-xl border p-5 hover:shadow-lg transition`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 bg-white/60 rounded-lg">
                                            <IconComponent className="h-5 w-5 text-gray-700" />
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(asset.status)}`}>
                                            {asset.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 mb-1">{asset.name}</h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        <span className="font-medium">{asset.asset_code}</span>
                                        {asset.serial_number && <span className="ml-2">• S/N: {asset.serial_number}</span>}
                                    </p>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 flex items-center gap-1">
                                                <Building2 className="h-3 w-3" /> Location
                                            </span>
                                            <span className="font-medium">{asset.location || '-'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 flex items-center gap-1">
                                                <DollarSign className="h-3 w-3" /> Value
                                            </span>
                                            <span className="font-medium">₦{(asset.purchase_cost || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 flex items-center gap-1">
                                                <GraduationCap className="h-3 w-3" /> Assigned To
                                            </span>
                                            <span className="font-medium">{asset.assigned_to_name || '-'}</span>
                                        </div>
                                    </div>
                                    
                                    {isAdmin && asset.status === 'available' && (
                                        <button
                                            onClick={() => { setSelectedAsset(asset); setAssignModalOpen(true); }}
                                            className="w-full mt-4 py-2 text-sm font-medium text-brand-700 bg-white/80 rounded-lg hover:bg-white transition"
                                        >
                                            Assign to Student
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Stock Items Table */}
            {activeTab === 'items' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {itemsLoading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center">Loading...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No items found</td></tr>
                            ) : (
                                filteredItems.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{item.name}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-sm">{item.sku || '-'}</td>
                                        <td className="px-6 py-4">{item.quantity}</td>
                                        <td className="px-6 py-4 text-gray-500">{item.min_stock_level || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                (item.quantity || 0) <= (item.min_stock_level || 0) 
                                                    ? 'bg-red-100 text-red-700' 
                                                    : 'bg-green-100 text-green-700'
                                            }`}>
                                                {(item.quantity || 0) <= (item.min_stock_level || 0) ? 'Low Stock' : 'In Stock'}
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