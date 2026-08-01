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

      <div className="mt-12 space-y-4 text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[var(--border)]"></span>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-[var(--surface)] px-2 text-[var(--ink-muted)]">Already Registered?</span>
          </div>
        </div>
        <Link href="/checkin" className="btn-secondary w-full justify-center">
          I have arrived (Get Token)
        </Link>
      </div>
    </div>
  );
}
