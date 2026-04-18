function startOfWeek(date) {
  const next = new Date(date)
  const day = next.getDay()
  const diff = day === 0 ? -6 : 1 - day
  next.setDate(next.getDate() + diff)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfWeek(date) {
  const next = new Date(date)
  next.setDate(next.getDate() + 6)
  next.setHours(23, 59, 59, 999)
  return next
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addWeeks(date, weeks) {
  return addDays(date, weeks * 7)
}

function createDateKey(date) {
  return date.toISOString().slice(0, 10)
}

function parseDate(dateString) {
  return new Date(`${dateString}T00:00:00`)
}

function createMonthlyOccurrence(baseDate, monthOffset) {
  const anchorDay = baseDate.getDate()
  const target = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(anchorDay, lastDay))
  target.setHours(0, 0, 0, 0)
  return target
}

function buildExpenseOccurrences(expense, forecastStart, forecastEnd) {
  const occurrences = []
  const baseDate = parseDate(expense.startDate)

  if (Number.isNaN(baseDate.getTime())) {
    return occurrences
  }

  if (expense.frequency === 'weekly') {
    let current = baseDate
    while (current <= forecastEnd) {
      if (current >= forecastStart) {
        occurrences.push(current)
      }
      current = addWeeks(current, 1)
    }
    return occurrences
  }

  let monthOffset = 0
  let current = baseDate
  while (current <= forecastEnd) {
    if (current >= forecastStart) {
      occurrences.push(current)
    }
    monthOffset += 1
    current = createMonthlyOccurrence(baseDate, monthOffset)
  }
  return occurrences
}

function buildExpenseEvents(expenses, forecastStart, forecastEnd) {
  return expenses.flatMap((expense) =>
    buildExpenseOccurrences(expense, forecastStart, forecastEnd).map((occurrence) => ({
      amount: Number(expense.amount),
      category: expense.category,
      frequency: expense.frequency,
      name: expense.name,
      occurrenceDate: createDateKey(occurrence),
    })),
  )
}

function classifyRisk(balance, minimumBuffer) {
  if (balance < 0) {
    return 'critical'
  }
  if (balance < minimumBuffer) {
    return 'warning'
  }
  return 'safe'
}

export function runForecast({ expenses, invoices, profile, weeks = 12 }) {
  const startingBalance = Number(profile.startingBalance)
  const minimumBuffer = Number(profile.minimumBuffer)

  if (!Number.isFinite(startingBalance) || !Number.isFinite(minimumBuffer)) {
    return {
      firstRiskyWeek: null,
      lowestBalance: null,
      rows: [],
      safeWeeks: 0,
    }
  }

  const forecastStart = startOfWeek(new Date())
  const forecastEnd = endOfWeek(addWeeks(forecastStart, weeks - 1))
  const expenseEvents = buildExpenseEvents(expenses, forecastStart, forecastEnd)

  let runningBalance = startingBalance
  let lowestBalance = startingBalance
  let lowestPoint = null
  let firstRiskyWeek = null
  let safeWeeks = 0

  const rows = Array.from({ length: weeks }, (_, index) => {
    const weekStart = addWeeks(forecastStart, index)
    const weekEnd = endOfWeek(weekStart)
    const weekStartKey = createDateKey(weekStart)
    const weekEndKey = createDateKey(weekEnd)

    const weekInvoices = invoices.filter((invoice) => {
      if (invoice.status === 'paid') {
        return false
      }

      const targetDate = invoice.expectedPaymentDate || invoice.dueDate
      return targetDate >= weekStartKey && targetDate <= weekEndKey
    })

    const weekExpenses = expenseEvents.filter(
      (expense) => expense.occurrenceDate >= weekStartKey && expense.occurrenceDate <= weekEndKey,
    )

    const startingWeekBalance = runningBalance
    const invoiceInflow = weekInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0)
    const expenseOutflow = weekExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    runningBalance = startingWeekBalance + invoiceInflow - expenseOutflow

    const riskLevel = classifyRisk(runningBalance, minimumBuffer)

    if (riskLevel === 'safe') {
      safeWeeks += 1
    }

    if (!firstRiskyWeek && riskLevel !== 'safe') {
      firstRiskyWeek = {
        label: `Week ${index + 1}`,
        weekStart: weekStartKey,
        riskLevel,
        weekEnd: weekEndKey,
      }
    }

    lowestBalance = Math.min(lowestBalance, runningBalance)

    const row = {
      balance: runningBalance,
      belowBuffer: riskLevel === 'warning' || riskLevel === 'critical',
      belowZero: riskLevel === 'critical',
      endingBalance: runningBalance,
      expenseOutflow,
      expenses: weekExpenses,
      inflow: invoiceInflow,
      invoiceInflow,
      invoices: weekInvoices,
      outflow: expenseOutflow,
      riskLevel,
      startingBalance: startingWeekBalance,
      weekEnd: weekEndKey,
      weekLabel: `Week ${index + 1}`,
      weekStart: weekStartKey,
    }

    if (!lowestPoint || row.endingBalance < lowestPoint.endingBalance) {
      lowestPoint = row
    }

    return row
  })

  return {
    firstRiskyWeek,
    lowestBalance,
    lowestPoint,
    rows,
    safeWeeks,
  }
}
