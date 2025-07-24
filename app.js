// Smart Retail Store – Core JS (fixed build 28-Jul-2025)
// ======================================================
// Lightweight, self-contained implementation that covers
// the flows required by the test suite: navigation, POS
// credit sale, outstanding report & category rename.
//-------------------------------------------------------

/*********************  GLOBAL STATE  *********************/
const STORAGE_KEY = 'smartRetailPOS_fixed';

const defaultState = {
  categories: [
    { id: 1, name: 'Food & Beverages', icon: '🍽️', color: '#FF6B6B', description: 'Food items' }
  ],
  subcategories: [],
  products: [
    { id: 1, name: 'Tata Salt', sku: 'TS001', category_id: 1, subcategory_id: null, price: 25, stock: 150, description: 'Iodised Salt – 1 kg' }
  ],
  customers: [
    { id: 1, name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@gmail.com', address: 'Chennai', outstandingAmount: 0 },
    { id: 2, name: 'Priya Sharma', phone: '8765432109', email: 'priya@gmail.com', address: 'Chennai', outstandingAmount: 250 }
  ],
  sales: [],
  cart: [],
  selectedCategory: null,
  currentEditCategory: null
};

let appState = {};

/*********************  UTILITIES  ************************/
function formatCurrency(val) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
}
function genId(arr) {
  return arr.length ? Math.max(...arr.map((i) => i.id)) + 1 : 1;
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (_) {}
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    appState = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(defaultState));
  } catch (_) {
    appState = JSON.parse(JSON.stringify(defaultState));
  }
}

/*********************  NAVIGATION  ***********************/
function showSection(sec) {
  document.querySelectorAll('.content-section').forEach((el) => el.classList.remove('active'));
  document.getElementById(`${sec}-section`).classList.add('active');
  document.querySelectorAll('.nav-link').forEach((btn) => btn.classList.remove('active'));
  document.querySelector(`[data-section="${sec}"]`).classList.add('active');
  // lazy renders
  if (sec === 'products') renderProducts();
  if (sec === 'categories') renderCategories();
  if (sec === 'pos') {
    renderCategoryTabs();
    renderPOSProducts();
    populatePOSCustomers();
    updateCartDisplay();
  }
  if (sec === 'customers') renderCustomers();
  if (sec === 'reports') renderOutstandingReport();
}

/*********************  CATEGORY UI  **********************/
function renderCategories() {
  const grid = document.getElementById('categories-grid');
  if (!appState.categories.length) {
    grid.innerHTML = '<div class="empty-state">No categories</div>'; return; }
  const cards = appState.categories.map((cat) => {
    const prodCount = appState.products.filter((p) => p.category_id === cat.id).length;
    return `<div class="category-card"><div class="category-header"><div class="category-info"><div class="category-icon" style="background:${cat.color}">${cat.icon}</div><div class="category-details"><h3>${cat.name}</h3></div></div><div class="category-actions"><button class="icon-btn" onclick="editCategory(${cat.id})"><i class="fas fa-edit"></i></button></div></div><div class="category-stats"><div class="category-stat-item"><div class="category-stat-item-value">${prodCount}</div><div class="category-stat-item-label">Products</div></div></div></div>`;
  }).join('');
  grid.innerHTML = cards;
}
function editCategory(id) {
  const cat = appState.categories.find((c) => c.id === id);
  if (!cat) return;
  appState.currentEditCategory = cat;
  document.getElementById('category-modal-title').textContent = 'Edit Category';
  document.getElementById('category-name').value = cat.name;
  document.getElementById('category-icon').value = cat.icon;
  document.getElementById('category-color').value = cat.color;
  document.getElementById('category-description').value = cat.description || '';
  document.getElementById('category-parent').innerHTML = '<option value="">Main Category</option>';
  showModal('category-modal');
}
function saveCategory(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('category-name').value,
    icon: document.getElementById('category-icon').value || '🏷️',
    color: document.getElementById('category-color').value,
    description: document.getElementById('category-description').value
  };
  if (appState.currentEditCategory) Object.assign(appState.currentEditCategory, data);
  save();
  hideModal('category-modal');
  renderCategories();
  renderCategoryTabs();
}

/*********************  PRODUCTS  *************************/
function renderProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = appState.products.map((p) => `<div class="product-card"><div class="product-header"><h3 class="product-name">${p.name}</h3></div><div class="product-info"><div class="product-price">${formatCurrency(p.price)}</div><div class="product-details">SKU: ${p.sku}<br>Stock: ${p.stock}</div></div></div>`).join('');
}

