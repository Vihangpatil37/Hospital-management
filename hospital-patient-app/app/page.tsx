import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen p-6 justify-center">
      <div className="space-y-2 mb-10 text-center">
        <h1 className="text-2xl font-bold tracking-tight">OPD Registration</h1>
        <p className="text-[var(--ink-muted)]">Select your case type to begin</p>
      </div>

      <div className="space-y-4">
        <Link href="/register/new" className="btn-primary">
          New Case
        </Link>
        <Link href="/register/old" className="btn-secondary">
          Old Case (Follow up)
        </Link>
      </div>
    </div>
  );
}
