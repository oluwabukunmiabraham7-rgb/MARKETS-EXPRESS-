import { auth, db } from './firebase.js';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const CART_KEY = 'market_express_cart_v1';
const FALLBACK_IMAGE = 'https://placehold.co/600x450/f4f4f4/777?text=MARKET+EXPRESS';
const money = n => new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(Number(n)||0);
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const safeText = v => String(v ?? '').trim();
function getCart(){ try { const x=JSON.parse(localStorage.getItem(CART_KEY)||'[]'); return Array.isArray(x)?x.filter(i=>i&&i.id&&Number(i.price)>=0&&Number(i.qty)>0):[]; } catch { return []; } }
function saveCart(cart){ localStorage.setItem(CART_KEY,JSON.stringify(cart)); updateCartCount(); }
function updateCartCount(){ const count=getCart().reduce((n,i)=>n+Number(i.qty||0),0); $$('[data-cart-count]').forEach(el=>el.textContent=String(count)); }
function showMessage(el,text,type='error'){ if(!el)return; el.textContent=text; el.className=`message show ${type}`; }
function hideMessage(el){ if(el){el.textContent='';el.className='message';} }
function setBusy(button,busy,label='Please wait…'){if(!button)return;if(busy){button.dataset.oldText=button.textContent;button.disabled=true;button.textContent=label;}else{button.disabled=false;button.textContent=button.dataset.oldText||button.textContent;delete button.dataset.oldText;}}
function cartAdd(product){const cart=getCart();const old=cart.find(i=>i.id===product.id);if(old)old.qty=Math.min(99,Number(old.qty)+1);else cart.push({...product,qty:1});saveCart(cart);alert(`${product.name} added to your cart.`);}
function productCard(p){
 const card=document.createElement('article');card.className='product-card';
 const img=document.createElement('img');img.className='product-image';img.loading='lazy';img.alt=safeText(p.name)||'Product';img.src=safeText(p.image||p.imageUrl)||FALLBACK_IMAGE;img.onerror=()=>{img.onerror=null;img.src=FALLBACK_IMAGE;};
 const body=document.createElement('div');body.className='product-body';
 const name=document.createElement('div');name.className='product-name';name.textContent=safeText(p.name)||'Unnamed product';
 const desc=document.createElement('div');desc.className='product-description';desc.textContent=safeText(p.description).slice(0,100);
 const price=document.createElement('div');price.className='product-price';price.textContent=money(p.price);
 const btn=document.createElement('button');btn.type='button';btn.className='btn';btn.textContent='Add to cart';btn.addEventListener('click',()=>cartAdd({id:p.id,name:safeText(p.name)||'Product',price:Number(p.price)||0,image:safeText(p.image||p.imageUrl)||FALLBACK_IMAGE,category:safeText(p.category)}));
 body.append(name);if(desc.textContent)body.append(desc);body.append(price,btn);card.append(img,body);return card;
}
async function loadProducts(){
 const grid=$('#productGrid');if(!grid)return;
 const loader=$('#productLoader'),empty=$('#emptyProducts'),error=$('#productError');
 if(loader)loader.classList.remove('hidden');if(empty)empty.classList.add('hidden');if(error)error.classList.add('hidden');
 try{
  const snap=await getDocs(collection(db,'products'));
  const products=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.active!==false&&safeText(p.name)&&Number.isFinite(Number(p.price))&&Number(p.price)>=0);
  window.marketProducts=products;
  renderProducts();
 }catch(err){console.error('Product loading failed:',err);if(loader)loader.classList.add('hidden');if(error){error.textContent='We could not load products. Check your connection and try again.';error.classList.remove('hidden');} }
}
function renderProducts(){
 const grid=$('#productGrid');if(!grid)return;
 const loader=$('#productLoader'),empty=$('#emptyProducts'),title=$('#productsTitle');if(loader)loader.classList.add('hidden');
 const term=safeText($('#searchInput')?.value).toLowerCase();const category=safeText(new URLSearchParams(location.search).get('category')||window.activeCategory||'All').toLowerCase();
 const all=window.marketProducts||[];const list=all.filter(p=>{
  const hay=[p.name,p.description,p.category,...(Array.isArray(p.searchTags)?p.searchTags:[p.searchTags||''])].join(' ').toLowerCase();
  return (!term||hay.includes(term))&&(category==='all'||safeText(p.category).toLowerCase()===category);
 });
 grid.replaceChildren(...list.map(productCard));if(empty)empty.classList.toggle('hidden',list.length!==0);if(title)title.textContent=term?`Search results (${list.length})`:category!=='all'?`${category} (${list.length})`:'Featured products';
 $$('.chip[data-category]').forEach(chip=>chip.classList.toggle('active',safeText(chip.dataset.category).toLowerCase()===category));
}
function initStore(){
 const search=$('#searchInput');if(search){search.value=new URLSearchParams(location.search).get('q')||'';search.addEventListener('input',renderProducts);}
 $$('.chip[data-category]').forEach(chip=>chip.addEventListener('click',()=>{window.activeCategory=chip.dataset.category;const u=new URL(location.href);if(chip.dataset.category==='All')u.searchParams.delete('category');else u.searchParams.set('category',chip.dataset.category);history.replaceState({},'',u);renderProducts();}));
 $('#retryProducts')?.addEventListener('click',loadProducts);loadProducts();
}
function renderCart(){
 const list=$('#cartItems');if(!list)return;const cart=getCart();list.replaceChildren();
 const empty=$('#emptyCart'),summary=$('#cartSummary');if(empty)empty.classList.toggle('hidden',cart.length>0);if(summary)summary.classList.toggle('hidden',cart.length===0);
 cart.forEach(item=>{
  const row=document.createElement('article');row.className='cart-row';const img=document.createElement('img');img.src=item.image||FALLBACK_IMAGE;img.alt=item.name;img.onerror=()=>{img.onerror=null;img.src=FALLBACK_IMAGE;};
  const details=document.createElement('div');const title=document.createElement('h3');title.textContent=item.name;const price=document.createElement('div');price.className='product-price';price.textContent=money(item.price);const controls=document.createElement('div');controls.className='qty-controls';
  const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label',`Remove one ${item.name}`);minus.onclick=()=>changeQty(item.id,-1);
  const qty=document.createElement('span');qty.textContent=String(item.qty);
  const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label',`Add one ${item.name}`);plus.onclick=()=>changeQty(item.id,1);controls.append(minus,qty,plus);details.append(title,price,controls);
  const actions=document.createElement('div');actions.className='row-actions';const subtotal=document.createElement('strong');subtotal.textContent=money(item.price*item.qty);const remove=document.createElement('button');remove.className='btn secondary small';remove.type='button';remove.textContent='Remove';remove.onclick=()=>{saveCart(getCart().filter(x=>x.id!==item.id));renderCart();};actions.append(subtotal,remove);row.append(img,details,actions);list.append(row);
 });
 const total=cart.reduce((n,i)=>n+Number(i.price)*Number(i.qty),0);if($('#cartTotal'))$('#cartTotal').textContent=money(total);if($('#checkoutTotal'))$('#checkoutTotal').textContent=money(total);updateCartCount();
}
function changeQty(id,delta){const cart=getCart();const item=cart.find(i=>i.id===id);if(!item)return;item.qty=Number(item.qty)+delta;saveCart(cart.filter(i=>i.qty>0));renderCart();}
function initCart(){renderCart();$('#clearCart')?.addEventListener('click',()=>{if(confirm('Remove all items from your cart?')){saveCart([]);renderCart();}});}
function initAuth(){
 const form=$('#authForm');if(!form)return;const mode=form.dataset.mode||'login';const message=$('#formMessage');
 form.addEventListener('submit',async e=>{e.preventDefault();hideMessage(message);const btn=$('#authSubmit');setBusy(btn,true);
  const email=safeText($('#email')?.value).toLowerCase();const password=$('#password')?.value||'';
  try{
   let credential;
   if(mode==='signup'){
    const name=safeText($('#fullName')?.value);if(name.length<2)throw new Error('Please enter your full name.');if(password.length<6)throw new Error('Use a password with at least 6 characters.');
    credential=await createUserWithEmailAndPassword(auth,email,password);await updateProfile(credential.user,{displayName:name});
   }else credential=await signInWithEmailAndPassword(auth,email,password);
   const redirect=new URLSearchParams(location.search).get('next');location.href=redirect&&redirect.startsWith('/')?redirect.slice(1):'account.html';
  }catch(err){console.error(err);const messages={'auth/invalid-credential':'Email or password is incorrect.','auth/email-already-in-use':'An account with this email already exists.','auth/invalid-email':'Enter a valid email address.','auth/weak-password':'Choose a stronger password (at least 6 characters).','auth/network-request-failed':'Network error. Check your internet connection.'};showMessage(message,messages[err.code]||err.message||'Authentication failed. Please try again.');}
  finally{setBusy(btn,false);}
 });
}
function initAccount(){
 const account=$('#accountContent');if(!account)return;
 onAuthStateChanged(auth,user=>{
  const signedOut=$('#signedOut'),signedIn=$('#signedIn');if(signedOut)signedOut.classList.toggle('hidden',!!user);if(signedIn)signedIn.classList.toggle('hidden',!user);if(!user)return;
  if($('#accountName'))$('#accountName').textContent=user.displayName||'Customer';if($('#accountEmail'))$('#accountEmail').textContent=user.email||'';
  const orders=$('#myOrders');if(orders){orders.textContent='Loading your orders…';getDocs(query(collection(db,'orders'),where('userId','==',user.uid))).then(snap=>{orders.replaceChildren();if(snap.empty){orders.textContent='You have not placed any orders yet.';return;}snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)).forEach(o=>{const item=document.createElement('div');item.className='panel';item.style.marginTop='10px';const p=document.createElement('p');p.textContent=`Order ${o.orderId||o.id} · ${money(o.total)} · ${o.status||'Pending'}`;const a=document.createElement('a');a.className='inline-link';a.href=`track.html?id=${encodeURIComponent(o.id)}`;a.textContent='View order';item.append(p,a);orders.append(item);});}).catch(err=>{console.error(err);orders.textContent='Could not load orders. Please refresh.';});}
 });
 $('#signOutBtn')?.addEventListener('click',async()=>{await signOut(auth);location.href='index.html';});
}
function initCheckout(){
 const form=$('#checkoutForm');if(!form)return;const cart=getCart(),message=$('#formMessage');if(!cart.length){$('#checkoutEmpty')?.classList.remove('hidden');form.classList.add('hidden');return;}
 const total=cart.reduce((n,i)=>n+i.price*i.qty,0);if($('#checkoutTotal'))$('#checkoutTotal').textContent=money(total);const itemsBox=$('#checkoutItems');if(itemsBox)itemsBox.textContent=cart.map(i=>`${i.name} × ${i.qty}`).join(' · ');
 onAuthStateChanged(auth,user=>{if(!user){$('#loginRequired')?.classList.remove('hidden');form.classList.add('hidden');}else{$('#loginRequired')?.classList.add('hidden');form.classList.remove('hidden');if($('#customerName')&&!$('#customerName').value)$('#customerName').value=user.displayName||'';if($('#customerEmail'))$('#customerEmail').value=user.email||'';}});
 form.addEventListener('submit',async e=>{e.preventDefault();hideMessage(message);const user=auth.currentUser;if(!user){showMessage(message,'Please sign in before placing an order.');return;}if(!getCart().length){showMessage(message,'Your cart is empty.');return;}
  const btn=$('#placeOrderBtn');setBusy(btn,true,'Placing order…');
  try{
   const name=safeText($('#customerName').value),phone=safeText($('#customerPhone').value),address=safeText($('#deliveryAddress').value),payment=safeText($('#paymentMethod').value),note=safeText($('#orderNote')?.value);
   if(name.length<2||phone.length<7||address.length<8)throw new Error('Please provide your name, a valid phone number, and complete delivery address.');
   const freshCart=getCart();const items=freshCart.map(i=>({productId:String(i.id),name:String(i.name).slice(0,120),price:Number(i.price),quantity:Number(i.qty),image:String(i.image||'').slice(0,500)}));
   if(items.some(i=>!Number.isFinite(i.price)||i.price<0||!Number.isInteger(i.quantity)||i.quantity<1))throw new Error('Your cart contains an invalid item. Please update your cart.');
   const subtotal=items.reduce((sum,i)=>sum+i.price*i.quantity,0);const orderRef=doc(collection(db,'orders'));const order={orderId:orderRef.id,userId:user.uid,customerName:name,customerEmail:user.email||'',customerPhone:phone,deliveryAddress:address,paymentMethod:payment,note:note.slice(0,500),items,subtotal,deliveryFee:0,total:subtotal,status:'Pending',createdAt:serverTimestamp()};
   await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js').then(({setDoc})=>setDoc(orderRef,order));saveCart([]);location.href=`success.html?id=${encodeURIComponent(orderRef.id)}`;
  }catch(err){console.error(err);const friendly=err.code==='permission-denied'?'Firebase denied the order. Check the Firestore rules included in the project README.':(err.message||'Could not place your order. Please try again.');showMessage(message,friendly);}finally{setBusy(btn,false);}
 });
}
function initSuccess(){const id=new URLSearchParams(location.search).get('id');const box=$('#successOrderId');if(box)box.textContent=id||'Not available';const detail=$('#successDetails');if(!id||!detail)return;onAuthStateChanged(auth,async user=>{if(!user){detail.textContent='Sign in with the account used to place this order to view its details.';return;}try{const snap=await getDoc(doc(db,'orders',id));if(!snap.exists()||snap.data().userId!==user.uid){detail.textContent='Order details are unavailable for this account.';return;}const o=snap.data();detail.textContent=`Order total: ${money(o.total)} · Status: ${o.status||'Pending'}`;}catch(e){console.error(e);detail.textContent='Your order was submitted, but its details could not be loaded right now.';}});}
function initTrack(){const form=$('#trackForm');if(!form)return;const result=$('#trackResult'),message=$('#formMessage');const preset=new URLSearchParams(location.search).get('id');if(preset&&$('#orderId'))$('#orderId').value=preset;
 form.addEventListener('submit',async e=>{e.preventDefault();hideMessage(message);result?.classList.add('hidden');const user=auth.currentUser;if(!user){showMessage(message,'Please sign in to track orders linked to your account.');return;}const id=safeText($('#orderId').value);if(!id){showMessage(message,'Enter your order ID.');return;}const btn=$('#trackSubmit');setBusy(btn,true,'Checking…');try{const snap=await getDoc(doc(db,'orders',id));if(!snap.exists()||snap.data().userId!==user.uid){showMessage(message,'We could not find that order in your account. Check the ID or sign in to the correct account.');return;}const o=snap.data();$('#trackStatus').textContent=o.status||'Pending';$('#trackTotal').textContent=money(o.total);$('#trackDate').textContent=o.createdAt?.toDate?o.createdAt.toDate().toLocaleString():'Recently placed';$('#trackItems').textContent=(o.items||[]).map(i=>`${i.name} × ${i.quantity}`).join(', ');result?.classList.remove('hidden');}catch(err){console.error(err);showMessage(message,'Could not check this order. Please try again.');}finally{setBusy(btn,false);}});
}
function init(){updateCartCount();initStore();initCart();initAuth();initAccount();initCheckout();initSuccess();initTrack();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
