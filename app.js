// app.js - Core logic for Advanced Billing Software (Vanilla JS implementation)

/*---------------------------------------------------------
  Utility Functions
---------------------------------------------------------*/
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

// Simple amount in words (supports up to crores)
function amountInWords(num) {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if ((num = num.toString()).length > 9) return "Overflow";
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d)(\d{2})$/);
  if (!n) return; let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only ' : '';
  return str.trim();
}

// Generate Invoice Number
function generateInvoiceNumber() {
  const { companyProfile } = state;
  const padded = String(companyProfile.nextNumber).padStart(3, '0');
  const invoiceNo = `${companyProfile.invoicePrefix}${padded}`;
  companyProfile.nextNumber += 1;
  return invoiceNo;
}

/*---------------------------------------------------------
  Initial State
---------------------------------------------------------*/
const initialData = {
  products: [
    { id: 1, name: "Notebook 200 pages", hsn: "4820", price: 50, gstRate: 12, stockQty: 120 },
    { id: 2, name: "Gel Pen Blue", hsn: "9608", price: 15, gstRate: 12, stockQty: 300 }
  ],
  customers: [
    { id: 1, name: "ABC Traders", address: "12 Gandhi Rd, Coimbatore, TN", gstin: "33AAAAA0000A1Z5" }
  ],
  invoices: [],
  companyProfile: {
    name: "Chettipalayam Stationers",
    address: "45 NH Road, Chettipalayam, Tamil Nadu 641201",
    gstin: "33BBBBB1111B1Z6",
    invoicePrefix: "INV-2025/",
    nextNumber: 1
  },
  gstSlabs: [0, 5, 12, 18, 28]
};

// State stored in-memory
let state = JSON.parse(JSON.stringify(initialData));

// Add a dummy invoice on first load
function createDummyInvoice() {
  const dummyInvoice = {
    id: 1,
    number: generateInvoiceNumber(),
    date: new Date().toISOString().split('T')[0],
    customer: state.customers[0],
    items: [
      {
        product: state.products[0],
        qty: 2,
        price: 50,
        gstRate: 12
      }
    ]
  };

  dummyInvoice.totals = calculateInvoiceTotals(dummyInvoice.items);
  state.invoices.push(dummyInvoice);
}
createDummyInvoice();

/*---------------------------------------------------------
  Helper Functions
---------------------------------------------------------*/
function calculateInvoiceTotals(items) {
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  items.forEach(it => {
    const lineTotal = it.price * it.qty;
    const gstAmount = (lineTotal * it.gstRate) / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    subtotal += lineTotal;
    totalCgst += cgst;
    totalSgst += sgst;
  });
  const total = subtotal + totalCgst + totalSgst;
  return { subtotal, totalCgst, totalSgst, total };
}

function getTodayRevenue() {
  const today = new Date().toISOString().split('T')[0];
  let sum = 0;
  state.invoices.forEach(inv => {
    if (inv.date === today) {
      sum += inv.totals.total;
    }
  });
  return sum;
}

function getLowStockItems() {
  return state.products.filter(p => p.stockQty < 10);
}

/*---------------------------------------------------------
  DOM Elements
---------------------------------------------------------*/
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');

/* Dashboard Elements */
const todayRevenueEl = document.getElementById('today-revenue');
const totalProductsEl = document.getElementById('total-products');
const lowStockCountEl = document.getElementById('low-stock-count');
const lowStockItemsContainer = document.getElementById('low-stock-items');

/* Invoice Elements */
const invoicesTableBody = document.getElementById('invoices-table-body');
const newInvoiceBtn = document.getElementById('new-invoice-btn');
const backToInvoicesBtn = document.getElementById('back-to-invoices');
const newInvoiceView = document.getElementById('new-invoice-view');
const invoicesView = document.getElementById('invoices-view');
const invoiceForm = document.getElementById('invoice-form');
const invoiceCustomerSelect = document.getElementById('invoice-customer');
const invoiceDateInput = document.getElementById('invoice-date');
const invoiceNumberInput = document.getElementById('invoice-number');
const invoiceItemsTbody = document.getElementById('invoice-items');
const addItemBtn = document.getElementById('add-item-btn');
const invoiceSubtotalEl = document.getElementById('invoice-subtotal');
const invoiceCgstEl = document.getElementById('invoice-cgst');
const invoiceSgstEl = document.getElementById('invoice-sgst');
const invoiceTotalEl = document.getElementById('invoice-total');

