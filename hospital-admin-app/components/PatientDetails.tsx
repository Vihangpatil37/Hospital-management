import React, { useState } from 'react';

interface PatientDetailsProps {
    patient: {
        _id: string;
        name?: string;
        phoneNumber: string;
        villageName?: string;
        caseNumber?: string;
        caseType: string;
    };
    history: Array<{
        _id: string;
        createdAt: string;
        status: string;
        registrationWindowId: string;
        tokenNumber: number | null;
        queueStatus: string | null;
    }>;
    onBack: () => void;
    onEdit: (id: string) => void;
}

export default function PatientDetails({ patient, history, onBack, onEdit }: PatientDetailsProps) {
    return (
        <div className="p-4 animate-fade-in flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
                <button onClick={onBack} className="p-2 rounded-lg hover:bg-[var(--bg)] transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <h2 className="text-xl font-bold flex-1">Patient Profile</h2>
                <button onClick={() => onEdit(patient._id)} className="btn-secondary text-sm">Edit</button>
            </div>

            {/* Info Card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-[var(--ink)]">Information</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                    <div>
                        <span className="block text-xs font-semibold text-[var(--ink-light)] uppercase tracking-wider">Name</span>
                        <span className="font-medium text-[var(--ink)]">{patient.name || '-'}</span>
                    </div>
                    <div>
                        <span className="block text-xs font-semibold text-[var(--ink-light)] uppercase tracking-wider">Phone</span>
                        <span className="font-mono text-[var(--ink)]">{patient.phoneNumber}</span>
                    </div>
                    <div>
                        <span className="block text-xs font-semibold text-[var(--ink-light)] uppercase tracking-wider">Case Number</span>
                        <span className="font-medium text-[var(--ink)]">{patient.caseNumber || '-'}</span>
                    </div>
                    <div>
                        <span className="block text-xs font-semibold text-[var(--ink-light)] uppercase tracking-wider">Village</span>
                        <span className="font-medium text-[var(--ink)]">{patient.villageName || '-'}</span>
                    </div>
                    <div>
                        <span className="block text-xs font-semibold text-[var(--ink-light)] uppercase tracking-wider">Case Type</span>
                        <span className="font-medium text-[var(--ink)] capitalize">{patient.caseType}</span>
                    </div>
                </div>
            </div>

            {/* History List */}
            <div>
                <h3 className="font-bold text-lg mb-3 text-[var(--ink)]">Visit History</h3>
                <div className="flex flex-col gap-3">
                    {history.length === 0 ? (
                        <p className="text-sm text-[var(--ink-muted)] text-center py-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] border-dashed">No visits found.</p>
                    ) : (
                        history.map((visit, idx) => (
                            <div key={visit._id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="font-medium text-[var(--ink)]">{new Date(visit.createdAt).toLocaleDateString()}</span>
                                    <span className="text-xs text-[var(--ink-muted)]">Time: {new Date(visit.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="block text-xs font-semibold text-[var(--ink-light)]">Status</span>
                                        <span className="text-sm font-medium capitalize">{visit.status}</span>
                                    </div>
                                    {visit.tokenNumber && (
                                        <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1 flex flex-col items-center justify-center min-w-[3rem]">
                                            <span className="text-xs text-[var(--ink-muted)]">Token</span>
                                            <span className="font-bold font-mono text-[var(--ink)]">{visit.tokenNumber}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
