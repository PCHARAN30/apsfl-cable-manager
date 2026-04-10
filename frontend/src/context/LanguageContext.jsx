import { createContext, useContext } from 'react'

const LanguageContext = createContext()

const en = {
    // Auth
    loginTitle: 'Login',
    loginBtn: 'Login',
    username: 'Username',
    password: 'Password',
    loginSuccess: 'Logged in successfully',
    loginFailed: 'Login failed',
    // Nav
    dashboard: 'Dashboard',
    customers: 'Customers',
    payments: 'Payments',
    importCSV: 'Import CSV',
    logout: 'Logout',
    searchCAF: 'Search CAF',
    collection: 'Collection',
    reports: 'Reports',
    inventory: 'Inventory (CPE)',
    services: 'Services',
    // Dashboard
    totalCustomers: 'Total Customers',
    toReceive: 'To Receive',
    todaysIncome: "Today's Income",
    monthlyIncome: 'Monthly Income',
    paid: 'Paid',
    unpaid: 'Unpaid',
    partial: 'Partial',
    activeSubscriptions: 'Active subscriptions',
    needToCollect: 'Need to collect',
    balancePending: 'Balance pending',
    incomeThisMonth: 'Income This Month',
    expiringIn7Days: 'Expiring in 7 days',
    collectionProgress: 'Collection Progress',
    collected: 'collected',
    allGood: 'All good 👍',
    noPayments: 'No payments recorded yet',
    resetDashboard: 'Reset Dashboard',
    resetConfirm: 'This will mark ALL customers as UNPAID and clear all payment history. Are you sure?',
    resetSuccess: 'Dashboard reset successfully',
    // Customers
    addCustomer: 'Add Customer',
    totalRecords: 'total records',
    searchPlaceholder: 'Search by name, CAF number or phone...',
    name: 'Name',
    cafNumber: 'CAF Number',
    phone: 'Phone',
    address: 'Address',
    plan: 'Plan (₹)',
    status: 'Status',
    paidOn: 'Paid On',
    validTill: 'Valid Till',
    balance: 'Balance',
    actions: 'Actions',
    pay: 'Pay',
    noCustomers: 'No customers found',
    // Payment Modal
    paymentType: 'Payment Type',
    fullPaid: 'Full Paid',
    monthsPaid: 'Months Paid',
    amountPaid: 'Amount Paid',
    paymentMethod: 'Payment Method',
    ponNumber: 'PON Number',
    cancel: 'Cancel',
    confirm: 'Confirm',
    carryOver: 'Carry-over balance from last month',
    carryOverNext: 'Carry-over next month',
    // Import
    importCustomers: 'Import Customers',
    uploadSubtitle: 'Upload APSFL export — CSV, Excel, or TXT',
    expectedColumns: 'Expected Columns',
    dropFile: 'Drop file here or click to browse',
    importing: 'Importing...',
    importBtn: '⬆️  Import Customers',
    importResult: 'Import Result',
    totalRows: 'Total Rows',
    imported: 'Imported',
    skipped: 'Skipped',
    upToDate: 'Up to Date',
    howToExport: 'How to export from APSFL',
    // Payments
    paymentHistory: 'Payment History',
    type: 'Type',
    amount: 'Amount',
    months: 'Months',
    customer: 'Customer',
    from: 'From',
    to: 'To',
    filter: 'Filter',
    clear: 'Clear',
    total: 'Total',
    noPaymentRecords: 'No payment records found',
    // Add Customer
    customerName: 'Customer Name *',
    cafNumberLabel: 'CAF Number *',
    phoneNumber: 'Phone Number',
    monthlyPlan: 'Monthly Plan Amount (₹)',
    notesLabel: 'Notes',
    connectionDate: 'Date of Connection',
    adding: 'Adding...',
    addBtn: 'Add Customer',
    paidThisMonth: '% paid this month',
    closeBtn: 'Close',
    paymentHistoryFor: 'Payment History for',
    noHistoryFound: 'No history found for this customer.',
    editCustomer: 'Edit Customer',
    saveChanges: 'Save Changes',
    updating: 'Updating...',
    edit: 'Edit',
}

export function LanguageProvider({ children }) {
  const t = (key) => en[key] || key

  return (
    <LanguageContext.Provider value={{ t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
