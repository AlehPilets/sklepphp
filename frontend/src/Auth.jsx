import { useState } from 'react';

export default function Auth({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? 'login' : 'register';
    
    try {
      const res = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          setUser(data); 
        } else {
          alert("Rejestracja pomyślna! Teraz możesz się zalogować.");
          setIsLogin(true);
        }
      } else {
        alert(data.message || "Wystąpił błąd");
      }
    } catch (err) {
      alert("Błąd połączenia z serwerem. Upewnij się, że backend działa.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="p-8 bg-white shadow-xl rounded-[2rem] w-full max-w-md border">
        <h2 className="text-3xl font-black mb-8 text-center text-gray-800 tracking-tight">
          {isLogin ? "Logowanie" : "Rejestracja"}
        </h2>
        
        <input 
          type="text" placeholder="Imię użytkownika" 
          className="w-full p-4 bg-gray-50 border rounded-2xl mb-4 outline-none focus:ring-2 ring-blue-500"
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
        <input 
          type="password" placeholder="Hasło" 
          className="w-full p-4 bg-gray-50 border rounded-2xl mb-6 outline-none focus:ring-2 ring-blue-500"
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />

        <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition shadow-lg">
          {isLogin ? "Zaloguj się" : "Zarejestruj się"}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          {isLogin ? "Nie masz konta?" : "Masz już konto?"}
          <button 
            type="button"
            className="ml-2 text-blue-600 font-bold hover:underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Zarejestruj się" : "Zaloguj się"}
          </button>
        </p>
      </form>
    </div>
  );
}