/* Stock Elements */
const stockTableBody = document.getElementById('stock-table-body');
const addProductBtn = document.getElementById('add-product-btn');
const productModal = document.getElementById('product-modal');
const productModalTitle = document.getElementById('product-modal-title');
const productForm = document.getElementById('product-form');
const productNameInput = document.getElementById('product-name');
const productHsnInput = document.getElementById('product-hsn');
const productPriceInput = document.getElementById('product-price');
const productGstInput = document.getElementById('product-gst');
const productStockInput = document.getElementById('product-stock');
const modalCloseBtns = document.querySelectorAll('.modal-close, .modal-cancel');

/* Reports Elements */
const reportFromDateInput = document.getElementById('report-from-date');
const reportToDateInput = document.getElementById('report-to-date');
const generateReportBtn = document.getElementById('generate-report');
const downloadCsvBtn = document.getElementById('download-csv');
const reportTableBody = document.getElementById('report-table-body');

/* Settings Elements */
const companyForm = document.getElementById('company-form');
const companyNameInput = document.getElementById('company-name');
const companyAddressInput = document.getElementById('company-address');
const companyGstinInput = document.getElementById('company-gstin');
const invoicePrefixInput = document.getElementById('invoice-prefix');
const nextInvoiceNumberInput = document.getElementById('next-invoice-number');

/* Print Elements */
const printInvoiceEl = document.getElementById('print-invoice');
const printCompanyNameEl = document.getElementById('print-company-name');
const printCompanyAddressEl = document.getElementById('print-company-address');
const printCompanyGstinEl = document.getElementById('print-company-gstin');
const printInvoiceNumberEl = document.getElementById('print-invoice-number');
const printInvoiceDateEl = document.getElementById('print-invoice-date');
const printCustomerNameEl = document.getElementById('print-customer-name');
const printCustomerAddressEl = document.getElementById('print-customer-address');
const printCustomerGstinEl = document.getElementById('print-customer-gstin');
const printInvoiceItemsTbody = document.getElementById('print-invoice-items');
const printSubtotalEl = document.getElementById('print-subtotal');
const printTotalCgstEl = document.getElementById('print-total-cgst');
const printTotalSgstEl = document.getElementById('print-total-sgst');
const printFinalTotalEl = document.getElementById('print-final-total');
const printAmountWordsEl = document.getElementById('print-amount-words');

/*---------------------------------------------------------
  Routing & Navigation
---------------------------------------------------------*/
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const route = link.dataset.route;
    showView(route);
  });
});

function showView(route) {
  views.forEach(v => v.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('active'));
  document.getElementById(`${route}-view`).classList.add('active');
  document.querySelector(`[data-route="${route}"]`).classList.add('active');
  if (route === 'dashboard') renderDashboard();
  if (route === 'invoices') renderInvoicesTable();
  if (route === 'stock') renderStockTable();
  if (route === 'reports') renderReportTable();
  if (route === 'settings') loadCompanySettings();
}

/*---------------------------------------------------------
  Dashboard Rendering
---------------------------------------------------------*/
function renderDashboard() {
  todayRevenueEl.textContent = formatINR(getTodayRevenue());
  totalProductsEl.textContent = state.products.length;
  const lowStockItems = getLowStockItems();
  lowStockCountEl.textContent = lowStockItems.length;
  lowStockItemsContainer.innerHTML = '';
  if (lowStockItems.length === 0) {
    const p = document.createElement('p');
    p.classList.add('text-secondary');
    p.textContent = 'No low stock items';
    lowStockItemsContainer.appendChild(p);
  } else {
    const ul = document.createElement('ul');
    lowStockItems.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} - ${item.stockQty} left`;
      li.classList.add('low-stock');
      ul.appendChild(li);
    });
    lowStockItemsContainer.appendChild(ul);
  }
}

/*---------------------------------------------------------
  Invoices Rendering & Logic
---------------------------------------------------------*/
function renderInvoicesTable() {
  invoicesTableBody.innerHTML = '';
  state.invoices.forEach(inv => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${inv.number}</td>
      <td>${inv.customer.name}</td>
      <td>${inv.date}</td>
      <td>${formatINR(inv.totals.total)}</td>
      <td><button class="btn btn--outline btn--sm" data-action="print" data-id="${inv.id}">Print</button></td>
    `;
    invoicesTableBody.appendChild(tr);
  });
}

