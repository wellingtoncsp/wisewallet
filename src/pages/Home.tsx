import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart2, 
  Target, 
  Users, 
  PieChart, 
  TrendingUp,
  Shield,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Star,
  CheckCircle,
  Smartphone,
  Laptop,
  Wallet,
  ArrowRight,
  Bell,
  Lock,
  Server
} from 'lucide-react';
import { Modal } from '../components/Modal';

export default function Home() {
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'faq' | 'contact' | 'about' | null>(null);

  const handleModal = (type: typeof modalType) => {
    setModalType(type);
  };
  const avatars = [
    { id: 1, src: "/src/img/persons/avatar-1.jpg" },
    { id: 2, src:  "/src/img/persons/avatar-2.jpg" },
    { id: 3, src:  "/src/img/persons/avatar-3.jpg" },
    { id: 4, src:  "/src/img/persons/avatar-4.jpg" },
    { id: 5, src:  "/src/img/persons/avatar-5.jpg" },
    { id: 6, src:  "/src/img/persons/avatar-6.jpg" },
    { id: 7, src:  "/src/img/persons/avatar-7.jpg" },
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
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Comece Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Ver demonstração
                </a>
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
                  src="/src/img/dashboard.png"
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

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  src="/src/img/dashboard.png"
                  alt="Desktop Version"
                  className="w-[600px] rounded-lg shadow-xl"
                />
              </div>
              <div className="relative">
                <img
                  src="/src/img/dashboard.png"
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
              avatar="/src/img/persons/avatar-1.jpg"
              name="Joana Bittencourt"
              role="Empresária"
              content="O WiseWallet revolucionou a forma como gerencio as finanças da minha empresa. A função de compartilhamento de carteiras é simplesmente fantástica!"
            />
            <TestimonialCard
              avatar="/src/img/persons/avatar-2.jpg"
              name="João Santos"
              role="Investidor"
              content="Excelente para acompanhar meus investimentos e despesas pessoais. Os relatórios são muito detalhados e me ajudam a tomar melhores decisões."
            />
            <TestimonialCard
              avatar="/src/img/persons/avatar-3.jpg"
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
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              Falar com Suporte
            </Link>
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
        isOpen={modalType === 'privacy'}
        onClose={() => setModalType(null)}
        title="Política de Privacidade"
      >
<div className="space-y-4">
  <h2 className="font-bold text-2xl">Política de Privacidade</h2>
  <p>
    A WiseWallet (“nós”, “nosso”) está comprometida com a proteção da sua privacidade e com a transparência sobre como coletamos, usamos e armazenamos suas informações. Este documento descreve nossas práticas de privacidade para que você entenda como seus dados são tratados ao utilizar nossos serviços.
  </p>
  <h3 className="font-semibold text-xl">1. Informações que Coletamos</h3>
  <ul className="list-disc pl-5">
    <li>
      <strong>Dados Pessoais:</strong> Ao criar sua conta, coletamos informações como nome, e-mail e outros dados que você optar por fornecer.
    </li>
    <li>
      <strong>Dados de Transações:</strong> Registramos suas transações financeiras (receitas e despesas) e as categorizações que você definir.
    </li>
    <li>
      <strong>Dados de Uso:</strong> Informações sobre como você interage com o sistema, como cliques, acessos e preferências.
    </li>
    <li>
      <strong>Cookies e Tecnologias Similares:</strong> Utilizamos cookies para melhorar sua experiência, analisar o uso do sistema e personalizar conteúdos.
    </li>
  </ul>
  <h3 className="font-semibold text-xl">2. Como Utilizamos suas Informações</h3>
  <ul className="list-disc pl-5">
    <li>
      <strong>Personalização da Experiência:</strong> Para oferecer sugestões de economia, relatórios e análises personalizados.
    </li>
    <li>
      <strong>Melhoria e Desenvolvimento:</strong> Para aprimorar funcionalidades, realizar manutenções e desenvolver novos recursos.
    </li>
    <li>
      <strong>Comunicação:</strong> Para enviar notificações importantes, atualizações do sistema e conteúdos informativos. Você poderá optar por não receber comunicações promocionais.
    </li>
  </ul>
  <h3 className="font-semibold text-xl">3. Compartilhamento e Divulgação</h3>
  <p>
    Seus dados podem ser compartilhados com parceiros e provedores de serviços que nos auxiliam na operação do WiseWallet, sempre sob rígidos padrões de segurança. Poderemos divulgar informações se exigido por lei ou em cumprimento de processos judiciais. Em outros casos, seus dados não serão compartilhados sem seu consentimento prévio.
  </p>
  <h3 className="font-semibold text-xl">4. Segurança dos Dados</h3>
  <p>
    Empregamos medidas técnicas e administrativas para proteger suas informações contra acessos não autorizados, perda ou divulgação indevida. Entretanto, é importante ressaltar que nenhum sistema é 100% seguro na internet.
  </p>
  <h3 className="font-semibold text-xl">5. Seus Direitos</h3>
  <p>
    Você tem o direito de acessar, corrigir, atualizar ou solicitar a exclusão de seus dados pessoais. Para exercer esses direitos, entre em contato conosco pelo e-mail: <a href="mailto:seu-email@exemplo.com">seu-email@exemplo.com</a>.
  </p>
  <h3 className="font-semibold text-xl">6. Alterações nesta Política</h3>
  <p>
    Esta Política de Privacidade pode ser atualizada periodicamente. Recomendamos que você a revise com regularidade para se manter informado sobre como protegemos suas informações.
  </p>
  <h3 className="font-semibold text-xl">7. Contato</h3>
  <p>
    Caso tenha dúvidas ou precise de esclarecimentos sobre nossa Política de Privacidade, entre em contato pelo e-mail: <a href="mailto:seu-email@exemplo.com">seu-email@exemplo.com</a>.
  </p>
</div>

      </Modal>

      <Modal
        isOpen={modalType === 'terms'}
        onClose={() => setModalType(null)}
        title="Termos de Uso"
      >
<div className="space-y-4">
  <h2 className="font-bold text-2xl">Termos de Uso</h2>
  <p>
    Bem-vindo ao WiseWallet! Ao acessar e utilizar nossos serviços, você concorda com estes Termos de Uso. Leia atentamente as condições abaixo antes de prosseguir.
  </p>
  <h3 className="font-semibold text-xl">1. Aceitação dos Termos</h3>
  <p>
    Ao criar uma conta e utilizar o WiseWallet, você concorda em cumprir e estar vinculado a estes Termos de Uso, bem como à nossa Política de Privacidade.
  </p>
  <h3 className="font-semibold text-xl">2. Descrição do Serviço</h3>
  <p>
    O WiseWallet é uma plataforma que permite o gerenciamento de finanças pessoais, incluindo o registro de transações, definição de metas financeiras, criação de orçamentos e gestão colaborativa de carteiras. Reservamo-nos o direito de modificar ou descontinuar funcionalidades sem aviso prévio.
  </p>
  <h3 className="font-semibold text-xl">3. Conta de Usuário</h3>
  <ul className="list-disc pl-5">
    <li>
      <strong>Responsabilidade:</strong> Você é responsável por manter a confidencialidade das suas credenciais e por todas as atividades realizadas em sua conta.
    </li>
    <li>
      <strong>Uso Colaborativo:</strong> Caso opte por compartilhar carteiras, certifique-se de que os acessos sejam concedidos a pessoas de sua confiança.
    </li>
  </ul>
  <h3 className="font-semibold text-xl">4. Uso Adequado</h3>
  <p>
    Você concorda em utilizar o WiseWallet para fins legais e em conformidade com as leis vigentes. É expressamente proibido utilizar o sistema para atividades fraudulentas ou maliciosas, interferir no funcionamento do sistema ou tentar acessos não autorizados.
  </p>
  <h3 className="font-semibold text-xl">5. Propriedade Intelectual</h3>
  <p>
    Todos os conteúdos, designs, marcas e funcionalidades do WiseWallet são de nossa propriedade ou de nossos licenciadores e estão protegidos por leis de propriedade intelectual. É vedada a reprodução, modificação ou distribuição sem autorização prévia.
  </p>
  <h3 className="font-semibold text-xl">6. Limitação de Responsabilidade</h3>
  <p>
    O WiseWallet é fornecido “no estado em que se encontra”, sem garantias de qualquer tipo. Não seremos responsáveis por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou da incapacidade de uso do sistema.
  </p>
  <h3 className="font-semibold text-xl">7. Alterações dos Termos</h3>
  <p>
    Podemos atualizar estes Termos de Uso a qualquer momento. As alterações serão comunicadas por meio do sistema ou e-mail e entrarão em vigor na data de sua publicação. O uso contínuo do WiseWallet após a atualização dos termos implica aceitação das modificações.
  </p>
  <h3 className="font-semibold text-xl">8. Rescisão</h3>
  <p>
    Podemos, a nosso critério, suspender ou encerrar sua conta caso identifiquemos violação destes termos ou uso inadequado do sistema. Em caso de rescisão, o acesso ao WiseWallet será imediatamente revogado.
  </p>
  <h3 className="font-semibold text-xl">9. Legislação Aplicável e Foro</h3>
  <p>
    Estes Termos de Uso são regidos pelas leis brasileiras. Quaisquer disputas serão resolvidas no foro da comarca de [cidade/estado], com exclusão de qualquer outro.
  </p>
  <h3 className="font-semibold text-xl">10. Contato</h3>
  <p>
    Para dúvidas ou solicitações relacionadas a estes Termos de Uso, entre em contato pelo e-mail: <a href="mailto:seu-email@exemplo.com">seu-email@exemplo.com</a>.
  </p>
</div>

      </Modal>

      <Modal
        isOpen={modalType === 'faq'}
        onClose={() => setModalType(null)}
        title="Perguntas Frequentes"
      >
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold">Como começar a usar o WiseWallet?</h4>
            <p>Basta criar uma conta gratuita e começar a registrar suas transações.</p>
          </div>
          <div>
            <h4 className="font-semibold">O WiseWallet é realmente gratuito?</h4>
            <p>Sim! O WiseWallet é e sempre será 100% gratuito.</p>
          </div>
          <div>
            <h4 className="font-semibold">Como compartilhar minhas carteiras com outras pessoas?
            </h4>
            <p>Você pode criar até 3 carteiras e compartilhá-las com familiares ou amigos para uma gestão financeira colaborativa. Basta enviar um convite pelo aplicativo e configurar as permissões de acesso.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Como o WiseWallet protege meus dados?
            </h4>
            <p>A segurança dos seus dados é nossa prioridade. Utilizamos criptografia de ponta e protocolos de segurança avançados para garantir que suas informações estejam sempre protegidas.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Como acompanho minhas metas e orçamentos?
            </h4>
            <p>No WiseWallet, você pode definir metas financeiras e orçamentos personalizados. Nossa interface oferece gráficos e relatórios detalhados que ajudam a monitorar seu progresso e ajustar suas estratégias.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">O WiseWallet oferece análises e sugestões de economia?
            </h4>
            <p>Sim! O sistema analisa seus hábitos de consumo e histórico de transações para fornecer dicas e sugestões personalizadas, ajudando você a otimizar seus gastos e economizar mais.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">E se eu tiver dúvidas ou precisar de suporte?
            </h4>
            <p>Nossa equipe de suporte está sempre pronta para ajudar. Você pode entrar em contato através do chat no aplicativo ou enviar um e-mail para nossa central de atendimento.
            </p>
          </div>

        </div>
      </Modal>

      <Modal
        isOpen={modalType === 'contact'}
        onClose={() => setModalType(null)}
        title="Contato"
      >
        <div className="space-y-4">
          <p>
            Estamos aqui para ajudar! Entre em contato através do email:
            <a href="mailto:suporte@wisewallet.com" className="text-blue-600 ml-1">
              suporte@wisewallet.com
            </a>
          </p>
          <p>
            Nosso tempo médio de resposta é de até 24 horas em dias úteis.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={modalType === 'about'}
        onClose={() => setModalType(null)}
        title="Sobre o Desenvolvedor"
      >
        <div className="space-y-4">
          <p>
            O WiseWallet foi desenvolvido com ❤️ por [Nome do Desenvolvedor].
          </p>
          <p>
            Conecte-se comigo:
            <a 
              href="https://github.com/[seu-usuario]" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 ml-1"
            >
              GitHub
            </a>
          </p>
        </div>
      </Modal>
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