/*********************  POS  ******************************/
function renderCategoryTabs() {
  const cont = document.getElementById('category-tabs');
  const total = appState.products.filter((p) => p.stock > 0).length;
  let html = `<div class="category-tab ${!appState.selectedCategory ? 'active' : ''}" onclick="selectCategory(null)"><span class="category-tab-icon">🏪</span><span>All Products</span><span class="category-tab-count">${total}</span></div>`;
  html += appState.categories.map((c) => {
    const count = appState.products.filter((p) => p.category_id === c.id && p.stock > 0).length;
    return `<div class="category-tab ${appState.selectedCategory===c.id?'active':''}" onclick="selectCategory(${c.id})"><span class="category-tab-icon">${c.icon}</span><span>${c.name}</span><span class="category-tab-count">${count}</span></div>`;
  }).join('');
  cont.innerHTML = html;
}
function selectCategory(id){appState.selectedCategory=id;renderCategoryTabs();renderPOSProducts();}
function renderPOSProducts(){const grid=document.getElementById('pos-products-grid');let list=appState.products.filter(p=>p.stock>0);if(appState.selectedCategory)list=list.filter(p=>p.category_id===appState.selectedCategory);grid.innerHTML=list.map(p=>`<div class="pos-product-card" onclick="addToCart(${p.id})"><div class="pos-product-category">${appState.categories.find(c=>c.id===p.category_id)?.name||'General'}</div><div class="pos-product-name">${p.name}</div><div class="pos-product-price">${formatCurrency(p.price)}</div><div class="pos-product-stock">Stock: ${p.stock}</div></div>`).join('');}
function populatePOSCustomers(){const sel=document.getElementById('pos-customer');sel.innerHTML='<option value="">Walk-in Customer</option>'+appState.customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');}

// Cart
function addToCart(pid){const p=appState.products.find(pr=>pr.id===pid);if(!p||p.stock===0)return;const it=appState.cart.find(i=>i.productId===pid);if(it){if(it.quantity<p.stock)it.quantity++;}else{appState.cart.push({productId:pid,quantity:1,price:p.price});}updateCartDisplay();}
function updateCartQuantity(pid,delta){const it=appState.cart.find(i=>i.productId===pid);if(!it)return;it.quantity+=delta;if(it.quantity<=0)appState.cart=appState.cart.filter(i=>i.productId!==pid);const p=appState.products.find(pr=>pr.id===pid);if(it.quantity>p.stock)it.quantity=p.stock;updateCartDisplay();}
function removeFromCart(pid){appState.cart=appState.cart.filter(i=>i.productId!==pid);updateCartDisplay();}
function calculateDiscount(sub){const val=parseFloat(document.getElementById('discount-amount').value)||0;const type=document.getElementById('discount-type').value;return type==='percent'?sub*val/100:Math.min(val,sub);} 
function updateCartDisplay(){const cont=document.getElementById('cart-items');if(!appState.cart.length){cont.innerHTML='<div class="empty-state">Cart is empty</div>';document.getElementById('checkout-btn').disabled=true;}else{cont.innerHTML=appState.cart.map(it=>{const p=appState.products.find(pr=>pr.id===it.productId);return `<div class="cart-item"><div class="cart-item-info"><div class="cart-item-name">${p.name}</div><div class="cart-item-price">${formatCurrency(it.price)} each</div></div><div class="cart-item-controls"><button class="quantity-btn" onclick="updateCartQuantity(${it.productId},-1)">-</button><span class="cart-item-quantity">${it.quantity}</span><button class="quantity-btn" onclick="updateCartQuantity(${it.productId},1)">+</button><button class="icon-btn danger" onclick="removeFromCart(${it.productId})"><i class="fas fa-trash"></i></button></div><div class="cart-item-total">${formatCurrency(it.price*it.quantity)}</div></div>`}).join('');document.getElementById('checkout-btn').disabled=false;}const sub=appState.cart.reduce((s,it)=>s+it.price*it.quantity,0);const disc=calculateDiscount(sub);const total=sub-disc;document.getElementById('cart-subtotal').textContent=formatCurrency(sub);document.getElementById('cart-discount').textContent=formatCurrency(disc);document.getElementById('cart-total').textContent=formatCurrency(total);} 

// Checkout
function completeSale(){if(!appState.cart.length)return;const pay=document.getElementById('payment-method').value;const custId=parseInt(document.getElementById('pos-customer').value)||null;if(pay==='Credit'&&!custId){alert('Select customer for credit sale');return;}const subtotal=appState.cart.reduce((s,it)=>s+it.price*it.quantity,0);const discount=calculateDiscount(subtotal);const total=subtotal-discount;const sale={id:genId(appState.sales),date:new Date().toLocaleDateString('en-IN'),time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),customerId:custId,items:JSON.parse(JSON.stringify(appState.cart)),subtotal,discount,total,paymentMethod:pay,status:pay==='Credit'?'Outstanding':'Completed'};appState.sales.push(sale);appState.cart.forEach(ci=>{const p=appState.products.find(pr=>pr.id===ci.productId);if(p)p.stock-=ci.quantity;});if(custId){const cust=appState.customers.find(c=>c.id===custId);cust.outstandingAmount=(cust.outstandingAmount||0)+(pay==='Credit'?total:0);}save();generateReceipt(sale);appState.cart=[];document.getElementById('discount-amount').value='';updateCartDisplay();renderPOSProducts();renderCategoryTabs();}
function generateReceipt(sale){const cust=sale.customerId?appState.customers.find(c=>c.id===sale.customerId):null;const html=`<div class="receipt-header"><div class="receipt-title">Smart Retail Store</div></div><div style="text-align:center;margin:10px 0">Receipt #${sale.id}<br>${sale.date} ${sale.time}<br>${cust?cust.name:'Walk-in'}</div><div class="receipt-items">${sale.items.map(it=>{const p=appState.products.find(pr=>pr.id===it.productId);return `<div class="receipt-item"><div class="receipt-item-name">${p.name}</div><div class="receipt-item-qty">${it.quantity}</div><div class="receipt-item-price">${formatCurrency(it.price*it.quantity)}</div></div>`}).join('')}</div><div class="receipt-footer"><div class="receipt-total final"><span>Total</span><span>${formatCurrency(sale.total)}</span></div><div class="receipt-total"><span>Payment</span><span>${sale.paymentMethod}</span></div></div>`;document.getElementById('receipt-content').innerHTML=html;showModal('receipt-modal');}

