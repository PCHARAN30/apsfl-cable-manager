import { createContext, useContext } from 'react'

const LanguageContext = createContext()

const en = {
    // Auth
    loginTitle: 'Login',
    loginBtn: 'Login',
    username: 'Username',
    password: 'Password',
    loginSuccess: 'Login Success',
    loginFailed: 'Wrong Username or Password',
    // Nav
    dashboard: 'Home',
    customers: 'Customers',
    payments: 'Bill Entry',
    importCSV: 'Add Many',
    logout: 'Logout',
    searchCAF: 'Find Customer',
    collection: 'Money Received',
    reports: 'Reports',
    inventory: 'Stock (CPE)',
    services: 'Services',
    // Dashboard
    totalCustomers: 'All Customers',
    toReceive: 'Money Pending',
    todaysIncome: "Today Collection",
    monthlyIncome: 'Month Collection',
    paid: 'Paid',
    unpaid: 'Unpaid',
    partial: 'Half Paid',
    activeSubscriptions: 'Active',
    needToCollect: 'Pending Money',
    balancePending: 'Old Balance',
    incomeThisMonth: 'Month Collection',
    expiringIn7Days: 'Ends in 7 days',
    collectionProgress: 'Collection Target',
    collected: 'collected',
    allGood: 'All good 👍',
    noPayments: 'No payments yet',
    resetDashboard: 'Clear All Data',
    resetConfirm: 'This will mark ALL customers as UNPAID and clear all payment history. Are you sure?',
    resetSuccess: 'Data cleared successfully',
    // Customers
    addCustomer: 'New Customer',
    totalRecords: 'total',
    searchPlaceholder: 'Search name, CAF or phone...',
    name: 'Name',
    cafNumber: 'CAF/ID',
    phone: 'Phone',
    address: 'Address',
    plan: 'Bill (₹)',
    status: 'Status',
    paidOn: 'Paid Date',
    validTill: 'End Date',
    balance: 'Balance',
    actions: 'Action',
    pay: 'Bill Paid',
    noCustomers: 'No customers found',
    // Payment Modal
    paymentType: 'Payment Type',
    fullPaid: 'Full Paid',
    monthsPaid: 'Months Paid',
    amountPaid: 'Paying Amount',
    paymentMethod: 'Paid By',
    ponNumber: 'Box/PON No',
    cancel: 'Cancel',
    confirm: 'Confirm',
    carryOver: 'Old Pending Balance',
    carryOverNext: 'Pending for next month',
    // Import
    importCustomers: 'Upload Customers',
    uploadSubtitle: 'Upload Excel or CSV file',
    expectedColumns: 'Required Columns',
    dropFile: 'Click to select file',
    importing: 'Loading...',
    importBtn: '⬆️ Upload File',
    importResult: 'Result',
    totalRows: 'Total Rows',
    imported: 'Added',
    skipped: 'Skipped',
    upToDate: 'Up to Date',
    howToExport: 'How to format file',
    // Payments
    paymentHistory: 'Old Payments',
    type: 'Type',
    amount: 'Amount',
    months: 'Months',
    customer: 'Customer',
    from: 'From',
    to: 'To',
    filter: 'Filter',
    clear: 'Clear',
    total: 'Total',
    noPaymentRecords: 'No records found',
    // Add Customer
    customerName: 'Customer Name *',
    cafNumberLabel: 'CAF Number *',
    phoneNumber: 'Phone Number',
    monthlyPlan: 'Monthly Bill (₹)',
    notesLabel: 'Notes',
    connectionDate: 'Join Date',
    adding: 'Saving...',
    addBtn: 'Save Customer',
    paidThisMonth: '% paid this month',
    closeBtn: 'Close',
    paymentHistoryFor: 'Old Payments for',
    noHistoryFound: 'No history found.',
    editCustomer: 'Edit Customer',
    saveChanges: 'Save Changes',
    updating: 'Saving...',
    edit: 'Edit',
    // Settings
    settings: 'Settings',
    generalSettings: 'General Settings',
    companyName: 'Company Name',
    subscriptionPlans: 'Monthly Plans',
    planName: 'Plan Name',
    addPlan: 'Add Plan',
    saveSettings: 'Save Settings',
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
