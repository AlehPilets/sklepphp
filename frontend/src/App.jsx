import { useState, useEffect } from 'react';
import Auth from './Auth';

function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  
  // Widoki: 'shop', 'details', 'edit', 'checkout', 'ordered'
  const [view, setView] = useState('shop'); 
  const [activeProduct, setActiveProduct] = useState(null);
  
  // Formularze
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', image: '', category: 'Elektronika' });
  const [editProduct, setEditProduct] = useState(null);

  // Filtrowanie, sortowanie i dane
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');
  const [sortBy, setSortBy] = useState('default'); // NOWE: Stan sortowania
  
  const [delivery, setDelivery] = useState('odbior'); 
  const [paymentMethod, setPaymentMethod] = useState('blik');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState({ city: '', street: '', house: '', apt: '', zip: '' });

  const categories = ['Wszystkie', 'Elektronika', 'Odzież', 'Dom i Ogród', 'Sport i Hobby', 'Uroda', 'Zabawki', 'Inne'];

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchProducts(); }, []);

  // --- OBLICZENIA ---
  const cartSubtotal = cart.reduce((a, b) => a + (Number(b.price) * b.quantity), 0);
  const deliveryCost = delivery === 'kurier' ? 30 : 0;
  const totalAmount = cartSubtotal + deliveryCost;

  // --- LOGIKA FILTROWANIA I SORTOWANIA ---
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (selectedCategory === 'Wszystkie' || p.category === selectedCategory)
  );

  // NOWE: Logika sortowania
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'low') return a.price - b.price;
    if (sortBy === 'high') return b.price - a.price;
    return 0; // domyślna kolejność
  });

  // --- LOGIKA FUNKCJI ---

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 9) setPhone(val);
  };

  const handleFinalizeOrder = () => {
    if (phone.length !== 9) {
      alert("Numer telefonu musi mieć dokładnie 9 cyfr!");
      return;
    }
    if (delivery === 'kurier' && (!address.city || !address.street || !address.house || !address.zip)) {
      alert("Proszę wypełnić wymagane pola adresowe!");
      return;
    }
    setView('ordered');
  };

  const addProduct = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });
    if (res.ok) {
      setNewProduct({ name: '', price: '', description: '', image: '', category: 'Elektronika' });
      fetchProducts();
    }
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    const res = await fetch(`http://localhost:5000/api/products/${editProduct._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editProduct)
    });
    if (res.ok) { setView('shop'); fetchProducts(); }
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Usunąć produkt?")) {
      await fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const exist = prev.find(x => x._id === product._id);
      if (exist) return prev.map(x => x._id === product._id ? {...x, quantity: x.quantity + 1} : x);
      return [...prev, {...product, quantity: 1}];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const exist = prev.find(x => x._id === id);
      if (exist.quantity > 1) return prev.map(x => x._id === id ? {...x, quantity: x.quantity - 1} : x);
      return prev.filter(x => x._id !== id);
    });
  };

  if (!user) return <Auth setUser={setUser} />;

  // --- WIDOK: SUKCES ---
  if (view === 'ordered') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans text-center">
        <div className="bg-white p-16 rounded-[4rem] shadow-2xl max-w-2xl border w-full">
          <div className="text-7xl mb-6">✅</div>
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Zamówienie przyjęte!</h2>
          <p className="text-gray-500 mb-10 text-lg font-medium leading-relaxed px-6">
            {delivery === 'kurier' 
              ? `Dziękujemy! Kurier skontaktuje się pod numerem +48 ${phone} w celu dostawy zamówienia na Twój adres.` 
              : `Twój numer +48 ${phone} został zapisany. Czekaj na wiadomość o gotowości towaru do wydania.`}
          </p>
          <div className="bg-blue-50 p-6 rounded-3xl mb-10 font-black text-2xl text-blue-700">Zapłacono: {totalAmount} zł</div>
          <button onClick={() => { setView('shop'); setCart([]); setPhone(''); }} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-bold uppercase tracking-widest shadow-xl hover:bg-blue-700 transition">Wróć do sklepu</button>
        </div>
      </div>
    );
  }

  // --- WIDOK: SZCZEGÓŁY (PRZYCISK W ROGU + ROZCIĄGNIĘTA KARTA) ---
  if (view === 'details' && activeProduct) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans flex flex-col items-center">
        <div className="max-w-[1440px] w-full text-left mb-6">
          <button 
            onClick={() => setView('shop')} 
            className="flex items-center gap-2 font-black text-gray-400 uppercase tracking-widest text-sm hover:text-blue-600 transition"
          >
            <span className="text-2xl">←</span> Wróć do sklepu
          </button>
        </div>

        <div className="max-w-[1440px] w-full bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
          <div className="md:w-1/2 h-[600px] bg-gray-50">
            <img src={activeProduct.image} className="w-full h-full object-contain" alt={activeProduct.name} />
          </div>
          <div className="md:w-1/2 p-12 md:p-20 flex flex-col justify-center">
            <span className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-[0.2em]">{activeProduct.category}</span>
            <h2 className="text-5xl font-black mb-6 leading-none tracking-tighter text-gray-900">{activeProduct.name}</h2>
            <p className="text-gray-400 text-lg mb-12 leading-relaxed font-medium">{activeProduct.description || "Niesamowity produkt o najwyższej jakości, teraz dostępny w naszej ofercie."}</p>
            <div className="flex items-center justify-between p-8 bg-gray-50 rounded-[3rem] border border-gray-100">
               <span className="text-4xl font-black text-gray-900">{activeProduct.price} zł</span>
               <button onClick={() => { addToCart(activeProduct); setView('shop'); }} className="bg-green-500 text-white px-10 py-5 rounded-[2rem] font-bold uppercase text-xs tracking-widest shadow-xl hover:bg-green-600 transition">Do koszyka</button>
            </div>
            {user.role === 'admin' && (
              <button onClick={() => { setEditProduct(activeProduct); setView('edit'); }} className="mt-8 text-[10px] text-orange-500 font-bold uppercase border-2 border-orange-50 py-3 rounded-2xl tracking-[0.3em] hover:bg-orange-50 transition">Edytuj ten produkt</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- WIDOK: PŁATNOŚĆ (CHECKOUT) ---
  if (view === 'checkout') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-sm font-sans">
        <button onClick={() => setView('shop')} className="mb-6 font-black text-blue-600 uppercase text-xs tracking-widest">← Wróć do koszyka</button>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border">
              <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter text-gray-800 underline decoration-blue-500 decoration-4 underline-offset-8">Metoda dostawy</h2>
              <div className="grid gap-4 mb-8 font-bold">
                <button onClick={() => setDelivery('odbior')} className={`flex justify-between items-center p-6 rounded-3xl border-4 transition ${delivery === 'odbior' ? 'border-blue-600 bg-blue-50' : 'border-gray-50'}`}>
                  <span>Odbiór osobisty</span><span className="text-green-600 uppercase text-xs font-black tracking-widest font-sans font-sans">Gratis</span>
                </button>
                <button onClick={() => setDelivery('kurier')} className={`flex justify-between items-center p-6 rounded-3xl border-4 transition ${delivery === 'kurier' ? 'border-blue-600 bg-blue-50' : 'border-gray-50'}`}>
                  <span>Kurier pod adres</span><span className="font-black uppercase text-xs tracking-widest font-sans font-sans">30 zł</span>
                </button>
              </div>

              <div className="space-y-3">
                {delivery === 'kurier' && (
                  <div className="grid gap-2 animate-fadeIn border-t pt-6 border-dashed">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Miasto" className="p-4 bg-gray-50 border-2 rounded-2xl outline-none" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
                      <input type="text" placeholder="Kod pocztowy" className="p-4 bg-gray-50 border-2 rounded-2xl outline-none" value={address.zip} onChange={e => setAddress({...address, zip: e.target.value})} />
                    </div>
                    <input type="text" placeholder="Ulica" className="p-4 bg-gray-50 border-2 rounded-2xl outline-none" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Nr domu" className="p-4 bg-gray-50 border-2 rounded-2xl outline-none" value={address.house} onChange={e => setAddress({...address, house: e.target.value})} />
                      <input type="text" placeholder="Nr lokalu" className="p-4 bg-gray-50 border-2 rounded-2xl outline-none" value={address.apt} onChange={e => setAddress({...address, apt: e.target.value})} />
                    </div>
                  </div>
                )}
                <div className="flex items-center bg-gray-50 border-2 rounded-2xl overflow-hidden mt-6 ring-2 ring-blue-50 focus-within:ring-blue-600 transition">
                  <span className="px-6 py-4 bg-gray-200 font-black text-gray-500 text-lg">+48</span>
                  <input type="tel" placeholder="Twój numer (9 cyfr)" className="w-full p-4 bg-transparent outline-none font-black text-lg tracking-widest placeholder:font-normal placeholder:tracking-normal" value={phone} onChange={handlePhoneChange} />
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-xl border">
              <h2 className="text-xl font-black mb-8 uppercase tracking-tighter">Płatność</h2>
              <div className="grid grid-cols-3 gap-3">
                {['blik', 'visa', 'mastercard'].map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)} className={`p-5 rounded-2xl border-4 flex flex-col items-center gap-2 transition ${paymentMethod === m ? 'border-blue-600 bg-blue-50' : 'opacity-40'}`}>
                    <span className="font-black uppercase text-[10px] tracking-widest">{m}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[4rem] shadow-2xl border-4 border-gray-50 h-fit sticky top-10 flex flex-col items-center text-center">
            <h2 className="text-3xl font-black mb-10 uppercase tracking-tighter underline decoration-blue-600 underline-offset-8 font-sans">Twoje zamówienie</h2>
            <div className="space-y-4 mb-10 text-gray-400 font-bold w-full px-6">
               <div className="flex justify-between px-4"><span>Produkty:</span><span className="text-gray-900">{cartSubtotal} zł</span></div>
               <div className="flex justify-between px-4"><span>Dostawa:</span><span className="text-gray-900">{deliveryCost} zł</span></div>
               <div className="border-t-2 pt-6 flex justify-between items-center text-gray-900 px-4">
                 <span className="font-black uppercase text-xs tracking-widest font-sans">RAZEM:</span>
                 <span className="text-5xl font-black text-blue-600 tracking-tighter leading-none">{totalAmount} zł</span>
               </div>
            </div>
            <button onClick={handleFinalizeOrder} className="w-full bg-blue-600 text-white py-8 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-black transition tracking-widest active:scale-95 uppercase font-sans">Potwierdzam i kupuję</button>
          </div>
        </div>
      </div>
    );
  }

  // --- WIDOK 4: EDYCJA ---
  if (view === 'edit' && editProduct) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center font-sans">
        <div className="bg-white p-16 rounded-[4rem] shadow-2xl w-full max-w-xl border">
          <h2 className="text-2xl font-black mb-8 uppercase tracking-widest text-center text-gray-900 font-sans">Edytuj Produkt</h2>
          <form onSubmit={updateProduct} className="space-y-4">
            <input type="text" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold font-sans" value={editProduct.name} onChange={e => setEditProduct({...editProduct, name: e.target.value})} required />
            <input type="number" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold font-sans" value={editProduct.price} onChange={e => setEditProduct({...editProduct, price: e.target.value})} required />
            <select className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold font-sans" value={editProduct.category} onChange={e => setEditProduct({...editProduct, category: e.target.value})}>
              {categories.slice(1).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <textarea className="w-full p-4 bg-gray-50 border-2 rounded-2xl h-32 font-sans" value={editProduct.description} onChange={e => setEditProduct({...editProduct, description: e.target.value})} />
            <input type="text" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold font-sans" value={editProduct.image} onChange={e => setEditProduct({...editProduct, image: e.target.value})} />
            <div className="flex gap-4 pt-6">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-100 font-sans">Zapisz zmiany</button>
              <button type="button" onClick={() => setView('shop')} className="px-10 py-6 bg-gray-100 rounded-2xl font-black uppercase text-xs tracking-widest text-gray-400 font-sans">Anuluj</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- WIDOK: SKLEP (GŁÓWNY) ---
  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      <nav className="bg-white shadow-sm p-5 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl font-black text-blue-600 tracking-tighter cursor-pointer" onClick={() => setView('shop')}>Sklep internetowy</h1>
        
        {/* WYSZUKIWARKA I SORTOWANIE */}
        <div className="flex-grow max-w-lg mx-6 flex items-center gap-3">
          <div className="relative flex-grow">
            <input type="text" placeholder="Czego szukasz?..." className="w-full p-3 pl-12 bg-gray-100 rounded-2xl text-[11px] outline-none border-2 border-transparent focus:border-blue-400 transition font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <span className="absolute left-4 top-3.5 opacity-30 text-xs text-gray-500">🔍</span>
          </div>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-100 border-none rounded-2xl p-3 text-[11px] font-black uppercase tracking-tighter outline-none focus:ring-2 ring-blue-400 cursor-pointer transition whitespace-nowrap text-gray-500"
          >
            <option value="default">Sortowanie</option>
            <option value="low">Od niskiej</option>
            <option value="high">Od wysokiej</option>
          </select>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black bg-blue-50 px-4 py-2 rounded-full uppercase tracking-widest text-blue-700 border border-blue-100 shadow-sm">{user.name}</span>
          <button onClick={() => setUser(null)} className="text-[10px] text-red-500 font-black uppercase tracking-widest hover:scale-110 transition duration-300">Wyloguj</button>
        </div>
      </nav>

      <div className="max-w-[1500px] mx-auto p-4">
        
        {/* PANEL ADMINA: POMARAŃCZOWA RAMKA */}
        {user.role === 'admin' && (
          <div className="bg-white p-8 rounded-[3rem] shadow-md mb-10 border-t-8 border-orange-400 mx-2">
            <h2 className="text-xl font-black mb-6 text-gray-800 uppercase tracking-widest flex items-center gap-3 font-sans">🛠️ Panel Zarządzania</h2>
            <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <input type="text" placeholder="Nazwa towaru" className="p-4 bg-gray-50 border-2 rounded-2xl outline-none font-bold font-sans" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <input type="number" placeholder="Cena" className="p-4 bg-gray-50 border-2 rounded-2xl outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold font-sans" required value={newProduct.price} onChange={e => { if(e.target.value >= 0) setNewProduct({...newProduct, price: e.target.value}) }} />
              <select className="p-4 bg-gray-50 border-2 rounded-2xl outline-none font-bold font-sans" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                {categories.slice(1).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input type="text" placeholder="Opis" className="p-4 bg-gray-50 border-2 rounded-2xl outline-none font-bold font-sans" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
              <input type="text" placeholder="URL zdjęcia" className="p-4 bg-gray-50 border-2 rounded-2xl outline-none font-bold font-sans" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
              <button className="bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 h-[65px] transition md:col-span-5 uppercase tracking-[0.2em] shadow-xl shadow-orange-100 active:scale-95 font-sans">Zapisz produkt w bazie</button>
            </form>
          </div>
        )}

        {/* СЕКЦИЯ КАТЕГОРИЙ И СОРТИРОВКИ */}
<div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 px-2">
  
  {/* ЛЕВАЯ ЧАСТЬ: КАТЕГОРИИ */}
  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
    {categories.map(cat => (
      <button 
        key={cat} 
        onClick={() => setSelectedCategory(cat)} 
        className={`px-8 py-3 rounded-full font-black text-[10px] transition whitespace-nowrap uppercase tracking-widest font-sans ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-xl translate-y-[-2px]' : 'bg-white text-gray-400 border-2 hover:bg-gray-50'}`}
      >
        {cat}
      </button>
    ))}
  </div>

  {/* ПРАВАЯ ЧАСТЬ: СИНЯЯ КНОПКА СОРТИРОВКИ */}
  <div className="flex items-center">
    <select 
      value={sortBy} 
      onChange={(e) => setSortBy(e.target.value)}
      className="bg-blue-600 text-white border-none rounded-2xl px-6 py-3 text-[11px] font-black uppercase tracking-tighter outline-none cursor-pointer transition hover:bg-blue-700 shadow-lg active:scale-95"
    >
      <option value="default" className="bg-white text-gray-800">Sortowanie</option>
      <option value="low" className="bg-white text-gray-800">Od niskiej</option>
      <option value="high" className="bg-white text-gray-800">Od wysokiej</option>
    </select>
  </div>
