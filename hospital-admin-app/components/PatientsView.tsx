"use client";

import React, { useState, useEffect } from 'react';
import { getPatients, getPatientStats, getPatientById, updatePatient, registerPatientAgain } from '../lib/api';
import PatientCard from './PatientCard';
import PatientDetails from './PatientDetails';

interface Stats {
    totalPatients: number;
    todaysRegistrations: number;
    returningPatients: number;
    newPatientsThisMonth: number;
}

export default function PatientsView({ searchQuery }: { searchQuery: string }) {
    const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
    const [patients, setPatients] = useState<any[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [patientDetailsData, setPatientDetailsData] = useState<any>(null);

    // Edit Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (viewMode === 'list') {
            fetchData();
        }
    }, [viewMode, searchQuery]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [patientsRes, statsRes] = await Promise.all([
                getPatients(searchQuery),
                getPatientStats()
            ]);
            setPatients(patientsRes.patients);
            setStats(statsRes);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleView = async (id: string) => {
        try {
            setLoading(true);
            const data = await getPatientById(id);
            setPatientDetailsData(data);
            setSelectedPatientId(id);
            setViewMode('details');
        } catch (err) {
            console.error(err);
            alert('Failed to load patient details');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id: string) => {
        let p = patients.find(p => p._id === id);
        if (!p && patientDetailsData?.patient?._id === id) {
            p = patientDetailsData.patient;
        }
        if (p) {
            setEditForm({
                id,
                name: p.name || '',
                phoneNumber: p.phoneNumber || '',
                villageName: p.villageName || '',
                caseNumber: p.caseNumber || '',
                caseType: p.caseType || 'new'
            });
            setIsEditing(true);
        }
    };

    const submitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updatePatient(editForm.id, {
                name: editForm.name,
                phoneNumber: editForm.phoneNumber,
                villageName: editForm.villageName,
                caseNumber: editForm.caseNumber,
                caseType: editForm.caseType
            });
            setIsEditing(false);
            // refresh data
            if (viewMode === 'details') {
                handleView(editForm.id);
            } else {
                fetchData();
            }
        } catch (err) {
            alert('Failed to update patient');
        } finally {
            setSaving(false);
        }
    };

    const handleRegisterAgain = async (id: string) => {
        if (!confirm('Are you sure you want to re-register this patient for the current window?')) return;
        try {
            await registerPatientAgain(id);
            alert('Patient re-registered successfully! Token has been generated.');
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Failed to re-register patient');
        }
    };

    if (loading && viewMode === 'list') {
        return <div className="p-8 text-center text-[var(--ink-muted)]">Loading patients...</div>;
    }

    return (
        <div className="w-full relative">
            {viewMode === 'list' && (
                <div className="p-4 flex flex-col gap-6 animate-fade-in">
                    {/* Stats */}
                    {stats && !searchQuery && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]">
                                <p className="text-xs text-[var(--ink-muted)] mb-1">Total Patients</p>
                                <p className="font-bold text-xl">{stats.totalPatients}</p>
                            </div>
                            <div className="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]">
                                <p className="text-xs text-[var(--ink-muted)] mb-1">Today's Reg</p>
                                <p className="font-bold text-xl">{stats.todaysRegistrations}</p>
                            </div>
                            <div className="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]">
                                <p className="text-xs text-[var(--ink-muted)] mb-1">Returning</p>
                                <p className="font-bold text-xl">{stats.returningPatients}</p>
                            </div>
                            <div className="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]">
                                <p className="text-xs text-[var(--ink-muted)] mb-1">New this month</p>
                                <p className="font-bold text-xl">{stats.newPatientsThisMonth}</p>
                            </div>
                        </div>
                    )}

                    {/* Patient List */}
                    <div>
                        <h2 className="font-bold text-lg mb-4 text-[var(--ink)]">
                            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Patients'}
                        </h2>
                        {patients.length === 0 ? (
                            <p className="text-sm text-center py-8 text-[var(--ink-muted)] bg-[var(--surface)] border border-[var(--border)] border-dashed rounded-xl">
                                No patients found.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {patients.map(p => (
                                    <PatientCard 
                                        key={p._id} 
                                        patient={p} 
                                        onView={handleView} 
                                        onEdit={handleEdit}
                                        onRegisterAgain={handleRegisterAgain}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {viewMode === 'details' && patientDetailsData && (
                <PatientDetails 
                    patient={patientDetailsData.patient}
                    history={patientDetailsData.history}
                    onBack={() => setViewMode('list')}
                    onEdit={handleEdit}
                />
            )}

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-[var(--surface)] w-full max-w-md rounded-2xl shadow-xl border border-[var(--border)] p-6 overflow-hidden flex flex-col max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">Edit Patient</h2>
                        <form onSubmit={submitEdit} className="flex flex-col gap-4 overflow-y-auto pr-2">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--ink-light)] mb-1">Case Type</label>
                                <select 
                                    value={editForm.caseType}
                                    onChange={e => setEditForm({...editForm, caseType: e.target.value})}
                                    className="input-field w-full"
                                >
                                    <option value="new">New</option>
                                    <option value="old">Old</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--ink-light)] mb-1">Name</label>
                                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="input-field w-full" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--ink-light)] mb-1">Phone Number</label>
                                <input type="text" value={editForm.phoneNumber} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} className="input-field w-full" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--ink-light)] mb-1">Village</label>
                                <input type="text" value={editForm.villageName} onChange={e => setEditForm({...editForm, villageName: e.target.value})} className="input-field w-full" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--ink-light)] mb-1">Case Number</label>
                                <input type="text" value={editForm.caseNumber} onChange={e => setEditForm({...editForm, caseNumber: e.target.value})} className="input-field w-full" />
                            </div>
                            
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={saving} className="btn-primary min-w-[5rem]">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
