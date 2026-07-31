import RegistrationForm from '@/components/RegistrationForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewCasePage() {
  return (
    <div className="p-6">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </Link>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">New Case</h1>
        <p className="text-[var(--ink-muted)]">Please fill in your details to register</p>
      </div>

      <RegistrationForm caseType="new" />
    </div>
  );
}