</div>

        <div className="flex flex-col lg:flex-row gap-10 px-2 font-sans">
          {/* KATALOG PRODUKTÓW (POSORTOWANY) */}
          <div className="flex-grow">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
              {sortedProducts.map(product => (
                <div key={product._id} className="bg-white p-4 shadow-xl rounded-[2.5rem] hover:shadow-2xl transition duration-500 group relative flex flex-col cursor-pointer border-2 border-transparent hover:border-blue-50" onClick={() => { setActiveProduct(product); setView('details'); }}>
                  {user.role === 'admin' && (
                    <button onClick={(e) => { e.stopPropagation(); deleteProduct(product._id); }} className="absolute top-4 right-4 bg-red-500 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition z-20 flex items-center justify-center font-bold shadow-lg">✕</button>
                  )}
                  <div className="overflow-hidden rounded-[2rem] mb-4 h-36 bg-gray-50 shadow-inner">
                    <img src={product.image || 'https://via.placeholder.com/200'} className="w-full h-full object-contain group-hover:scale-110 transition duration-1000" alt={product.name} />
                  </div>
                  <h3 className="font-black text-[11px] text-gray-800 px-1 line-clamp-1 mb-1 uppercase tracking-tight font-sans">{product.name}</h3>
                  <p className="text-gray-400 text-[9px] px-1 h-6 overflow-hidden line-clamp-1 leading-tight font-bold uppercase tracking-tighter opacity-60 font-sans">{product.category}</p>
                  <div className="mt-auto flex justify-between items-center bg-gray-50 p-2.5 rounded-3xl">
                    <span className="text-blue-600 font-black text-base ml-1 tracking-tighter font-sans">{product.price} zł</span>
                    <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="bg-green-500 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition shadow-md hover:bg-green-600 active:scale-90 font-sans">Kup</button>
                  </div>
                </div>
              ))}
            </div>
            {sortedProducts.length === 0 && <div className="text-center py-20 text-gray-300 font-black uppercase tracking-widest italic font-sans">Nie znaleziono towaru...</div>}
          </div>

          {/* BOCZNY KOSZYK */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl sticky top-28 border-4 border-gray-50 font-sans">
              <h2 className="text-sm font-black mb-6 uppercase flex justify-between tracking-[0.2em] text-gray-800 font-sans">Koszyk <span className="bg-blue-600 text-white px-3 py-1 rounded-xl text-[10px] tracking-normal font-sans font-sans font-sans font-sans font-sans font-sans font-sans">{cart.reduce((a,b)=>a+b.quantity,0)}</span></h2>
              {cart.length === 0 ? <p className="text-center py-16 text-gray-200 font-black uppercase text-[10px] tracking-[0.3em] italic font-sans font-sans font-sans font-sans font-sans font-sans font-sans">Koszyk pusty</p> : (
                <>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto mb-8 pr-2 custom-scrollbar font-sans font-sans font-sans font-sans font-sans font-sans font-sans">
                    {cart.map((item) => (
                      <div key={item._id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 group font-sans font-sans font-sans font-sans font-sans font-sans font-sans">
                        <img src={item.image} className="w-11 h-11 object-contain rounded-xl shadow-sm font-sans font-sans font-sans font-sans font-sans font-sans font-sans" alt="" />
                        <div className="flex-grow min-w-0 font-sans font-sans font-sans font-sans font-sans font-sans font-sans">
                          <h4 className="text-[9px] font-black uppercase truncate text-gray-700 leading-none mb-2 tracking-tight font-sans font-sans font-sans font-sans font-sans font-sans font-sans">{item.name}</h4>
                          <div className="flex justify-between items-center font-sans font-sans font-sans font-sans font-sans font-sans font-sans">
                             <span className="font-black text-blue-600 text-[10px] tracking-tighter font-sans font-sans font-sans font-sans font-sans font-sans font-sans">{item.price} zł</span>
                             <div className="flex gap-3 font-black bg-white px-2 py-1 rounded-xl border text-[10px] shadow-sm font-sans font-sans font-sans font-sans font-sans font-sans font-sans">
                                <button onClick={() => removeFromCart(item._id)} className="text-red-500 hover:scale-150 transition">-</button>
                                <span className="text-gray-500">{item.quantity}</span>
                                <button onClick={() => addToCart(item)} className="text-green-500 hover:scale-150 transition">+</button>
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t-4 border-dashed border-gray-50 pt-6 flex justify-between items-center mb-8 px-2 font-sans font-sans font-sans font-sans font-sans font-sans font-sans">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none font-sans font-sans font-sans font-sans font-sans font-sans font-sans">RAZEM:</span>
                    <span className="text-3xl font-black text-gray-900 leading-none tracking-tighter font-sans font-sans font-sans font-sans font-sans font-sans font-sans">{cartSubtotal} zł</span>
                  </div>
                  <button onClick={() => setView('checkout')} className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 active:scale-95 transition hover:bg-black font-sans font-sans font-sans font-sans font-sans font-sans font-sans">Przejdź do płatności</button>
                </>
              )}
            </div>
			
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;