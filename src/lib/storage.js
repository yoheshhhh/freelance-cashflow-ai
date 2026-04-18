const STORAGE_KEYS = {
  expenses: 'cashgap.expenses',
  invoices: 'cashgap.invoices',
  profile: 'cashgap.profile',
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readJson(key, fallback) {
  if (!canUseStorage()) {
    return fallback
  }

  const value = window.localStorage.getItem(key)
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value)
  } catch {
    window.localStorage.removeItem(key)
    return fallback
  }
}

function writeJson(key, value) {
  if (canUseStorage()) {
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}

export function loadProfile() {
  return readJson(STORAGE_KEYS.profile, {
    currency: 'GBP',
    minimumBuffer: '',
    startingBalance: '',
  })
}

export function saveProfile(profile) {
  writeJson(STORAGE_KEYS.profile, profile)
}

export function loadInvoices() {
  return readJson(STORAGE_KEYS.invoices, [])
}

export function saveInvoices(invoices) {
  writeJson(STORAGE_KEYS.invoices, invoices)
}

export function loadExpenses() {
  return readJson(STORAGE_KEYS.expenses, [])
}

export function saveExpenses(expenses) {
  writeJson(STORAGE_KEYS.expenses, expenses)
}
