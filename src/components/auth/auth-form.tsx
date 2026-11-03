'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type AuthFormProps = {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const isSignup = mode === 'signup'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })

        if (error) throw error

        if (data.session) {
          toast.success('Your account is ready.')
          router.replace('/dashboard')
          router.refresh()
        } else {
          toast.success('Account created. Sign in to continue.')
          router.replace('/login')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) throw error

        toast.success('Welcome back.')
        router.replace('/dashboard')
        router.refresh()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link href="/" className="brand-lockup" aria-label="MoneyWise home">
          <span className="brand-mark"><Wallet size={19} strokeWidth={2.2} /></span>
          <span>moneywise</span>
        </Link>

        <div className="auth-copy">
          <span className="eyebrow">{isSignup ? 'A clearer money routine' : 'Your money, in focus'}</span>
          <h1 id="auth-title">{isSignup ? 'Start with a fresh page.' : 'Good to see you again.'}</h1>
          <p>
            {isSignup
              ? 'Make room for the things you want and the bills you need to remember.'
              : 'Sign in to pick up right where your budget left off.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="email">Email address</label>
          <div className="input-with-icon">
            <Mail size={17} aria-hidden="true" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <label className="field-label" htmlFor="password">Password</label>
          <div className="input-with-icon">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isSignup ? 8 : undefined}
              required
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <button className="button button-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : 'New to MoneyWise?'}{' '}
          <Link href={isSignup ? '/login' : '/signup'}>
            {isSignup ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
        <p className="auth-footnote">Private by design. Your data stays yours.</p>
      </section>
      <aside className="auth-aside" aria-hidden="true">
        <div className="aside-glow" />
        <div className="aside-note">
          <span className="aside-kicker">A little more clarity</span>
          <p>Every peso has a place.<br />Every plan has a next step.</p>
          <div className="aside-decoration">
            <span className="decoration-dot" />
            <span className="decoration-line" />
            <span className="decoration-dot decoration-dot-muted" />
          </div>
          <span className="aside-caption">Spend thoughtfully. Plan confidently.</span>
        </div>
        <span className="aside-version">MONEYWISE · PERSONAL FINANCE</span>
      </aside>
    </main>
  )
}
