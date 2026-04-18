import { useEffect, useMemo, useState } from 'react'
import './App.css'
import ForecastChart from './components/ForecastChart'
import ForecastSummaryCards from './components/ForecastSummaryCards'
import { runForecast } from './lib/forecast'
import {
  loadExpenses,
  loadInvoices,
  loadProfile,
  saveExpenses,
  saveInvoices,
  saveProfile,
} from './lib/storage'

const invoiceStatusOptions = ['pending', 'overdue', 'paid']
const expenseFrequencyOptions = ['weekly', 'monthly']

const fallbackCurrencyOptions = ['EUR', 'GBP', 'JPY', 'SGD', 'USD']

function getCurrencyOptions() {
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('currency')
  }

  return fallbackCurrencyOptions
}

function createInvoiceDraft() {
  return {
    amount: '',
    clientName: '',
    dueDate: '',
    expectedPaymentDate: '',
    issueDate: '',
    notes: '',
    projectName: '',
    status: 'pending',
  }
}

function createExpenseDraft() {
  return {
    amount: '',
    category: '',
    frequency: 'monthly',
    name: '',
    startDate: '',
  }
}

function formatCurrency(amount, currency) {
  if (!Number.isFinite(amount)) {
    return '--'
  }

  return new Intl.NumberFormat('en-US', {
    currency,
    style: 'currency',
  }).format(amount)
}