// Populate customer dropdown
function populateCustomerSelect() {
  invoiceCustomerSelect.innerHTML = '<option value="">Select Customer</option>';
  state.customers.forEach(cust => {
    const option = document.createElement('option');
    option.value = cust.id;
    option.textContent = cust.name;
    invoiceCustomerSelect.appendChild(option);
  });
}

// Create item row in invoice form
function createItemRow(itemData = {}) {
  const tr = document.createElement('tr');
  const productOptions = state.products.map(p => `<option value="${p.id}" ${itemData.product && itemData.product.id === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
  tr.innerHTML = `
    <td>
      <select class="form-control item-product">
        <option value="">Select</option>
        ${productOptions}
      </select>
    </td>
    <td class="item-hsn">${itemData.product ? itemData.product.hsn : ''}</td>
    <td><input type="number" class="form-control item-price" step="0.01" value="${itemData.price || ''}"></td>
    <td><input type="number" class="form-control item-qty" value="${itemData.qty || 1}"></td>
    <td class="item-gst">${itemData.product ? itemData.product.gstRate : ''}</td>
    <td class="item-total">0</td>
    <td><button type="button" class="btn btn--outline btn--sm remove-item-btn">Remove</button></td>
  `;
  invoiceItemsTbody.appendChild(tr);
  updateTotals();
}

function updateTotals() {
  const rows = invoiceItemsTbody.querySelectorAll('tr');
  const items = [];
  rows.forEach(row => {
    const productId = parseInt(row.querySelector('.item-product').value);
    if (!productId) return;
    const product = state.products.find(p => p.id === productId);
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const qty = parseInt(row.querySelector('.item-qty').value) || 1;
    const gstRate = product.gstRate;
    const lineTotal = price * qty;
    const gstAmount = (lineTotal * gstRate) / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    const totalWithTax = lineTotal + cgst + sgst;
    row.querySelector('.item-hsn').textContent = product.hsn;
    row.querySelector('.item-gst').textContent = gstRate;
    row.querySelector('.item-total').textContent = formatINR(totalWithTax);
    items.push({ product, price, qty, gstRate });
  });
  const totals = calculateInvoiceTotals(items);
  invoiceSubtotalEl.textContent = formatINR(totals.subtotal);
  invoiceCgstEl.textContent = formatINR(totals.totalCgst);
  invoiceSgstEl.textContent = formatINR(totals.totalSgst);
  invoiceTotalEl.textContent = formatINR(totals.total);
  return { items, totals };
}

/* Event Listeners */
newInvoiceBtn.addEventListener('click', () => {
  newInvoiceView.classList.add('active');
  invoicesView.classList.remove('active');
  invoiceDateInput.valueAsDate = new Date();
  invoiceNumberInput.value = generateInvoiceNumber();
  populateCustomerSelect();
  invoiceItemsTbody.innerHTML = '';
  createItemRow();
});

backToInvoicesBtn.addEventListener('click', () => {
  newInvoiceView.classList.remove('active');
  invoicesView.classList.add('active');
});

addItemBtn.addEventListener('click', () => {
  createItemRow();
});

invoiceItemsTbody.addEventListener('change', updateTotals);
invoiceItemsTbody.addEventListener('input', updateTotals);

invoiceItemsTbody.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-item-btn')) {
    e.target.closest('tr').remove();
    updateTotals();
  }
});

invoiceForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const { items, totals } = updateTotals();
  if (items.length === 0) {
    alert('Add at least one item');
    return;
  }
  const customerId = parseInt(invoiceCustomerSelect.value);
  if (!customerId) {
    alert('Select customer');
    return;
  }
  const customer = state.customers.find(c => c.id === customerId);
  const newInvoice = {
    id: state.invoices.length + 1,
    number: invoiceNumberInput.value,
    date: invoiceDateInput.value,
    customer,
    items,
    totals
  };
  state.invoices.push(newInvoice);
  // Update stock
  items.forEach(it => {
    const prod = state.products.find(p => p.id === it.product.id);
    prod.stockQty -= it.qty;
  });
  alert('Invoice saved successfully');
  newInvoiceView.classList.remove('active');
  invoicesView.classList.add('active');
  renderInvoicesTable();
  renderDashboard();
  showPrintableInvoice(newInvoice);
});

/* Print Invoice */
function showPrintableInvoice(inv) {
  // Fill data
  printCompanyNameEl.textContent = state.companyProfile.name;
  printCompanyAddressEl.textContent = state.companyProfile.address;
  printCompanyGstinEl.textContent = state.companyProfile.gstin;

  printInvoiceNumberEl.textContent = inv.number;
  printInvoiceDateEl.textContent = inv.date;

  printCustomerNameEl.textContent = inv.customer.name;
  printCustomerAddressEl.textContent = inv.customer.address;
  printCustomerGstinEl.textContent = inv.customer.gstin;

  printInvoiceItemsTbody.innerHTML = '';
  inv.items.forEach((it, idx) => {
    const lineTotal = it.price * it.qty;
    const gstAmount = (lineTotal * it.gstRate) / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    const totalWithTax = lineTotal + cgst + sgst;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${it.product.name}</td>
      <td>${it.product.hsn}</td>
      <td>${it.qty}</td>
      <td>${formatINR(it.price)}</td>
      <td>${formatINR(lineTotal)}</td>
      <td>${formatINR(cgst)}</td>
      <td>${formatINR(sgst)}</td>
      <td>${formatINR(totalWithTax)}</td>
    `;
    printInvoiceItemsTbody.appendChild(tr);
  });

  printSubtotalEl.textContent = formatINR(inv.totals.subtotal);
  printTotalCgstEl.textContent = formatINR(inv.totals.totalCgst);
  printTotalSgstEl.textContent = formatINR(inv.totals.totalSgst);
  printFinalTotalEl.textContent = formatINR(inv.totals.total);
  printAmountWordsEl.textContent = amountInWords(Math.round(inv.totals.total));

  // Open in new window
  const printWindow = window.open('', '_blank');
  printWindow.document.write('<html><head><title>Invoice</title>');
  const styles = document.querySelector('style').outerHTML + document.querySelector('link[rel="stylesheet"]').outerHTML;
  printWindow.document.write(styles);
  printWindow.document.write('</head><body>');
  printWindow.document.write(printInvoiceEl.outerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

invoicesTableBody.addEventListener('click', (e) => {
  if (e.target.dataset.action === 'print') {
    const invId = parseInt(e.target.dataset.id);
    const inv = state.invoices.find(i => i.id === invId);
    showPrintableInvoice(inv);
  }
});

/*---------------------------------------------------------
  Stock Rendering & Logic
---------------------------------------------------------*/
function renderStockTable() {
  stockTableBody.innerHTML = '';
  state.products.forEach(prod => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${prod.name}</td>
      <td>${prod.hsn}</td>
      <td>${formatINR(prod.price)}</td>
      <td>${prod.gstRate}%</td>
      <td>${prod.stockQty}</td>
      <td><button class="btn btn--outline btn--sm" data-action="edit" data-id="${prod.id}">Edit</button></td>
    `;
    stockTableBody.appendChild(tr);
  });
}

/* Product Modal Logic */
addProductBtn.addEventListener('click', () => {
  openProductModal();
});

stockTableBody.addEventListener('click', (e) => {
  if (e.target.dataset.action === 'edit') {
    const prodId = parseInt(e.target.dataset.id);
    const prod = state.products.find(p => p.id === prodId);
    openProductModal(prod);
  }
});

function openProductModal(prod = null) {
  productModal.classList.add('active');
  if (prod) {
    productModalTitle.textContent = 'Edit Product';
    productForm.dataset.editId = prod.id;
    productNameInput.value = prod.name;
    productHsnInput.value = prod.hsn;
    productPriceInput.value = prod.price;
    productGstInput.value = prod.gstRate;
    productStockInput.value = prod.stockQty;
  } else {
    productModalTitle.textContent = 'Add Product';
    delete productForm.dataset.editId;
    productForm.reset();
  }
}

modalCloseBtns.forEach(btn => btn.addEventListener('click', () => {
  productModal.classList.remove('active');
}));

productForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = productNameInput.value.trim();
  const hsn = productHsnInput.value.trim();
  const price = parseFloat(productPriceInput.value);
  const gstRate = parseInt(productGstInput.value);
  const stockQty = parseInt(productStockInput.value);
  if (!name || !hsn) {
    alert('Please fill all fields');
    return;
  }
  if (productForm.dataset.editId) {
    const prodId = parseInt(productForm.dataset.editId);
    const prod = state.products.find(p => p.id === prodId);
    prod.name = name;
    prod.hsn = hsn;
    prod.price = price;
    prod.gstRate = gstRate;
    prod.stockQty = stockQty;
  } else {
    const newProd = {
      id: state.products.length + 1,
      name,
      hsn,
      price,
      gstRate,
      stockQty
    };
    state.products.push(newProd);
  }
  productModal.classList.remove('active');
  renderStockTable();
  renderDashboard();
});

/*---------------------------------------------------------
  Reports Rendering & Logic
---------------------------------------------------------*/
function renderReportTable() {
  reportTableBody.innerHTML = '';
  state.invoices.forEach(inv => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${inv.number}</td>
      <td>${inv.date}</td>
      <td>${inv.customer.name}</td>
      <td>${formatINR(inv.totals.total)}</td>
    `;
    reportTableBody.appendChild(tr);
  });
}

