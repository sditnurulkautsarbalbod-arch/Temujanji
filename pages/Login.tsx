import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded for demo purposes. In real app, use proper auth.
    if (password === 'admin123' || password === 'guru123') {
      navigate('/admin/dashboard');
    } else {
      setError('Password salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-emerald-100 p-3 rounded-full mb-4">
            <Lock className="text-emerald-600 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Login Admin</h2>
          <p className="text-slate-500 text-sm">Akses khusus Guru & Staf</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Masukkan password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Masuk
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>Demo Password: admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;