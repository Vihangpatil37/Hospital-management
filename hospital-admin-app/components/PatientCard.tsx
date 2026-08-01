import React from 'react';

interface PatientCardProps {
    patient: {
        _id: string;
        name?: string;
        phoneNumber: string;
        villageName?: string;
        caseNumber?: string;
        caseType: string;
        totalVisits: number;
        lastVisitDate: string;
    };
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onRegisterAgain: (id: string) => void;
}

export default function PatientCard({ patient, onView, onEdit, onRegisterAgain }: PatientCardProps) {
    const formattedDate = new Date(patient.lastVisitDate).toLocaleDateString();

    return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-[var(--ink)]">
                        {patient.caseType === 'new' ? patient.name : (patient.name || `Case #${patient.caseNumber}`)}
                    </h3>
                    <p className="text-sm text-[var(--ink-muted)] font-mono">{patient.phoneNumber}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${patient.caseType === 'new' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {patient.caseType.toUpperCase()}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-[var(--ink-muted)]">
                <div>
                    <span className="block text-xs font-semibold text-[var(--ink-light)]">Village</span>
                    <span>{patient.villageName || '-'}</span>
                </div>
                <div>
                    <span className="block text-xs font-semibold text-[var(--ink-light)]">Case Number</span>
                    <span>{patient.caseNumber || '-'}</span>
                </div>
                <div>
                    <span className="block text-xs font-semibold text-[var(--ink-light)]">Total Visits</span>
                    <span className="font-mono font-medium">{patient.totalVisits}</span>
                </div>
                <div>
                    <span className="block text-xs font-semibold text-[var(--ink-light)]">Last Visit</span>
                    <span>{formattedDate}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
                <button onClick={() => onView(patient._id)} className="btn-secondary text-sm py-1.5">View</button>
                <button onClick={() => onEdit(patient._id)} className="btn-secondary text-sm py-1.5">Edit</button>
                <button onClick={() => onRegisterAgain(patient._id)} className="btn-primary text-sm py-1.5">Register</button>
            </div>
        </div>
    );
}