function formatDate(dateString) {
  if (!dateString) {
    return '--'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${dateString}T00:00:00`))
}

function App() {
  const currencyOptions = useMemo(getCurrencyOptions, [])
  const [profile, setProfile] = useState(() => loadProfile())
  const [invoices, setInvoices] = useState(() => loadInvoices())
  const [expenses, setExpenses] = useState(() => loadExpenses())
  const [invoiceDraft, setInvoiceDraft] = useState(createInvoiceDraft)
  const [expenseDraft, setExpenseDraft] = useState(createExpenseDraft)
  const [profileMessage, setProfileMessage] = useState('')
  const [invoiceMessage, setInvoiceMessage] = useState('')
  const [expenseMessage, setExpenseMessage] = useState('')

  useEffect(() => {
    saveProfile(profile)
  }, [profile])

  useEffect(() => {
    saveInvoices(invoices)
  }, [invoices])

  useEffect(() => {
    saveExpenses(expenses)
  }, [expenses])

  const activeCurrency = profile.currency || 'GBP'
  const minimumBuffer = Number(profile.minimumBuffer)
  const startingBalance = Number(profile.startingBalance)
  const unpaidInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status !== 'paid'),
    [invoices],
  )

  const forecast = useMemo(
    () =>
      runForecast({
        expenses,
        invoices: unpaidInvoices,
        profile,
        weeks: 12,
      }),
    [expenses, profile, unpaidInvoices],
  )

  const forecastSummary = useMemo(() => {
    if (!forecast.rows.length) {
      return 'Add a profile, some invoices, and recurring expenses to generate the 12-week forecast.'
    }

    if (!forecast.firstRiskyWeek) {
      return `Your balance stays above the safety buffer for all ${forecast.rows.length} forecast weeks.`
    }

    if (forecast.lowestPoint?.belowZero) {
      return `Your balance first drops into danger in ${forecast.firstRiskyWeek.label}, and the lowest projected balance is ${formatCurrency(forecast.lowestBalance, activeCurrency)} on ${forecast.lowestPoint.weekStart}.`
    }

    return `Your balance first drops below the minimum buffer in ${forecast.firstRiskyWeek.label}, and the lowest projected balance is ${formatCurrency(forecast.lowestBalance, activeCurrency)} on ${forecast.lowestPoint?.weekStart}.`
  }, [activeCurrency, forecast])

  function handleProfileChange(event) {
    const { name, value } = event.target
    setProfile((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleSaveProfile(event) {
    event.preventDefault()
    const startingBalance = Number(profile.startingBalance)
    const minimumBuffer = Number(profile.minimumBuffer)

    if (!Number.isFinite(startingBalance) || !Number.isFinite(minimumBuffer)) {
      setProfileMessage('Enter valid profile numbers before forecasting.')
      return
    }

    setProfileMessage('Profile saved. Forecast will now use this balance and buffer.')
  }

  function handleInvoiceDraftChange(event) {
    const { name, value } = event.target
    setInvoiceDraft((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleExpenseDraftChange(event) {
    const { name, value } = event.target
    setExpenseDraft((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleAddInvoice(event) {
    event.preventDefault()

    const amount = Number(invoiceDraft.amount)
    if (
      !invoiceDraft.clientName.trim() ||
      !invoiceDraft.projectName.trim() ||
      !invoiceDraft.issueDate ||
      !invoiceDraft.dueDate ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setInvoiceMessage('Complete the invoice fields with valid values.')
      return
    }

    const nextInvoice = {
      ...invoiceDraft,
      amount,
      currency: activeCurrency,
      id: crypto.randomUUID(),
    }

    setInvoices((current) => [nextInvoice, ...current])
    setInvoiceDraft(createInvoiceDraft())
    setInvoiceMessage(`Invoice added in ${activeCurrency}.`)
  }

  function handleAddExpense(event) {
    event.preventDefault()

    const amount = Number(expenseDraft.amount)
    if (
      !expenseDraft.name.trim() ||
      !expenseDraft.startDate ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setExpenseMessage('Complete the expense fields with valid values.')
      return
    }

    const nextExpense = {
      ...expenseDraft,
      amount,
      id: crypto.randomUUID(),
    }

    setExpenses((current) => [nextExpense, ...current])
    setExpenseDraft(createExpenseDraft())
    setExpenseMessage('Recurring expense added.')
  }

  function handleDeleteInvoice(id) {
    setInvoices((current) => current.filter((invoice) => invoice.id !== id))
  }

  function handleDeleteExpense(id) {
    setExpenses((current) => current.filter((expense) => expense.id !== id))
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Phase 3B</p>
          <h1>CashGap AI forecast dashboard</h1>
          <p className="hero-text">
            This version turns the forecast math into something you can read in a
            few seconds: balances, trend, first danger week, and the worst point
            in the next 12 weeks.
          </p>
        </div>
        <div className="hero-note">
          <strong>Dashboard focus</strong>
          <ul>
            <li>Top cards show the numbers that matter most.</li>
            <li>The chart makes the balance trend visible immediately.</li>
            <li>Yellow means below buffer and red means below zero.</li>
            <li>The table stays as the detailed audit view.</li>
          </ul>
        </div>
      </header>

      <ForecastSummaryCards
        currencyFormatter={(amount) => formatCurrency(amount, activeCurrency)}
        currentBalance={startingBalance}
        forecast={forecast}
        minimumBuffer={minimumBuffer}
      />

      <section className="panel narrative-panel">
        <p>{forecastSummary}</p>
      </section>

      <ForecastChart data={forecast.rows} minimumBuffer={minimumBuffer} />

      <section className="workspace-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>Profile</h2>
            <p>Set one balance, one buffer, and one currency for the MVP.</p>
          </div>
          <form className="form-grid" onSubmit={handleSaveProfile}>
            <label>
              Starting balance
              <input
                name="startingBalance"
                onChange={handleProfileChange}
                step="0.01"
                type="number"
                value={profile.startingBalance}
              />
            </label>
            <label>
              Minimum buffer
              <input
                name="minimumBuffer"
                onChange={handleProfileChange}
                step="0.01"
                type="number"
                value={profile.minimumBuffer}
              />
            </label>
            <label>
              Currency
              <select name="currency" onChange={handleProfileChange} value={profile.currency}>
                {currencyOptions.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit">
              Save profile
            </button>
          </form>
          {profileMessage ? <p className="helper-text">{profileMessage}</p> : null}
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Invoices</h2>
            <p>Add only your own test invoices for forecast accuracy.</p>
          </div>
          <form className="form-grid" onSubmit={handleAddInvoice}>
            <label>
              Client
              <input
                name="clientName"
                onChange={handleInvoiceDraftChange}
                value={invoiceDraft.clientName}
              />
            </label>
            <label>
              Project
              <input
                name="projectName"
                onChange={handleInvoiceDraftChange}
                value={invoiceDraft.projectName}
              />
            </label>
            <label>
              Amount ({activeCurrency})
              <input
                name="amount"
                onChange={handleInvoiceDraftChange}
                step="0.01"
                type="number"
                value={invoiceDraft.amount}
              />
            </label>
            <label>
              Issue date
              <input
                name="issueDate"
                onChange={handleInvoiceDraftChange}
                type="date"
                value={invoiceDraft.issueDate}
              />
            </label>
            <label>
              Due date
              <input
                name="dueDate"
                onChange={handleInvoiceDraftChange}
                type="date"
                value={invoiceDraft.dueDate}
              />
            </label>
            <label>
              Expected payment date
              <input
                name="expectedPaymentDate"
                onChange={handleInvoiceDraftChange}
                type="date"
                value={invoiceDraft.expectedPaymentDate}
              />
            </label>
            <label>
              Status
              <select name="status" onChange={handleInvoiceDraftChange} value={invoiceDraft.status}>
                {invoiceStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-width">
              Notes
              <input
                name="notes"
                onChange={handleInvoiceDraftChange}
                value={invoiceDraft.notes}
              />
            </label>
            <button className="primary-button" type="submit">
              Add invoice
            </button>
          </form>
          {invoiceMessage ? <p className="helper-text">{invoiceMessage}</p> : null}
          <div className="list-block">
            {invoices.length ? (
              invoices.map((invoice) => (
                <div className="list-row" key={invoice.id}>
                  <div>
                    <strong>{invoice.clientName}</strong>
                    <p>
                      {invoice.projectName} · {invoice.status} ·{' '}
                      {formatCurrency(Number(invoice.amount), activeCurrency)}
                    </p>
                    <p>
                      Forecast date: {formatDate(invoice.expectedPaymentDate || invoice.dueDate)}
                    </p>
                  </div>
                  <button
                    className="ghost-button"
                    onClick={() => handleDeleteInvoice(invoice.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-copy">No invoices yet. Add your own test invoices here.</p>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Recurring expenses</h2>
            <p>Weekly and monthly expenses repeat automatically over the next 12 weeks.</p>
          </div>
          <form className="form-grid" onSubmit={handleAddExpense}>
            <label>
              Expense name
              <input name="name" onChange={handleExpenseDraftChange} value={expenseDraft.name} />
            </label>
            <label>
              Category
              <input
                name="category"
                onChange={handleExpenseDraftChange}
                value={expenseDraft.category}
              />
            </label>
            <label>
              Amount ({activeCurrency})
              <input
                name="amount"
                onChange={handleExpenseDraftChange}
                step="0.01"
                type="number"
                value={expenseDraft.amount}
              />
            </label>
            <label>
              Frequency
              <select
                name="frequency"
                onChange={handleExpenseDraftChange}
                value={expenseDraft.frequency}
              >
                {expenseFrequencyOptions.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Start date
              <input
                name="startDate"
                onChange={handleExpenseDraftChange}
                type="date"
                value={expenseDraft.startDate}
              />
            </label>
            <button className="primary-button" type="submit">
              Add expense
            </button>
          </form>
          {expenseMessage ? <p className="helper-text">{expenseMessage}</p> : null}
          <div className="list-block">
            {expenses.length ? (
              expenses.map((expense) => (
                <div className="list-row" key={expense.id}>
                  <div>
                    <strong>{expense.name}</strong>
                    <p>
                      {expense.frequency} · {formatCurrency(Number(expense.amount), activeCurrency)}
                    </p>
                    <p>Starts {formatDate(expense.startDate)}</p>
                  </div>
                  <button
                    className="ghost-button"
                    onClick={() => handleDeleteExpense(expense.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-copy">No recurring expenses yet.</p>
            )}
          </div>
        </article>
      </section>

      <section className="panel forecast-panel">
        <div className="panel-header">
          <h2>12-week forecast</h2>
          <p>
            Yellow means below your safe buffer. Red means below zero. This table
            is the current intelligence loop for the MVP.
          </p>
        </div>
        <div className="forecast-meta">
          <div>
            <span>Weeks still safe</span>
            <strong>{forecast.safeWeeks}</strong>
          </div>
          <div>
            <span>First risky week</span>
            <strong>
              {forecast.firstRiskyWeek
                ? `${forecast.firstRiskyWeek.label} · ${forecast.firstRiskyWeek.weekStart}`
                : 'None'}
            </strong>
          </div>
          <div>
            <span>Lowest balance</span>
            <strong>
              {formatCurrency(forecast.lowestBalance, activeCurrency)}
              {forecast.lowestPoint ? ` · ${forecast.lowestPoint.weekStart}` : ''}
            </strong>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Range</th>
                <th>Start</th>
                <th>Inflow</th>
                <th>Expenses</th>
                <th>End</th>
                <th>Risk</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {forecast.rows.map((row) => (
                <tr className={`risk-${row.riskLevel}`} key={row.weekStart}>
                  <td>{row.weekLabel}</td>
                  <td>
                    {formatDate(row.weekStart)} to {formatDate(row.weekEnd)}
                  </td>
                  <td>{formatCurrency(row.startingBalance, activeCurrency)}</td>
                  <td>{formatCurrency(row.invoiceInflow, activeCurrency)}</td>
                  <td>{formatCurrency(row.expenseOutflow, activeCurrency)}</td>
                  <td>{formatCurrency(row.endingBalance, activeCurrency)}</td>
                  <td>{row.riskLevel}</td>
                  <td>
                    {row.belowZero
                      ? 'Below Zero'
                      : row.belowBuffer
                        ? 'Below Buffer'
                        : 'Safe'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default App
