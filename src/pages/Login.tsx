import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      // O redirecionamento será feito automaticamente pelo PublicRoute
    } catch (err) {
      console.error('Login error:', err);
      setError('Email ou senha inválidos. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="absolute top-4 left-4">
        <Link
          to="/"
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar para Home
        </Link>
      </div>

      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                    Wise
                  </span>
                  <span className="text-2xl font-bold text-gray-700">Wallet</span>
                </div>
                <span className="text-xs text-gray-500">Gestão Financeira Inteligente</span>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;