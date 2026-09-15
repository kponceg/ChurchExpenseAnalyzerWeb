import Link from "next/link";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <p className="brand">Church Finance</p>
        <nav className="nav" aria-label="Primary navigation">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/transactions/new">Record income</Link>
          <Link href="/reports">Reports</Link>
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
