'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Plus,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'
import type { Database, WishlistStatus } from '@/lib/supabase/database.types'

type ExpenseRecord = Database['public']['Tables']['expenses']['Row']
type WishlistRecord = Database['public']['Tables']['wishlist']['Row']

const PREDEFINED_CATEGORIES = [
  'Food & groceries',
  'Transport',
  'Home & bills',
  'Health',
  'Shopping',
  'Leisure',
  'Other',
]

const STATUS_LABELS: Record<WishlistStatus, string> = {
  pending: 'Pending',
  to_buy: 'To buy',
  to_pay: 'To pay',
  done: 'Done',
}

function getLocalDate() {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export default function MoneyWiseDashboard() {
  const supabase = useMemo(() => createClient(), [])
  const [userId, setUserId] = useState<string | null>(null)
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [wishlist, setWishlist] = useState<WishlistRecord[]>([])
  const [categories, setCategories] = useState(PREDEFINED_CATEGORIES)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState(PREDEFINED_CATEGORIES[0])
  const [expenseDate, setExpenseDate] = useState(getLocalDate)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategory, setNewCategory] = useState('')

  const [itemName, setItemName] = useState('')
  const [itemAmount, setItemAmount] = useState('')
  const [itemDueDate, setItemDueDate] = useState('')
  const [itemStatus, setItemStatus] = useState<WishlistStatus>('pending')

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!authData.user) throw new Error('Your session has expired. Please sign in again.')
      setUserId(authData.user.id)

      const [expensesResult, wishlistResult, categoriesResult] = await Promise.all([
        supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
        supabase.from('wishlist').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('name').order('name'),
      ])

      if (expensesResult.error) throw new Error(`Could not load expenses: ${expensesResult.error.message}`)
      if (wishlistResult.error) throw new Error(`Could not load your list: ${wishlistResult.error.message}`)
      if (categoriesResult.error) throw new Error(`Could not load categories: ${categoriesResult.error.message}`)

      setExpenses(expensesResult.data)
      setWishlist(wishlistResult.data)
      const customCategories = categoriesResult.data.map(({ name }) => name)
      setCategories([
        ...PREDEFINED_CATEGORIES,
        ...customCategories.filter((name) => !PREDEFINED_CATEGORIES.includes(name)),
      ])
      setLoadError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load your money details.'
      setLoadError(message)
      toast.error(message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    // This initial load updates state only after its Supabase requests resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData()
  }, [fetchData])

  async function runMutation(
    action: string,
    operation: () => PromiseLike<{ error: { message: string } | null }>,
    onSuccess: () => void,
  ) {
    setBusyAction(action)
    try {
      const { error } = await operation()
      if (error) throw new Error(error.message)
      onSuccess()
      await fetchData(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'That change could not be saved.')
    } finally {
      setBusyAction(null)
    }
  }

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userId) {
      toast.error('Your session is not ready. Please refresh and try again.')
      return
    }

    const amount = Number(expenseAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter an amount greater than ₱0.')
      return
    }

    await runMutation(
      'expense',
      () => supabase.from('expenses').insert({
        user_id: userId,
        description: expenseDescription.trim(),
        amount,
        category: expenseCategory,
        expense_date: expenseDate,
      }),
      () => {
        setExpenseDescription('')
        setExpenseAmount('')
        toast.success('Expense added.')
      },
    )
  }

  async function saveCategory() {
    const name = newCategory.trim()
    if (!userId || !name) return
    if (categories.some((category) => category.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      toast.error('That category already exists.')
      return
    }

    await runMutation(
      'category',
      () => supabase.from('categories').insert({ user_id: userId, name }),
      () => {
        setExpenseCategory(name)
        setNewCategory('')
        setShowCategoryForm(false)
        toast.success('Category added.')
      },
    )
  }

  async function addWishlistItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userId) {
      toast.error('Your session is not ready. Please refresh and try again.')
      return
    }

    const amount = itemAmount ? Number(itemAmount) : null
    if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
      toast.error('Enter an amount greater than ₱0, or leave it blank.')
      return
    }

    await runMutation(
      'wishlist',
      () => supabase.from('wishlist').insert({
        user_id: userId,
        name: itemName.trim(),
        amount,
        due_date: itemDueDate || null,
        status: itemStatus,
      }),
      () => {
        setItemName('')
        setItemAmount('')
        setItemDueDate('')
        setItemStatus('pending')
        toast.success('Added to your list.')
      },
    )
  }

  async function toggleComplete(id: string, status: WishlistStatus) {
    const nextStatus: WishlistStatus = status === 'done' ? 'pending' : 'done'
    await runMutation(
      `toggle-${id}`,
      () => supabase.from('wishlist').update({ status: nextStatus }).eq('id', id),
      () => toast.success(nextStatus === 'done' ? 'Marked as done.' : 'Back on your list.'),
    )
  }

  async function deleteExpense(id: string) {
    await runMutation(
      `delete-expense-${id}`,
      () => supabase.from('expenses').delete().eq('id', id),
      () => toast.success('Expense removed.'),
    )
  }

  async function deleteWishlistItem(id: string) {
    await runMutation(
      `delete-wishlist-${id}`,
      () => supabase.from('wishlist').delete().eq('id', id),
      () => toast.success('Item removed.'),
    )
  }

  const totalExpenses = expenses.reduce((total, expense) => total + Number(expense.amount), 0)
  const openItems = wishlist.filter((item) => item.status !== 'done')
  const plannedTotal = openItems.reduce((total, item) => total + Number(item.amount ?? 0), 0)
  const completedCount = wishlist.length - openItems.length

  if (loading) {
    return (
      <div className="loading-state" role="status">
        <span className="loading-spinner" />
        <span>Getting your money in focus…</span>
      </div>
    )
  }

  return (
    <div className="dashboard-content">
      <header className="welcome-row">
        <div>
          <span className="eyebrow">YOUR MONEY, IN FOCUS</span>
          <h1>A little clarity goes a long way.</h1>
          <p>Keep track of today, and make a plan for what comes next.</p>
        </div>
        <div className="welcome-sparkle" aria-hidden="true">
          <Sparkles size={22} />
        </div>
      </header>

      {loadError && (
        <div className="load-error" role="alert">
          <span>{loadError}</span>
          <button className="text-button" onClick={() => void fetchData()}>Try again</button>
        </div>
      )}

      <section className="summary-grid" aria-label="Money summary">
        <article className="summary-card summary-card-green">
          <div className="summary-topline">
            <span className="summary-icon"><ReceiptText size={18} /></span>
            <span className="summary-label">Expenses tracked</span>
            <ArrowDownRight className="summary-trend" size={17} />
          </div>
          <p className="summary-value">{formatCurrency(totalExpenses)}</p>
          <p className="summary-caption">{expenses.length} {expenses.length === 1 ? 'entry' : 'entries'} so far</p>
        </article>
        <article className="summary-card">
          <div className="summary-topline">
            <span className="summary-icon summary-icon-peach"><ShoppingBag size={18} /></span>
            <span className="summary-label">Still on your list</span>
            <ArrowUpRight className="summary-trend summary-trend-muted" size={17} />
          </div>
          <p className="summary-value">{openItems.length} <span className="summary-unit">{openItems.length === 1 ? 'item' : 'items'}</span></p>
          <p className="summary-caption">Things to buy, pay, or remember</p>
        </article>
        <article className="summary-card">
          <div className="summary-topline">
            <span className="summary-icon summary-icon-lilac"><CheckCircle2 size={18} /></span>
            <span className="summary-label">Planned amount</span>
            <span className="summary-period">OPEN LIST</span>
          </div>
          <p className="summary-value">{formatCurrency(plannedTotal)}</p>
          <p className="summary-caption">{completedCount} {completedCount === 1 ? 'thing' : 'things'} checked off</p>
        </article>
      </section>

      <div className="workspace-grid">
        <section className="workspace-panel expenses-panel" aria-labelledby="expenses-heading">
          <div className="panel-heading">
            <div className="panel-heading-icon expense-heading-icon"><ReceiptText size={19} /></div>
            <div>
              <span className="panel-kicker">LOOKING BACK</span>
              <h2 id="expenses-heading">Expenses</h2>
            </div>
            <span className="panel-count">{expenses.length}</span>
          </div>

          <form className="entry-form" onSubmit={addExpense}>
            <label className="field-label" htmlFor="expense-description">What did you spend on?</label>
            <input
              id="expense-description"
              className="text-input"
              placeholder="e.g. Lunch with friends"
              maxLength={160}
              value={expenseDescription}
              onChange={(event) => setExpenseDescription(event.target.value)}
              required
            />
            <div className="form-grid form-grid-expense">
              <div>
                <label className="field-label" htmlFor="expense-amount">Amount</label>
                <div className="amount-input">
                  <span aria-hidden="true">₱</span>
                  <input
                    id="expense-amount"
                    inputMode="decimal"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(event) => setExpenseAmount(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="expense-date">Date</label>
                <div className="date-input">
                  <CalendarDays size={16} aria-hidden="true" />
                  <input
                    id="expense-date"
                    type="date"
                    value={expenseDate}
                    onChange={(event) => setExpenseDate(event.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="field-label-row">
                <label className="field-label" htmlFor="expense-category">Category</label>
                <button
                  className="text-button category-toggle"
                  type="button"
                  onClick={() => setShowCategoryForm(!showCategoryForm)}
                >
                  {showCategoryForm ? 'Cancel' : '+ New category'}
                </button>
              </div>
              <div className="select-input">
                <Tag size={16} aria-hidden="true" />
                <select
                  id="expense-category"
                  value={expenseCategory}
                  onChange={(event) => setExpenseCategory(event.target.value)}
                >
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              {showCategoryForm && (
                <div className="new-category-row">
                  <input
                    className="text-input"
                    aria-label="New category name"
                    placeholder="Give it a name"
                    maxLength={40}
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void saveCategory()
                      }
                    }}
                  />
                  <button
                    className="icon-action save-category"
                    type="button"
                    aria-label="Save category"
                    disabled={busyAction !== null || !newCategory.trim()}
                    onClick={() => void saveCategory()}
                  >
                    <Check size={17} />
                  </button>
                </div>
              )}
            </div>
            <button className="button button-green add-entry-button" type="submit" disabled={busyAction !== null}>
              <Plus size={17} />
              {busyAction === 'expense' ? 'Adding expense…' : 'Add expense'}
            </button>
          </form>

          <div className="list-heading">
            <h3>Recent spending</h3>
            <span>{formatCurrency(totalExpenses)} total</span>
          </div>
          {expenses.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon"><ReceiptText size={19} /></span>
              <p>No expenses yet</p>
              <span>Your first entry will show up here.</span>
            </div>
          ) : (
            <ul className="entry-list" aria-label="Recent expenses">
              {expenses.map((expense) => (
                <li className="expense-row" key={expense.id}>
                  <span className="expense-row-icon"><ReceiptText size={17} /></span>
                  <div className="expense-row-copy">
                    <span className="expense-name">{expense.description}</span>
                    <span className="expense-meta">{expense.category}<span aria-hidden="true">·</span>{formatDate(expense.expense_date)}</span>
                  </div>
                  <span className="expense-value">−{formatCurrency(expense.amount)}</span>
                  <button
                    className="icon-action delete-action"
                    type="button"
                    aria-label={`Delete ${expense.description}`}
                    title="Remove expense"
                    disabled={busyAction !== null}
                    onClick={() => void deleteExpense(expense.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="workspace-panel list-panel" aria-labelledby="list-heading">
          <div className="panel-heading">
            <div className="panel-heading-icon list-heading-icon"><ShoppingBag size={19} /></div>
            <div>
              <span className="panel-kicker">LOOKING AHEAD</span>
              <h2 id="list-heading">To Buy / To Pay</h2>
            </div>
            <span className="panel-count panel-count-peach">{openItems.length}</span>
          </div>

          <form className="entry-form" onSubmit={addWishlistItem}>
            <label className="field-label" htmlFor="list-item-name">What’s on your mind?</label>
            <input
              id="list-item-name"
              className="text-input"
              placeholder="e.g. Internet bill, new running shoes"
              maxLength={160}
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              required
            />
            <div className="form-grid form-grid-list">
              <div>
                <label className="field-label" htmlFor="list-item-amount">Amount <span className="optional-label">optional</span></label>
                <div className="amount-input">
                  <span aria-hidden="true">₱</span>
                  <input
                    id="list-item-amount"
                    inputMode="decimal"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Leave blank"
                    value={itemAmount}
                    onChange={(event) => setItemAmount(event.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="list-item-due">Due date <span className="optional-label">optional</span></label>
                <div className="date-input">
                  <CalendarDays size={16} aria-hidden="true" />
                  <input
                    id="list-item-due"
                    type="date"
                    value={itemDueDate}
                    onChange={(event) => setItemDueDate(event.target.value)}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="list-item-status">Add it as</label>
              <div className="select-input">
                <Clock3 size={16} aria-hidden="true" />
                <select
                  id="list-item-status"
                  value={itemStatus}
                  onChange={(event) => setItemStatus(event.target.value as WishlistStatus)}
                >
                  <option value="pending">Pending</option>
                  <option value="to_buy">To buy</option>
                  <option value="to_pay">To pay</option>
                </select>
              </div>
            </div>
            <button className="button button-peach add-entry-button" type="submit" disabled={busyAction !== null}>
              <Plus size={17} />
              {busyAction === 'wishlist' ? 'Adding to list…' : 'Add to my list'}
            </button>
          </form>

          <div className="list-heading">
            <h3>Your notepad</h3>
            <span>{completedCount} done</span>
          </div>
          {wishlist.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon empty-state-peach"><ShoppingBag size={19} /></span>
              <p>A little note to future you</p>
              <span>Bills, plans, and nice-to-haves all fit here.</span>
            </div>
          ) : (
            <ul className="entry-list notepad-list" aria-label="To buy and to pay items">
              {wishlist.map((item) => {
                const isDone = item.status === 'done'
                return (
                  <li className={`wishlist-row${isDone ? ' wishlist-row-done' : ''}`} key={item.id}>
                    <button
                      className={`complete-button${isDone ? ' complete-button-done' : ''}`}
                      type="button"
                      aria-label={isDone ? `Mark ${item.name} incomplete` : `Mark ${item.name} complete`}
                      aria-pressed={isDone}
                      disabled={busyAction !== null}
                      onClick={() => void toggleComplete(item.id, item.status)}
                    >
                      {isDone ? <CheckCircle2 size={19} /> : <Circle size={19} />}
                    </button>
                    <div className="wishlist-row-copy">
                      <span className={`wishlist-name${isDone ? ' wishlist-name-done' : ''}`}>{item.name}</span>
                      <span className="wishlist-meta">
                        {item.amount !== null && <span>{formatCurrency(item.amount)}</span>}
                        {item.due_date && <span><CalendarDays size={12} />{formatDate(item.due_date)}</span>}
                      </span>
                    </div>
                    <span className={`status-pill status-${item.status}`}>{STATUS_LABELS[item.status]}</span>
                    <button
                      className="icon-action delete-action"
                      type="button"
                      aria-label={`Delete ${item.name}`}
                      title="Remove item"
                      disabled={busyAction !== null}
                      onClick={() => void deleteWishlistItem(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <footer className="dashboard-footer">
        <span><Sparkles size={14} /> Small steps add up.</span>
        <span>All amounts in Philippine pesos</span>
      </footer>
    </div>
  )
}
