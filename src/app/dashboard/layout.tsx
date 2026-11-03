import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Wallet } from 'lucide-react'

export default async function MoneyWiseDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="app-shell">
      <nav className="app-nav" aria-label="Main navigation">
        <div className="nav-inner">
          <Link href="/dashboard" className="brand-lockup" aria-label="MoneyWise dashboard">
            <span className="brand-mark"><Wallet size={18} strokeWidth={2.2} /></span>
            <span>moneywise</span>
          </Link>
          <div className="nav-account">
            <span className="user-avatar" aria-hidden="true">
              {user.email?.slice(0, 1).toUpperCase() ?? 'M'}
            </span>
            <span className="nav-divider" aria-hidden="true" />
            <form action="/auth/signout" method="post">
              <button type="submit" className="signout-button">
                <LogOut size={15} />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="page-shell">
        {children}
      </main>
    </div>
  )
}