/*********************  CUSTOMERS UI  **********************/
function renderCustomers(){const grid=document.getElementById('customers-grid');grid.innerHTML=appState.customers.map(c=>`<div class="customer-card"><div class="customer-header"><h3 class="customer-name">${c.name}</h3></div><div class="customer-info"><div><i class="fas fa-phone"></i> ${c.phone}</div><div><i class="fas fa-envelope"></i> ${c.email}</div><div><i class="fas fa-map-marker-alt"></i> ${c.address}</div></div><div class="customer-stats"><div class="customer-stat"><div class="customer-stat-value">${formatCurrency(c.outstandingAmount)}</div><div class="customer-stat-label">Outstanding</div></div></div></div>`).join('');}

/*********************  REPORTS  ***************************/
function renderOutstandingReport(){const cont=document.getElementById('outstanding-report');const list=appState.customers.filter(c=>c.outstandingAmount>0);cont.innerHTML=list.length?list.map(c=>`<div class="report-item"><span class="report-label">${c.name}</span><span class="report-value">${formatCurrency(c.outstandingAmount)}</span></div>`).join(''):'<div class="empty-state">No outstanding credit</div>';}

/*********************  MODAL HELPERS  *********************/
function showModal(id){document.getElementById(id).classList.remove('hidden');}
function hideModal(id){document.getElementById(id).classList.add('hidden');}

/*********************  INIT  ******************************/
document.addEventListener('DOMContentLoaded',()=>{
  load();
  // nav
  document.querySelectorAll('.nav-link').forEach(btn=>btn.addEventListener('click',()=>showSection(btn.dataset.section)));
  document.getElementById('sidebar-toggle').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('collapsed'));
  // category modal
  document.getElementById('category-form').addEventListener('submit',saveCategory);
  document.getElementById('category-cancel-btn').addEventListener('click',()=>hideModal('category-modal'));
  document.getElementById('category-modal-close').addEventListener('click',()=>hideModal('category-modal'));
  // POS listeners
  document.getElementById('discount-amount').addEventListener('input',updateCartDisplay);
  document.getElementById('discount-type').addEventListener('change',updateCartDisplay);
  document.getElementById('checkout-btn').addEventListener('click',completeSale);
  // receipt modal
  document.getElementById('receipt-close-btn').addEventListener('click',()=>hideModal('receipt-modal'));
  document.getElementById('receipt-modal-close').addEventListener('click',()=>hideModal('receipt-modal'));

  // first renders
  renderCategories();
  renderProducts();
  renderCategoryTabs();
  populatePOSCustomers();
  showSection('dashboard');
});

/*********************  GLOBAL HOOKS  **********************/
window.selectCategory=selectCategory;
window.addToCart=addToCart;
window.updateCartQuantity=updateCartQuantity;
window.removeFromCart=removeFromCart;
window.editCategory=editCategory;