function filterInvoicesByDate(from, to) {
  if (!from && !to) return state.invoices;
  return state.invoices.filter(inv => {
    return (!from || inv.date >= from) && (!to || inv.date <= to);
  });
}

generateReportBtn.addEventListener('click', () => {
  const from = reportFromDateInput.value;
  const to = reportToDateInput.value;
  const filtered = filterInvoicesByDate(from, to);
  reportTableBody.innerHTML = '';
  filtered.forEach(inv => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${inv.number}</td>
      <td>${inv.date}</td>
      <td>${inv.customer.name}</td>
      <td>${formatINR(inv.totals.total)}</td>
    `;
    reportTableBody.appendChild(tr);
  });
});

/* CSV Download */
function downloadCSV(data, filename) {
  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(','));
  data.forEach(row => {
    const values = headers.map(h => '"' + row[h] + '"');
    csvRows.push(values.join(','));
  });
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

downloadCsvBtn.addEventListener('click', () => {
  if (state.invoices.length === 0) {
    alert('No invoices to download');
    return;
  }
  const csvData = state.invoices.map(inv => ({
    invoiceNumber: inv.number,
    date: inv.date,
    customer: inv.customer.name,
    total: inv.totals.total
  }));
  downloadCSV(csvData, 'sales_report.csv');
});

/*---------------------------------------------------------
  Settings Logic
---------------------------------------------------------*/
function loadCompanySettings() {
  companyNameInput.value = state.companyProfile.name;
  companyAddressInput.value = state.companyProfile.address;
  companyGstinInput.value = state.companyProfile.gstin;
  invoicePrefixInput.value = state.companyProfile.invoicePrefix;
  nextInvoiceNumberInput.value = state.companyProfile.nextNumber;
}

companyForm.addEventListener('submit', (e) => {
  e.preventDefault();
  state.companyProfile.name = companyNameInput.value.trim();
  state.companyProfile.address = companyAddressInput.value.trim();
  state.companyProfile.gstin = companyGstinInput.value.trim();
  state.companyProfile.invoicePrefix = invoicePrefixInput.value.trim();
  state.companyProfile.nextNumber = parseInt(nextInvoiceNumberInput.value);
  alert('Settings saved');
});

/*---------------------------------------------------------
  Initial Rendering
---------------------------------------------------------*/
showView('dashboard');
