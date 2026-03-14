'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Entrando...');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus('Login realizado com sucesso.');
    router.push('/admin');
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 420, margin: '60px auto', padding: 24 }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Login Admin</h1>

        <form onSubmit={handleLogin} className="grid">
          <div>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit">Entrar</button>
          <div>{status}</div>
        </form>
      </div>
    </main>
  );
}