import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart2, 
  Target, 
  Users, 
  PieChart, 
  TrendingUp,
  Shield,
  Star,
  Wallet,
  ArrowRight,
  Bell,
  Lock,
  Server,
  LinkedinIcon,
  HelpCircle, 
  Mail, 
  User, 
  FileText,
  Globe
} from 'lucide-react';
import Modal from '../components/Modal';
import imgAvatar from '../img/avatar.png'
import { TERMS_OF_USE, PRIVACY_POLICY } from '../constants/terms';
import { SupportModal } from '../components/SupportModal';
import avatar1 from '/src/img/persons/avatar-1.jpg';
import avatar2 from '/src/img/persons/avatar-2.jpg';
import avatar3 from '/src/img/persons/avatar-3.jpg';
import avatar4 from '/src/img/persons/avatar-4.jpg';
import avatar5 from '/src/img/persons/avatar-5.jpg';
import avatar6 from '/src/img/persons/avatar-6.jpg';
import avatar7 from '/src/img/persons/avatar-7.jpg';
import imgDashboard from '/src/img/dashboard.png';
import imgDesktop from '/src/img/desktop.png';
import imgMobile from '/src/img/mobile.png';
export default function Home() {
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'faq' | 'contact' | 'about' | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const handleModal = (type: typeof modalType) => {
    setModalType(type);
  };
  const avatars = [
    { id: 1, src: avatar1 },
    { id: 2, src:  avatar2 },
    { id: 3, src:  avatar3 },
    { id: 4, src:  avatar4 },
    { id: 5, src:  avatar5 },
    { id: 6, src:  avatar6 },
    { id: 7, src:  avatar7 },
  ];
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
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

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600">Funcionalidades</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600">Depoimentos</a>
              <a href="#security" className="text-gray-600 hover:text-blue-600">Segurança</a>
              <Link to="/login" className="text-gray-600 hover:text-blue-600">Entrar</Link>
              <Link 
                to="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Começar Grátis
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section com gradiente e formas geométricas */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-50"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full opacity-50"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-12 lg:mb-0">
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-6">
                ✨ Sua jornada financeira começa aqui
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Domine Suas Finanças com Inteligência e Facilidade
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transforme sua relação com o dinheiro. Controle gastos, defina metas e 
                compartilhe carteiras para uma gestão financeira colaborativa e eficiente.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  Começar Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors border-2 border-blue-600 w-full sm:w-auto"
                >
                  Entrar
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-2">
                {avatars.map(avatar => (
                    <img
                      key={avatar.id}
                      src={avatar.src}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-full border-2 border-white"
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  <strong className="text-blue-600">+1000</strong> pessoas já estão no controle
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-xl p-2">
                <img
                  src={imgDashboard}
                  alt="Dashboard WiseWallet"
                  className="rounded-xl"
                />
              </div>
              {/* Elementos decorativos */}
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-72 h-72 bg-purple-200 rounded-full filter blur-3xl opacity-30"></div>
              <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-72 h-72 bg-blue-200 rounded-full filter blur-3xl opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Benefícios */}
      <section className="py-12 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <BenefitCard icon={<Shield />} label="Dados Seguros" />
            <BenefitCard icon={<TrendingUp />} label="Atualização em Tempo Real" />
            <BenefitCard icon={<Users />} label="Gestão Compartilhada" />
            <BenefitCard icon={<Star />} label="Interface Intuitiva" />
          </div>
        </div>
      </section>

      {/* Features Section com Tabs */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Funcionalidades Poderosas"
            subtitle="Tudo que você precisa para uma gestão financeira completa"
          />

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4 sm:px-0">
            <FeatureCard
              icon={<BarChart2 className="h-8 w-8 text-blue-500" />}
              title="Controle Total"
              description="Dashboard intuitivo com visão completa das suas finanças. Acompanhe receitas, despesas e investimentos em tempo real."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8 text-purple-500" />}
              title="Carteiras Compartilhadas"
              description="Compartilhe carteiras com família ou sócios. Gestão financeira colaborativa com controle de permissões."
            />
            <FeatureCard
              icon={<Target className="h-8 w-8 text-green-500" />}
              title="Metas Inteligentes"
              description="Estabeleça metas financeiras e acompanhe seu progresso com insights personalizados."
            />
            <FeatureCard
              icon={<PieChart className="h-8 w-8 text-orange-500" />}
              title="Relatórios Detalhados"
              description="Visualize seus dados através de gráficos interativos e relatórios personalizados."
            />
            <FeatureCard
              icon={<Bell className="h-8 w-8 text-yellow-500" />}
              title="Alertas Personalizados"
              description="Receba notificações sobre gastos, metas alcançadas e orçamentos."
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8 text-indigo-500" />}
              title="Análise de Gastos"
              description="Identifique padrões de gastos e receba sugestões de economia."
            />
          </div>
        </div>
      </section>

      {/* Seção de Demonstração em Dispositivos */}
      <section id="demo" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Uma Experiência Multiplataforma"
            subtitle="Acesse suas finanças de qualquer lugar, em qualquer dispositivo"
          />

          <div className="mt-16 relative">
            <div className="flex justify-center items-center gap-8">
              <div className="relative">
                <img
                  src={imgDesktop}
                  alt="Desktop Version"
                  className="w-[600px] rounded-lg shadow-xl"
                />
              </div>
              <div className="relative">
                <img
                  src={imgMobile}
                  alt="Mobile Version"
                  className="w-[200px] rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Depoimentos */}
      <section id="testimonials" className="py-20 bg-blue-50">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="O Que Nossos Usuários Dizem"
            subtitle="Histórias reais de pessoas que transformaram suas finanças"
          />

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              avatar={avatar1}
              name="Joana Bittencourt"
              role="Empresária"
              content="O WiseWallet revolucionou a forma como gerencio as finanças da minha empresa. A função de compartilhamento de carteiras é simplesmente fantástica!"
            />
            <TestimonialCard
              avatar={avatar2}
              name="João Santos"
              role="Investidor"
              content="Excelente para acompanhar meus investimentos e despesas pessoais. Os relatórios são muito detalhados e me ajudam a tomar melhores decisões."
            />
            <TestimonialCard
              avatar={avatar3}
              name="Ana Costa"
              role="Autônoma"
              content="Como freelancer, precisava de algo para organizar minhas finanças. O WiseWallet é perfeito! Simples, intuitivo e muito eficiente."
            />
          </div>
        </div>
      </section>

      {/* Seção Gratuito Para Sempre */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block px-4 py-2 bg-blue-500 rounded-full text-white text-sm font-medium mb-6">
            ✨ 100% Gratuito
          </div>
          <h2 className="text-4xl font-bold mb-6">
            Totalmente Gratuito. Sem Custos Ocultos.
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Acreditamos que o controle financeiro deve ser acessível a todos. 
            Por isso, o WiseWallet é e sempre será gratuito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              Criar Conta Gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <button onClick={() => setIsSupportModalOpen(true)}
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              Falar com Suporte
            </button>
          </div>
        </div>
      </section>

      {/* Seção de Segurança */}
      <section id="security" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Sua Segurança é Nossa Prioridade"
            subtitle="Utilizamos as mais avançadas tecnologias para proteger seus dados"
          />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <SecurityCard
              icon={<Shield className="h-8 w-8 text-blue-500" />}
              title="Criptografia Avançada"
              description="Seus dados são protegidos com criptografia de ponta a ponta."
            />
            <SecurityCard
              icon={<Lock className="h-8 w-8 text-green-500" />}
              title="Autenticação Segura"
              description="Sistema robusto de autenticação para proteger sua conta."
            />
            <SecurityCard
              icon={<Server className="h-8 w-8 text-purple-500" />}
              title="Backup Automático"
              description="Seus dados são automaticamente sincronizados e backups são realizados diariamente."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              {/* Logo no footer */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-white">Wise</span>
                    <span className="text-2xl font-bold text-gray-300">Wallet</span>
                  </div>
                  <span className="text-xs text-gray-400">Gestão Financeira Inteligente</span>
                </div>
              </div>
              <p className="text-sm">
                Transforme sua gestão financeira em simplicidade e controle.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Suporte</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => handleModal('faq')} className="hover:text-white">
                    FAQ
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsSupportModalOpen(true)} className="hover:text-white">
                    Falar com Suporte
                  </button>
                </li>
                <li>
                  <button onClick={() => handleModal('contact')} className="hover:text-white">
                    Contato
                  </button>
                </li>
                <li>
                  <button onClick={() => handleModal('about')} className="hover:text-white">
                    Sobre o Desenvolvedor
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => handleModal('privacy')} className="hover:text-white">
                    Privacidade
                  </button>
                </li>
                <li>
                  <button onClick={() => handleModal('terms')} className="hover:text-white">
                    Termos de Uso
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-sm">
              © {new Date().getFullYear()} WiseWallet. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Modais */}
      <Modal
        isOpen={modalType === 'faq'}
        onClose={() => setModalType(null)}
        title="Perguntas Frequentes"
        icon={<HelpCircle className="h-6 w-6" />}
      >
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Como funciona o WiseWallet?
            </h3>
            <p className="text-blue-700">
              O WiseWallet é uma plataforma de gestão financeira que permite controlar receitas, 
              despesas, metas e orçamentos de forma simples e intuitiva.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              O WiseWallet é gratuito?
            </h3>
            <p className="text-blue-700">
              Sim! O WiseWallet é totalmente gratuito e não possui custos ocultos.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Como funciona o compartilhamento de carteiras?
            </h3>
            <p className="text-blue-700">
              Você pode convidar familiares ou sócios para compartilhar uma carteira específica, 
              mantendo o controle das permissões e visualizando o histórico de atividades.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Como o WiseWallet protege meus dados?
            </h3>
            <p className="text-blue-700">
              Utilizamos criptografia de ponta a ponta e seguimos rigorosos protocolos de segurança. 
              Seus dados são armazenados em servidores seguros e nunca são compartilhados com terceiros.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Posso acessar de qualquer dispositivo?
            </h3>
            <p className="text-blue-700">
              Sim! O WiseWallet é uma aplicação web responsiva, que funciona perfeitamente em 
              computadores, tablets e smartphones, mantendo seus dados sincronizados em todos os dispositivos.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Como funciona o sistema de metas?
            </h3>
            <p className="text-blue-700">
              Você pode criar metas financeiras com valores e prazos específicos. O sistema acompanha 
              seu progresso, envia notificações de marcos alcançados e fornece sugestões para 
              atingir seus objetivos mais rapidamente.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Como funcionam os relatórios e análises?
            </h3>
            <p className="text-blue-700">
              O WiseWallet oferece relatórios detalhados com gráficos interativos, análise de gastos 
              por categoria, comparativos mensais e projeções futuras, ajudando você a tomar 
              melhores decisões financeiras.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Como recebo as notificações e alertas?
            </h3>
            <p className="text-blue-700">
              O sistema envia alertas sobre orçamentos excedidos, metas alcançadas, dicas de economia 
              e lembretes importantes. Você pode personalizar quais notificações deseja receber.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Posso exportar meus dados?
            </h3>
            <p className="text-blue-700">
              Sim! Você pode exportar seus dados e relatórios em diferentes formatos (PDF, Excel) 
              para análise externa ou backup pessoal.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              E se eu precisar de ajuda?
            </h3>
            <p className="text-blue-700">
              Oferecemos suporte através do email wisesolutions.dev@gmail.com. Nossa equipe 
              está sempre pronta para ajudar você a ter a melhor experiência possível com o WiseWallet.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalType === 'contact'}
        onClose={() => setModalType(null)}
        title="Contato"
        icon={<Mail className="h-6 w-6" />}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Estamos aqui para ajudar!
            </p>
            <p className="text-gray-600 mb-4">
              Entre em contato através do email:
            </p>
            <a 
              href="mailto:wisesolutions.dev@gmail.com" 
              className="text-blue-600 hover:text-blue-700 font-medium text-lg"
            >
              wisesolutions.dev@gmail.com
            </a>
            <p className="text-sm text-gray-500 mt-4">
              Tempo médio de resposta: até 24 horas em dias úteis
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalType === 'about'}
        onClose={() => setModalType(null)}
        title="Sobre o Desenvolvedor"
        icon={<User className="h-6 w-6" />}
      >
        <div className="space-y-6">
          <div className="text-center">
            <img 
              src={imgAvatar} 
              alt="Wellington Carlos" 
              // className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-orange-500 object-cover"
              className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-blue-100 object-cover"
            />
            <h3 className="text-xl font-semibold text-gray-900">Wellington Carlos</h3>
            <p className="text-gray-600">Desenvolvedor Full Stack</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              O WiseWallet foi desenvolvido com ❤️ e dedicação para ajudar pessoas 
              a terem uma vida financeira mais organizada e próspera.
            </p>
            
            <div className="flex justify-center space-x-4">
            <a 
                href="https://br.linkedin.com/in/wellington-porto1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <LinkedinIcon size={24} />
                <span>LinkedIn</span>
              </a>
              <a 
                href="https://wellingtoncspdev.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <Globe size={24} />
                <span>Portifólio</span>
              </a>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalType === 'privacy'}
        onClose={() => setModalType(null)}
        title="Política de Privacidade"
        icon={<Shield className="h-6 w-6" />}
      >
        <div 
          className="prose prose-blue max-w-none"
          dangerouslySetInnerHTML={{ __html: PRIVACY_POLICY }} 
        />
      </Modal>

      <Modal
        isOpen={modalType === 'terms'}
        onClose={() => setModalType(null)}
        title="Termos de Uso"
        icon={<FileText className="h-6 w-6" />}
      >
        <div 
          className="prose prose-blue max-w-none"
          dangerouslySetInnerHTML={{ __html: TERMS_OF_USE }} 
        />
      </Modal>

      <SupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
      />
    </div>
  );
}

// Componentes auxiliares
const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="text-center max-w-3xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
    <p className="text-xl text-gray-600">{subtitle}</p>
  </div>
);

const TestimonialCard = ({ avatar, name, role, content }: {
  avatar: string;
  name: string;
  role: string;
  content: string;
}) => (
  <div className="bg-white p-8 rounded-xl shadow-sm">
    <div className="flex items-center mb-4">
      <img src={avatar} alt={name} className="w-12 h-12 rounded-full mr-4" />
      <div>
        <h4 className="font-medium text-gray-900">{name}</h4>
        <p className="text-gray-600 text-sm">{role}</p>
      </div>
    </div>
    <p className="text-gray-600">{content}</p>
  </div>
);

// Novo componente para cards de benefícios
const BenefitCard = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex flex-col items-center text-center">
    <div className="mb-3 text-blue-600">
      {React.cloneElement(icon as React.ReactElement, { className: 'h-8 w-8' })}
    </div>
    <div className="text-gray-700 font-medium">{label}</div>
  </div>
);

// Novo componente para cards de segurança
const SecurityCard = ({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
); 