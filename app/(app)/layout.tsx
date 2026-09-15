import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/navigation/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="shell">
      <aside className="sidebar">
        <p className="brand">Church Finance</p>
        <nav className="nav" aria-label="Primary navigation">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/transactions/new">Record income</Link>
          <Link href="/reports">Reports</Link>
        </nav>
        <div className="account-summary"><span>Signed in as</span><strong>{user.email}</strong><SignOutButton /></div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
