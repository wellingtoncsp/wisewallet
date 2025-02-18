import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, ArrowLeft } from 'lucide-react';
import Modal from '../components/Modal';
import { TERMS_OF_USE, PRIVACY_POLICY } from '../constants/terms';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    birthDate: '',
    cpf: '',
    gender: '',
    acceptedTerms: false
  });
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [modalType, setModalType] = useState<string | null>(null);

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cpf') {
      setFormData(prev => ({
        ...prev,
        [name]: formatCPF(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.acceptedTerms) {
      setError('Você precisa aceitar os termos de uso e política de privacidade');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      await signUp(formData.email, formData.password, {
        uid: '',
        name: formData.name,
        email: formData.email,
        birthDate: formData.birthDate,
        cpf: formData.cpf,
        gender: formData.gender as 'male' | 'female' | 'other' | '',
        currency: 'BRL',
        updatedAt: new Date()
      });
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está cadastrado. Por favor, use outro email ou faça login.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido. Por favor, verifique o email informado.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha é muito fraca. Use pelo menos 6 caracteres com letras e números.');
      } else {
        setError('Ocorreu um erro ao criar a conta. Por favor, tente novamente.');
        console.error('Erro detalhado:', err);
      }
    }
  };

  useEffect(() => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        input.addEventListener('invalid', (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (target.validity.valueMissing) {
            target.setCustomValidity('Este campo é obrigatório');
          } else if (target.validity.typeMismatch) {
            target.setCustomValidity('Por favor, insira um valor válido');
          }
        });

        input.addEventListener('input', (e: Event) => {
          const target = e.target as HTMLInputElement;
          target.setCustomValidity('');
        });
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Botão Voltar */}
      <div className="absolute top-4 left-4">
        <Link
          to="/"
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar para Home
        </Link>
      </div>

      {/* Container centralizado */}
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                title="Por favor, insira um email válido"
              />
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                Data de Nascimento <span className="text-red-500">*</span>
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                required
                value={formData.birthDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                CPF
              </label>
              <input
                id="cpf"
                name="cpf"
                type="text"
                maxLength={14}
                value={formData.cpf}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Gênero
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selecione</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Senha <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  checked={formData.acceptedTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, acceptedTerms: e.target.checked }))}
                  className={`
                    mt-1 rounded border-gray-300 text-blue-600 shadow-sm 
                    focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50
                    ${!formData.acceptedTerms && error ? 'border-red-500 ring-red-500' : ''}
                  `}
                  required
                  aria-required="true"
                  title="Você precisa aceitar os termos para continuar"
                />
                <span className={`text-sm ${!formData.acceptedTerms && error ? 'text-red-600' : 'text-gray-600'}`}>
                  <span className="text-red-500">* </span>
                  Li e concordo com os{' '}
                  <button
                    type="button"
                    onClick={() => setModalType('terms')}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Termos de Uso
                  </button>
                  {' '}e{' '}
                  <button
                    type="button"
                    onClick={() => setModalType('privacy')}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Política de Privacidade
                  </button>
                </span>
              </label>
              {!formData.acceptedTerms && error && (
                <p className="mt-1 text-sm text-red-600">
                  Você precisa aceitar os termos de uso e política de privacidade para continuar
                </p>
              )}
            </div>

            <div className="text-sm text-gray-500">
              <span className="text-red-500">*</span> Campos obrigatórios
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Criar Conta
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Entrar
            </Link>
          </p>
        </div>
      </div>

      {/* Modal de Termos */}
      <Modal
        isOpen={modalType === 'terms'}
        onClose={() => setModalType(null)}
        title="Termos de Uso"
      >
        <div dangerouslySetInnerHTML={{ __html: TERMS_OF_USE }} />
      </Modal>

      <Modal
        isOpen={modalType === 'privacy'}
        onClose={() => setModalType(null)}
        title="Política de Privacidade"
      >
        <div dangerouslySetInnerHTML={{ __html: PRIVACY_POLICY }} />
      </Modal>
    </div>
  );
}