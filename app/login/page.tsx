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
  const [isLoading, setIsLoading] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setActiveCard(activeCard === cardId ? null : cardId);
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setStatus('Entrando...');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
      setIsLoading(false);
      return;
    }

    setStatus('Login realizado com sucesso.');
    router.push('/admin');
    router.refresh();
  }

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            NAUTIMAR LIVE
          </a>
        </div>
      </nav>

      <main className="d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
        <div className="w-100" style={{ maxWidth: 420 }}>
          <div className={`card ${activeCard === 'login' ? 'active' : ''}`} onClick={() => toggleCard('login')}>
            <div className="card-body">
              <h1 className="card-title text-center mb-4">Acesso Admin</h1>

              <form onSubmit={handleLogin}>
                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="emailInput" className="form-label">Email</label>
                  <input
                    id="emailInput"
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Senha */}
                <div className="mb-4">
                  <label htmlFor="passwordInput" className="form-label">Senha</label>
                  <input
                    id="passwordInput"
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="sua senha"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Botão */}
                <button type="submit" className="btn btn-primary btn-lg w-100 mb-3" disabled={isLoading}>
                  {isLoading ? '⏳ Entrando...' : '🚀 Entrar'}
                </button>

                {/* Status */}
                {status && (
                  <div className={`alert ${status.includes('sucesso') ? 'alert-success' : status.includes('Entrando') ? 'alert-info' : 'alert-danger'}`} role="alert">
                    {status}
                  </div>
                )}
              </form>

              <hr className="border-warning" />
              <p className="text-center text-muted mb-0">
                Apenas administradores podem acessar este painel.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}