import React, { useState } from 'react';
import {
  Download,
  Users,
  Truck,
  ShoppingCart,
  Package,
  CreditCard,
  LayoutDashboard,
  Calculator,
  LogOut,
  Menu,
  X,
  Signal,
  Wifi,
  Battery,
  UtensilsCrossed,
  Plus,
  Save,
  Edit,
  Trash2,
  Camera,
  Search,
  Calendar,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  ChevronsUpDown,
  FileText,
  Eye
} from 'lucide-react';
import { LOGO_URL } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  // Main state moved top for handleContent access if needed, but better to keep inside
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Product States
  const [products, setProducts] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({
    id: '',
    id_consumer: '',
    codigo_barras: '',
    categoria: '',
    nome_produto: '',
    preco: '',
    status: 'ATIVO'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [productActionType, setProductActionType] = useState<'alterar' | 'excluir' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeletingConfirmation, setIsDeletingConfirmation] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProductionEditing, setIsProductionEditing] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  // Reusable sub-components moved OUTSIDE to prevent focus loss during re-renders
  // These are now stable functional components

  // Logic inside Dashboard...
  React.useEffect(() => {
    fetchProducts();
    checkAdmin();
    // Clear form when switching screens
    if (activeView !== 'produtos') {
      setIsAddingNew(false);
      setIsEditing(false);
    } else {
      // Ensure products view starts clean and waiting for action
      clearProductForm();
      setIsAddingNew(false);
      setIsEditing(false);
    }
  }, [activeView]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { data } = await supabase
        .from('administradores')
        .select('id')
        .eq('email', user.email)
        .maybeSingle(); // Use maybeSingle to avoid 406 error if not found

      if (data) setIsAdmin(true);
      else setIsAdmin(false);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('nome_produto', { ascending: true });
    if (!error && data) setProducts(data);
  };

  const handleProductAction = (type: 'alterar' | 'excluir') => {
    setProductActionType(type);
    setShowSearchModal(true);
    setSearchQuery('');
  };

  const selectProduct = (prod: any) => {
    setProductForm({
      id: prod.id,
      id_consumer: prod.id_consumer || '',
      codigo_barras: prod.codigo_barras || '',
      categoria: prod.categoria || '',
      nome_produto: prod.nome_produto || '',
      preco: formatCurrency((prod.preco * 100).toFixed(0)),
      status: prod.status || 'ATIVO'
    });

    if (productActionType === 'excluir') {
      setIsDeletingConfirmation(true);
      setIsEditing(false);
      setIsAddingNew(false);
    } else {
      setIsEditing(true);
      setIsAddingNew(false);
    }

    setShowSearchModal(false);
    setProductActionType(null);
  };

  // Trigger deletion confirmation after UI update
  React.useEffect(() => {
    if (isDeletingConfirmation) {
      const confirmDeleletion = async () => {
        // Small delay to ensure form is rendered with data
        await new Promise(resolve => setTimeout(resolve, 500));
        if (window.confirm(`ATENÇÃO: Deseja realmente EXCLUIR o produto "${productForm.nome_produto}"? Esta operação é irreversível.`)) {
          await deleteProduct(productForm.id);
        } else {
          setIsDeletingConfirmation(false);
          clearProductForm();
        }
      };
      confirmDeleletion();
    }
  }, [isDeletingConfirmation]);

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
      setIsDeletingConfirmation(false);
    } else {
      alert('Produto excluído com sucesso!');
      await fetchProducts();
      clearProductForm();
      setIsDeletingConfirmation(false);
    }
  };
  const formatCurrency = (value: string) => {
    let cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) return '';

    let floatValue = parseFloat(cleanValue) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(floatValue);
  };

  const parseCurrencyToFloat = (formattedValue: string) => {
    if (!formattedValue) return 0;
    const cleanValue = formattedValue.replace(/[^\d]/g, '');
    return parseFloat(cleanValue) / 100;
  };

  const saveProduct = async () => {
    if (!productForm.nome_produto) {
      alert('Nome do produto é obrigatório');
      return;
    }

    const payload = {
      id_consumer: productForm.id_consumer,
      codigo_barras: productForm.codigo_barras,
      categoria: productForm.categoria,
      nome_produto: productForm.nome_produto,
      preco: parseCurrencyToFloat(productForm.preco),
      status: productForm.status
    };

    if (productForm.id) {
      // Update
      const { error } = await supabase.from('produtos').update(payload).eq('id', productForm.id);
      if (error) alert('Erro ao salvar: ' + error.message);
      else {
        alert('Produto atualizado!');
        fetchProducts();
        clearProductForm();
      }
    } else {
      // Insert
      const { error } = await supabase.from('produtos').insert([payload]);
      if (error) alert('Erro ao incluir: ' + error.message);
      else {
        alert('Produto incluído!');
        setIsAddingNew(false);
        fetchProducts();
        clearProductForm();
      }
    }
  };

  const clearProductForm = () => {
    setProductForm({
      id: '',
      id_consumer: '',
      codigo_barras: '',
      categoria: '',
      nome_produto: '',
      preco: '',
      status: 'ATIVO'
    });
    setIsEditing(false);
    setIsAddingNew(false);
  };

  const startInclusion = () => {
    clearProductForm();
    setIsAddingNew(true);
    setTimeout(() => document.getElementById('id-consumer')?.focus(), 100);
  };

  const menuItems = [
    { id: 'importacoes', icon: Download, label: "Importações" },
    { id: 'clientes', icon: Users, label: "Clientes" },
    { id: 'fornecedores', icon: Truck, label: "Fornecedores" },
    { id: 'produtos', icon: ShoppingCart, label: "Produtos" },
    { id: 'estoque', icon: Package, label: "Estoque/Inventário" },
    { id: 'contas', icon: CreditCard, label: "Contas a Pagar" },
    { id: 'dashboard', icon: LayoutDashboard, label: "Dashboard" },
    { id: 'producao', icon: Calculator, label: "Produção" },
  ];

  const handleCloseWelcome = () => {
    setActiveView('importacoes');
  };

  const renderProducts = () => (
    <ScreenWrapper
      title="Cadastro de Produtos"
      subtitle="Gerencie seu catálogo de itens"
      icon={ShoppingCart}
      onExit={() => setActiveView('dashboard')}
      onInclude={startInclusion}
      onSave={saveProduct}
      onAlter={() => handleProductAction('alterar')}
      onDelete={() => handleProductAction('excluir')}
      isTableEmpty={products.length === 0}
      isEditing={isEditing}
      isAddingNew={isAddingNew}
      isSearching={!!productActionType}
      isDeletingConfirmation={isDeletingConfirmation}
      isAdmin={isAdmin}
    >
      {/* Alert outside the grid to keep grid structure stable and prevent focus loss */}
      {products.length === 0 && !isAddingNew && !isEditing && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 animate-pulse">
          <p className="text-amber-400 text-xs font-bold text-center uppercase tracking-widest">
            ⚠️ Banco de Dados Vazio - Clique em "INCLUIR" para liberar o cadastro
          </p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-2 md:gap-3">
        <div className="col-span-12 md:col-span-3 lg:col-span-2">
          <label htmlFor="id-consumer" className="text-[10px] text-slate-400 uppercase font-semibold mb-1 block">ID Consumer</label>
          <input
            id="id-consumer"
            key="field-id-consumer"
            type="text"
            disabled={(!isAddingNew && !isEditing) || isDeletingConfirmation}
            value={productForm.id_consumer}
            onChange={(e) => setProductForm({ ...productForm, id_consumer: e.target.value.toUpperCase() })}
            className="w-full bg-surface/50 border border-slate-700 rounded-lg px-3 py-1.5 text-white h-[36px] text-sm disabled:opacity-30 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
            onKeyDown={(e) => e.key === 'Enter' && document.getElementById('codigo-barras')?.focus()}
          />
        </div>
        <div className="col-span-12 md:col-span-9 lg:col-span-10">
          <label htmlFor="codigo-barras" className="text-[10px] text-slate-400 uppercase font-semibold mb-1 block">Código de Barras</label>
          <div className="flex gap-2">
            <input
              id="codigo-barras"
              type="text"
              disabled={(!isAddingNew && !isEditing) || isDeletingConfirmation}
              placeholder="Escaneie ou digite (máx 44 números)..."
              value={productForm.codigo_barras}
              onChange={(e) => setProductForm({ ...productForm, codigo_barras: e.target.value.replace(/\D/g, '').slice(0, 44) })}
              className="flex-1 bg-surface/50 border border-slate-700 rounded-lg px-3 py-1.5 text-white h-[36px] text-sm disabled:opacity-30 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
              onKeyDown={(e) => e.key === 'Enter' && document.getElementById('categoria-prod')?.focus()}
            />
            <button
              aria-label="Abrir Câmera"
              disabled={(!isAddingNew && !isEditing) || isDeletingConfirmation}
              className="bg-primary hover:bg-primary-dark text-white px-3 rounded-lg h-[36px] shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Camera size={16} />
            </button>
          </div>
        </div>
        <div className="col-span-6 md:col-span-4 relative">
          <label htmlFor="categoria-prod" className="text-[10px] text-slate-400 mb-1 block uppercase font-bold tracking-tight">CATEGORIA *</label>
          <div className="relative">
            <input
              id="categoria-prod"
              disabled={(!isAddingNew && !isEditing) || isDeletingConfirmation}
              value={productForm.categoria}
              placeholder="Digite ou selecione..."
              autoComplete="off"
              onFocus={() => setShowCategoryModal(true)}
              onChange={(e) => {
                setProductForm({ ...productForm, categoria: e.target.value.toUpperCase() });
                setCategorySearch(e.target.value);
                setShowCategoryModal(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                  if (e.key === 'Enter') e.preventDefault();
                  setShowCategoryModal(false);
                  document.getElementById('nome-prod')?.focus();
                }
                if (e.key === 'Escape') setShowCategoryModal(false);
              }}
              className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
              onBlur={() => setTimeout(() => setShowCategoryModal(false), 200)}
            />
            {showCategoryModal && !isDeletingConfirmation && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden animate-scale-up border-t-2 border-t-primary/50">
                <div className="p-2 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
                  <Search size={14} className="text-slate-500" />
                  <input
                    placeholder="Filtrar categorias..."
                    className="bg-transparent border-none outline-none text-[11px] text-white w-full uppercase"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                  />
                </div>
                <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-1 bg-slate-900/40">
                  <div className="px-2 py-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Existentes</div>
                  {Array.from(new Set(products.map(p => p.categoria).filter(Boolean)))
                    .filter(cat => cat.toUpperCase().includes(categorySearch.toUpperCase()))
                    .sort()
                    .map((cat, idx) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setProductForm({ ...productForm, categoria: cat });
                          setShowCategoryModal(false);
                        }}
                        className="w-full text-left p-2.5 hover:bg-primary/10 rounded-lg text-xs transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-primary transition-colors" />
                          <span className="text-slate-300 group-hover:text-white uppercase font-medium">{cat}</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-600 group-hover:text-primary transition-colors transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  {categorySearch && !Array.from(new Set(products.map(p => p.categoria))).some(c => c?.toUpperCase() === categorySearch.toUpperCase()) && (
                    <div className="p-4 text-center">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Pressione ENTER para criar</p>
                      <p className="text-sm text-primary font-bold mt-1">"{categorySearch.toUpperCase()}"</p>
                    </div>
                  )}
                </div>
                <div className="bg-slate-900 p-2 flex items-center gap-4 border-t border-slate-800">
                  <div className="flex items-center gap-1.5"><span className="bg-slate-800 text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 shadow-sm">Enter</span> <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">selecionar</span></div>
                  <div className="flex items-center gap-1.5"><span className="bg-slate-800 text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 shadow-sm">Esc</span> <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">fechar</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="col-span-6 md:col-span-8">
          <label htmlFor="nome-prod" className="text-[10px] text-slate-400 mb-1 block uppercase font-bold tracking-tight">NOME PRODUTO *</label>
          <input
            id="nome-prod"
            disabled={(!isAddingNew && !isEditing) || isDeletingConfirmation}
            value={productForm.nome_produto}
            onChange={(e) => setProductForm({ ...productForm, nome_produto: e.target.value.toUpperCase() })}
            className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
            onBlur={(e) => {
              if (!e.target.value) {
                alert('Campo NOME DO PRODUTO é obrigatório');
                setTimeout(() => document.getElementById('nome-prod')?.focus(), 10);
              }
            }}
            onKeyDown={(e) => e.key === 'Enter' && document.getElementById('preco-prod')?.focus()}
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <label htmlFor="preco-prod" className="text-[10px] text-slate-400 mb-1 block uppercase font-bold tracking-tight">Preço Venda *</label>
          <input
            id="preco-prod"
            type="text"
            placeholder="R$ 0,00"
            disabled={(!isAddingNew && !isEditing) || isDeletingConfirmation}
            value={productForm.preco}
            onChange={(e) => setProductForm({ ...productForm, preco: formatCurrency(e.target.value) })}
            className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Tab') {
                const numericValue = parseCurrencyToFloat(productForm.preco);
                if (numericValue > 0) {
                  // Wait for the blur/state update if needed, but we can do it here
                  document.getElementById('btn-salvar')?.focus();
                }
              }
            }}
            onBlur={(e) => {
              const numericValue = parseCurrencyToFloat(e.target.value);
              if (!e.target.value || numericValue <= 0) {
                alert('Campo PREÇO DE VENDA é obrigatório e deve ser maior que zero');
                setTimeout(() => document.getElementById('preco-prod')?.focus(), 10);
                return;
              }
              // Small delay to ensure button is rendered and enabled before focus
              setTimeout(() => document.getElementById('btn-salvar')?.focus(), 50);
            }}
          />
        </div>
      </div>
      {
        <GenericTable
          headers={["ID", "Cód. Barras", "Produto", "Categoria", "Preço", "Status"]}
          data={products.map(p => ({
            id: p.id_consumer || '---',
            barcode: p.codigo_barras || '---',
            prod: p.nome_produto,
            cat: p.categoria || 'Geral',
            price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.preco || 0),
            status: p.status
          }))}
          title="Consulta Produtos"
        />
      }

      {/* Search Modal */}
      {
        showSearchModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h3 className="text-white font-bold uppercase tracking-wider text-sm">
                  Seleção para {productActionType === 'excluir' ? 'Exclusão' : 'Alteração'}
                </h3>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Fechar janela de busca"
                  aria-label="Fechar busca"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 bg-slate-800/50">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Pesquisar produto por nome..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {products
                  .filter(p => p.nome_produto.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => selectProduct(p)}
                      className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/10 flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-white font-medium text-sm">{p.nome_produto}</p>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">{p.categoria || 'Geral'}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                {products.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">Nenhum produto cadastrado.</p>}
              </div>
            </div>
          </div>
        )
      }
    </ScreenWrapper >
  );

  const renderClients = () => (
    <ScreenWrapper
      title="Cadastro de Clientes"
      subtitle="Gestão da base de consumidores"
      icon={Users}
      onExit={() => setActiveView('dashboard')}
      isTableEmpty={false}
      isEditing={false}
    >
      <div className="grid grid-cols-12 gap-2 md:gap-3 mb-4">
        <div className="col-span-12 md:col-span-6"><label htmlFor="client-name" className="text-[10px] text-slate-400 mb-1 block uppercase">Nome Completo</label><input id="client-name" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
        <div className="col-span-12 md:col-span-6"><label htmlFor="client-email" className="text-[10px] text-slate-400 mb-1 block uppercase">E-mail</label><input id="client-email" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
        <div className="col-span-6 md:col-span-4"><label htmlFor="client-tel" className="text-[10px] text-slate-400 mb-1 block uppercase">Telefone/WhatsApp</label><input id="client-tel" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
        <div className="col-span-6 md:col-span-8"><label htmlFor="client-addr" className="text-[10px] text-slate-400 mb-1 block uppercase">Endereço de Entrega</label><input id="client-addr" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
      </div>
      <GenericTable
        headers={["ID", "Cliente", "Contato", "Localização", "Status"]}
        data={Array.from({ length: 10 }, (_, i) => ({ id: (i + 1).toString().padStart(4, '0'), name: `Cliente ${i + 1}`, tel: '(21) 99999-9999', loc: 'Copacabana, RJ', status: 'ATIVO' }))}
        title="Consulta Clientes"
      />
    </ScreenWrapper>
  );

  const renderSuppliers = () => (
    <ScreenWrapper
      title="Cadastro de Fornecedores"
      subtitle="Gestão de parceiros e insumos"
      icon={Truck}
      onExit={() => setActiveView('dashboard')}
      isTableEmpty={false}
      isEditing={false}
    >
      <div className="grid grid-cols-12 gap-2 md:gap-3 mb-4">
        <div className="col-span-12 md:col-span-8"><label htmlFor="sup-name" className="text-[10px] text-slate-400 mb-1 block uppercase">Razão Social / Nome</label><input id="sup-name" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
        <div className="col-span-12 md:col-span-4"><label htmlFor="sup-cnpj" className="text-[10px] text-slate-400 mb-1 block uppercase">CNPJ / CPF</label><input id="sup-cnpj" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
        <div className="col-span-6"><label htmlFor="sup-cat" className="text-[10px] text-slate-400 mb-1 block uppercase">Categoria Insumo</label><input id="sup-cat" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
        <div className="col-span-6"><label htmlFor="sup-seller" className="text-[10px] text-slate-400 mb-1 block uppercase">Vendedor Responsável</label><input id="sup-seller" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
      </div>
      <GenericTable
        headers={["ID", "Fornecedor", "Segmento", "Contato", "Status"]}
        data={Array.from({ length: 10 }, (_, i) => ({ id: (i + 1).toString().padStart(4, '0'), name: `Fornecedor ${i + 1}`, seg: 'Bebidas', contact: 'contato@forn.com', status: 'ATIVO' }))}
        title="Consulta Fornecedores"
      />
    </ScreenWrapper>
  );

  const renderStock = () => (
    <ScreenWrapper
      title="Estoque e Inventário"
      subtitle="Controle de movimentação de produtos"
      icon={Package}
      onExit={() => setActiveView('dashboard')}
      isTableEmpty={false}
      isEditing={false}
    >
      <div className="grid grid-cols-12 gap-2 md:gap-3 mb-4">
        <div className="col-span-12 md:col-span-6"><label htmlFor="stock-item" className="text-[10px] text-slate-400 mb-1 block uppercase">Item de Estoque</label><input id="stock-item" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
        <div className="col-span-6 md:col-span-3"><label htmlFor="stock-qty" className="text-[10px] text-slate-400 mb-1 block uppercase">Qtd. Atual</label><input id="stock-qty" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
        <div className="col-span-6 md:col-span-3"><label htmlFor="stock-min" className="text-[10px] text-slate-400 mb-1 block uppercase">Estoque Mínimo</label><input id="stock-min" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
      </div>
      <GenericTable
        headers={["SKU", "Descrição", "Und", "Atual", "Mínimo"]}
        data={Array.from({ length: 10 }, (_, i) => ({ sku: `SKU-${i + 100}`, desc: `Item Insumo ${i + 1}`, und: 'KG', qta: '15.5', min: '5.0' }))}
        title="Painel de Inventário"
      />
    </ScreenWrapper>
  );

  const renderAccounts = () => (
    <ScreenWrapper
      title="Contas a Pagar"
      subtitle="Gestão financeira e obrigações"
      icon={CreditCard}
      onExit={() => setActiveView('dashboard')}
      isTableEmpty={false}
      isEditing={false}
    >
      <div className="grid grid-cols-12 gap-2 md:gap-3 mb-4">
        <div className="col-span-12 md:col-span-7"><label htmlFor="acc-desc" className="text-[10px] text-slate-400 mb-1 block uppercase">Descrição do Lançamento</label><input id="acc-desc" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
        <div className="col-span-12 md:col-span-5"><label htmlFor="acc-sup" className="text-[10px] text-slate-400 mb-1 block uppercase">Fornecedor</label><input id="acc-sup" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
        <div className="col-span-6 md:col-span-4"><label htmlFor="acc-val" className="text-[10px] text-slate-400 mb-1 block uppercase">Valor</label><div className="relative"><DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input id="acc-val" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] pl-8 px-3 text-sm" /></div></div>
        <div className="col-span-6 md:col-span-4"><label htmlFor="acc-due" className="text-[10px] text-slate-400 mb-1 block uppercase">Vencimento</label><div className="relative"><Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input id="acc-due" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] pl-8 px-3 text-sm" /></div></div>
        <div className="col-span-12 md:col-span-4"><label htmlFor="acc-pay" className="text-[10px] text-slate-400 mb-1 block uppercase">Forma Pgto</label><input id="acc-pay" className="w-full bg-surface/50 border border-slate-700 rounded-lg h-[36px] px-3 text-sm" /></div>
      </div>
      <GenericTable
        headers={["Doc", "Credor", "Vencimento", "Valor", "Status"]}
        data={Array.from({ length: 10 }, (_, i) => ({ doc: `NF-${i + 500}`, cred: `Fornecedor Exemplo ${i + 1}`, venc: '25/08/2024', val: 'R$ 1.250,00', status: 'PENDENTE' }))}
        title="Consulta Lançamentos"
      />
    </ScreenWrapper>
  );

  const renderProduction = () => {
    const inputClass = `w-full bg-surface/50 border-2 border-white/30 rounded-lg px-2 py-0.5 text-right text-[10px] text-slate-300 ${isProductionEditing ? '' : 'disabled:opacity-60 disabled:cursor-not-allowed'} outline-none font-medium h-6`;
    const labelClass = "text-[9px] text-slate-400 uppercase font-bold text-center mb-0.5 block tracking-wider";
    const rowLabelClass = "text-[9px] text-slate-400 uppercase font-bold self-center text-left pl-1";
    const sectionTitleClass = "text-[10px] font-bold text-primary uppercase tracking-widest text-center mb-2 bg-slate-800/50 py-0.5 rounded-lg border-2 border-white/30";

    return (
      <div className="glass-effect flex flex-col w-full h-full rounded-[1.5rem] md:rounded-[2rem] border border-white/10 shadow-2xl relative z-10 animate-fade-in-up overflow-hidden" style={{ maxHeight: 'calc(100vh - 40px)' }}>
        <div className="flex items-center gap-3 md:gap-4 p-2 md:p-3 border-b border-white/10 shrink-0">
          <div className="p-2 bg-primary/20 rounded-xl text-primary border border-primary/20">
            <Calculator size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-tighter leading-tight">Mapa de Produção</h2>
            <p className="text-slate-400 text-[10px] md:text-xs uppercase tracking-widest">Cálculo de insumos e controle de massas</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 md:p-4 custom-scrollbar">
          <div className="space-y-3">
            {/* Date Picker Row */}
            <div className="flex items-center gap-2 bg-slate-800/30 p-2 rounded-xl border-2 border-white/30 w-fit">
              <span className="text-[9px] uppercase font-bold text-slate-400" id="label-data-mapa">Data do Mapa:</span>
              <div className="relative">
                <Calendar size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="date"
                  disabled={!isProductionEditing}
                  aria-labelledby="label-data-mapa"
                  className="bg-slate-900 border-2 border-white/30 rounded-lg py-1 pl-7 pr-2 text-[10px] text-white disabled:opacity-80 outline-none focus:border-primary transition-colors h-6"
                  value="2024-02-03"
                />
              </div>
            </div>

            {/* Section 1: HISTÓRICO */}
            <div className="p-3 rounded-xl bg-surface/30 border-2 border-white/30">
              <h3 className={sectionTitleClass}>Histórico</h3>
              <div className="grid grid-cols-12 gap-y-1 gap-x-2 items-center">
                {/* Headers */}
                <div className="col-span-1"></div>
                <div className="col-span-2"><span className={labelClass}>Peso/Unidade (gr)</span></div>
                <div className="col-span-2"><span className={labelClass}>Unidades</span></div>
                <div className="col-span-1"><span className={labelClass}>% Histórico</span></div>
                <div className="col-span-2"><span className={labelClass}>Peso Kg</span></div>
                <div className="col-span-2"><span className={labelClass}>Qtd. Usada (Molho)</span></div>
                <div className="col-span-2"><span className={labelClass}>Qtd. Usada (Muçarela)</span></div>

                {/* Row: MÉDIO */}
                <div className="col-span-1"><span className={rowLabelClass}>Médio</span></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Peso Médio" value="0,350" className={inputClass} /></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Unidades Médio" className={inputClass} /></div>
                <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Histórico Porcentagem Médio" className={inputClass} /></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Peso Total Médio" className={inputClass} /></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Molho Médio" value="0,040" className={inputClass} /></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Muçarela Médio" value="0,180" className={inputClass} /></div>

                {/* Row: GRANDE */}
                <div className="col-span-1"><span className={rowLabelClass}>Grande</span></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Peso Grande" value="0,400" className={inputClass} /></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Unidades Grande" className={inputClass} /></div>
                <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Histórico Porcentagem Grande" className={inputClass} /></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Peso Total Grande" className={inputClass} /></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Molho Grande" value="0,080" className={inputClass} /></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Muçarela Grande" value="0,250" className={inputClass} /></div>

                {/* Row: FAMÍLIA */}
                <div className="col-span-1"><span className={rowLabelClass}>Família</span></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Peso Família" value="0,450" className={inputClass} /></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Unidades Família" className={inputClass} /></div>
                <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Histórico Porcentagem Família" className={inputClass} /></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Peso Total Família" className={inputClass} /></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Molho Família" value="0,100" className={inputClass} /></div>
                <div className="col-span-2"><input disabled={!isProductionEditing} aria-label="Histórico Muçarela Família" value="0,300" className={inputClass} /></div>

                {/* Row: SUBTOTAL */}
                <div className="col-span-1 mt-1"><span className="text-[9px] text-primary uppercase font-bold self-center text-left pl-1">Subtotal</span></div>
                <div className="col-span-2 mt-1 bg-slate-800/50 rounded-lg h-6"></div>
                <div className="col-span-2 mt-1"><input disabled aria-label="Subtotal Unidades Histórico" className="w-full bg-primary/5 border-2 border-white/30 rounded-lg px-2 py-0.5 text-right text-[10px] text-primary disabled:opacity-60 disabled:cursor-not-allowed outline-none font-bold h-6" /></div>
                <div className="col-span-1 mt-1"><input disabled aria-label="Subtotal Porcentagem Histórico" className="w-full bg-primary/5 border-2 border-white/30 rounded-lg px-2 py-0.5 text-right text-[10px] text-primary disabled:opacity-60 disabled:cursor-not-allowed outline-none font-bold h-6" /></div>
                <div className="col-span-2 mt-1"><input disabled aria-label="Subtotal Peso Histórico" className="w-full bg-primary/5 border-2 border-white/30 rounded-lg px-2 py-0.5 text-right text-[10px] text-primary disabled:opacity-60 disabled:cursor-not-allowed outline-none font-bold h-6" /></div>
                <div className="col-span-2 mt-1"><input disabled aria-label="Subtotal Molho Histórico" className="w-full bg-primary/5 border-2 border-white/30 rounded-lg px-2 py-0.5 text-right text-[10px] text-primary disabled:opacity-60 disabled:cursor-not-allowed outline-none font-bold h-6" /></div>
                <div className="col-span-2 mt-1"><input disabled aria-label="Subtotal Muçarela Histórico" className="w-full bg-primary/5 border-2 border-white/30 rounded-lg px-2 py-0.5 text-right text-[10px] text-primary disabled:opacity-60 disabled:cursor-not-allowed outline-none font-bold h-6" /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Left Column: ESTOQUE + NECESSIDADE */}
              <div className="space-y-3">
                {/* ESTOQUE ATUAL */}
                <div className="p-3 rounded-xl bg-surface/30 border-2 border-white/30">
                  <h3 className={sectionTitleClass}>Estoque Atual</h3>
                  <div className="grid grid-cols-5 gap-1 items-center">
                    <div className="col-span-1"></div>
                    <div className="col-span-1"><span className={labelClass}>Unidades</span></div>
                    <div className="col-span-1"><span className={labelClass}>Kg</span></div>
                    <div className="col-span-1"><span className={labelClass}>Molho</span></div>
                    <div className="col-span-1"><span className={labelClass}>Muçarela</span></div>

                    <div className="col-span-1"><span className={rowLabelClass}>Médio</span></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Estoque Unds Médio" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Estoque Kg Médio" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Estoque Molho Médio" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Estoque Queijo Médio" className={inputClass} /></div>

                    <div className="col-span-1"><span className={rowLabelClass}>Grande</span></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Estoque Unds Grande" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Estoque Kg Grande" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Estoque Molho Grande" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Estoque Queijo Grande" className={inputClass} /></div>

                    <div className="col-span-1"><span className={rowLabelClass}>Família</span></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Estoque Unds Família" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Estoque Kg Família" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Estoque Molho Família" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Estoque Queijo Família" className={inputClass} /></div>
                  </div>
                </div>

                {/* NECESSIDADE PRODUÇÃO */}
                <div className="p-3 rounded-xl bg-surface/30 border-2 border-white/30">
                  <h3 className={sectionTitleClass}>Necessidade Produção</h3>
                  <div className="grid grid-cols-4 gap-1 items-center">
                    <div className="col-span-1"></div>
                    <div className="col-span-1"><span className={labelClass}>Bolinhas (Kg)</span></div>
                    <div className="col-span-1"><span className={labelClass}>Molho</span></div>
                    <div className="col-span-1"><span className={labelClass}>Muçarela</span></div>

                    <div className="col-span-1"><span className={rowLabelClass}>Médio</span></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Necessidade Massa Médio" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Necessidade Molho Médio" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Necessidade Queijo Médio" className={inputClass} /></div>

                    <div className="col-span-1"><span className={rowLabelClass}>Grande</span></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Necessidade Massa Grande" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Necessidade Molho Grande" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Necessidade Queijo Grande" className={inputClass} /></div>

                    <div className="col-span-1"><span className={rowLabelClass}>Família</span></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Necessidade Massa Família" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Necessidade Molho Família" className={inputClass} /></div>
                    <div className="col-span-1"><input disabled={!isProductionEditing} aria-label="Necessidade Queijo Família" className={inputClass} /></div>

                    <div className="col-span-1 mt-1"><span className="text-[9px] text-primary uppercase font-bold self-center text-left pl-1">Subtotal</span></div>
                    <div className="col-span-1 mt-1"><input disabled aria-label="Subtotal Necessidade Massa" className="w-full bg-primary/5 border-2 border-white/30 rounded-lg px-2 py-0.5 text-right text-[10px] text-primary disabled:opacity-60 disabled:cursor-not-allowed outline-none font-bold h-6" /></div>
                    <div className="col-span-1 mt-1"><input disabled aria-label="Subtotal Necessidade Molho" className="w-full bg-primary/5 border-2 border-white/30 rounded-lg px-2 py-0.5 text-right text-[10px] text-primary disabled:opacity-60 disabled:cursor-not-allowed outline-none font-bold h-6" /></div>
                    <div className="col-span-1 mt-1"><input disabled aria-label="Subtotal Necessidade Queijo" className="w-full bg-primary/5 border-2 border-white/30 rounded-lg px-2 py-0.5 text-right text-[10px] text-primary disabled:opacity-60 disabled:cursor-not-allowed outline-none font-bold h-6" /></div>
                  </div>
                </div>
              </div>

              {/* Right Column: AJUSTE */}
              <div className="h-full">
                <div className="p-3 rounded-xl bg-surface/30 border-2 border-white/30 h-full flex flex-col">
                  <h3 className={sectionTitleClass}>Ajuste Produção</h3>

                  <div className="mb-4">
                    <label htmlFor="motivo-adjust" className={labelClass + " text-left pl-1"}>Motivo da Produção:</label>
                    <textarea
                      id="motivo-adjust"
                      disabled={!isProductionEditing}
                      className="w-full bg-surface/50 border-2 border-white/30 rounded-lg px-2 py-1 text-[10px] text-white disabled:opacity-60 outline-none focus:border-primary resize-none h-16"
                      placeholder="Descreva o motivo..."
                    ></textarea>
                  </div>

                  <div className="space-y-2">
                    <span className={labelClass + " text-left pl-1"}>% de Ajuste:</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className={labelClass}>Médio</span>
                        <input disabled={!isProductionEditing} aria-label="Ajuste Porcentagem Médio" className={inputClass} />
                      </div>
                      <div>
                        <span className={labelClass}>Grande</span>
                        <input disabled={!isProductionEditing} aria-label="Ajuste Porcentagem Grande" className={inputClass} />
                      </div>
                      <div>
                        <span className={labelClass}>Família</span>
                        <input disabled={!isProductionEditing} aria-label="Ajuste Porcentagem Família" className={inputClass} />
                      </div>
                    </div>
                  </div>

                  {/* Visual filler to balance height if needed */}
                  <div className="flex-1 min-h-[20px]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Custom Footer for Production Screen */}
        <div className="p-2 border-t border-white/10 bg-slate-900/50 backdrop-blur-md shrink-0 grid grid-cols-2 md:flex md:justify-end gap-2">
          <button
            onClick={() => setIsProductionEditing(true)}
            disabled={isProductionEditing}
            title="Incluir novo mapa de produção"
            className={`flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-500 text-white py-3 px-6 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 shadow-lg group ${isProductionEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Plus size={18} className="text-white group-hover:rotate-90 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-wider">INCLUIR</span>
          </button>
          <button
            onClick={() => setIsProductionEditing(false)}
            disabled={!isProductionEditing}
            title="Salvar mapa de produção"
            className={`flex items-center justify-center gap-2 bg-gradient-to-r from-[#e31837] to-[#ff4d6d] text-white py-3 px-8 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(227,24,55,0.4)] active:scale-95 shadow-lg group ${!isProductionEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save size={18} className="text-white group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-wider">SALVAR</span>
          </button>
          <button
            onClick={() => { }}
            disabled={isProductionEditing}
            title="Consultar mapas de produção"
            className={`flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 px-6 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 shadow-lg group ${isProductionEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Eye size={18} className="text-white group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-wider">CONSULTA</span>
          </button>
          <button
            onClick={() => { }}
            disabled={isProductionEditing}
            title="Gerar relatório de produção"
            className={`flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] active:scale-95 shadow-lg group ${isProductionEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FileText size={18} className="text-white group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-wider">RELATÓRIO</span>
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            title="Fechar tela atual e voltar ao Painel Principal"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-700 to-slate-600 text-white py-3 px-8 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(71,85,105,0.4)] active:scale-95 col-span-2 md:col-span-1 shadow-lg group"
          >
            <LogOut size={18} className="text-white group-hover:translate-x-1 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-wider">SAIR</span>
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="w-full max-w-4xl mx-auto p-4 md:p-8 glass-effect rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden animate-scale-up">
            <button
              onClick={() => setActiveView('importacoes')}
              className="absolute top-6 right-8 text-slate-400 hover:text-white transition-all hover:scale-110 active:scale-90 z-20 bg-white/5 p-2 rounded-full border border-white/10"
              title="Ir para Importações"
            >
              <X size={24} />
            </button>
            <div className="mb-8 text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/30 shadow-lg shadow-primary/20">
                <UtensilsCrossed size={40} className="text-primary" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Painel Administrativo</h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-lg mx-auto">Escolha uma das opções no menu para gerenciar sua operação.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-surface/40 border border-white/5"><p className="text-slate-400 text-xs uppercase font-semibold">Vendas</p><p className="text-3xl font-bold text-white mt-1">42</p></div>
                <div className="p-5 rounded-2xl bg-surface/40 border border-white/5"><p className="text-slate-400 text-xs uppercase font-semibold">Produtos</p><p className="text-3xl font-bold text-white mt-1">{products.length}</p></div>
                <div className="p-5 rounded-2xl bg-surface/40 border border-white/5 col-span-2 md:col-span-1"><p className="text-slate-400 text-xs uppercase font-semibold">Status</p><div className="flex items-center justify-center gap-2 mt-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span><p className="text-xl font-bold text-white">Online</p></div></div>
              </div>
            </div>
          </div>
        );
      case 'produtos':
        return renderProducts();
      case 'clientes': return renderClients();
      case 'fornecedores': return renderSuppliers();
      case 'estoque': return renderStock();
      case 'contas': return renderAccounts();
      case 'producao': return renderProduction();
      default:
        return (
          <div className="glass-effect p-12 rounded-3xl border border-white/10 text-center animate-fade-in">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6"><Package size={40} className="text-primary" /></div>
            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">{activeView}</h2>
            <p className="text-slate-400">Módulo em desenvolvimento...</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-background-dark min-h-screen font-display text-slate-100 flex flex-col">
      <div className="h-12 w-full bg-background-dark border-b border-slate-800 sticky top-0 z-50 flex items-center justify-between px-6 lg:hidden">
        <span className="text-sm font-semibold text-white">9:41</span>
        <div className="flex gap-2 items-center text-white"><Signal size={16} /><Wifi size={16} /><Battery size={16} /></div>
      </div>
      <div className="flex flex-1 relative overflow-hidden">
        {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-surface border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-6 flex flex-col items-center border-b border-slate-800">
            <div className="w-full max-w-[180px] h-24 flex items-center justify-center p-2 relative group">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
            </div>
            <button aria-label="Fechar Menu" onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {menuItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveView(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 group ${activeView === item.id ? 'bg-primary/10 text-primary' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}>
                <div className="flex items-center gap-3"><item.icon size={20} className={activeView === item.id ? 'text-primary' : 'text-slate-400 group-hover:text-primary transition-colors'} /><span className="font-medium text-sm">{item.label}</span></div>
                {activeView === item.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(227,24,55,0.5)]"></div>}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800 bg-surface">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors uppercase font-bold text-xs tracking-widest"><LogOut size={20} /><span className="font-medium">Encerrar Sistema</span></button>
            <div className="mt-4 px-3">
              <p className="text-[10px] text-slate-100 tracking-wider text-center leading-relaxed">
                Desenvolvido por: <br />
                <span className="font-bold">CKDEV Desenvolvimentos</span>
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 relative flex items-center justify-center p-3 md:p-4 w-full overflow-y-auto overflow-x-hidden">
          <div className="absolute inset-0 bg-cover bg-center z-0 bg-[url('https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')]" aria-hidden="true"><div className="absolute inset-0 bg-background-dark/80 backdrop-blur-[2px]"></div></div>
          <div key={activeView} className="w-full h-full flex justify-center items-center relative z-10">
            {renderContent()}
          </div>
        </main>
      </div>
      {!isMobileMenuOpen && <div className="fixed bottom-6 right-6 lg:hidden z-50"><button aria-label="Abrir Menu" onClick={() => setIsMobileMenuOpen(true)} className="w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center focus:outline-none active:scale-95 transition-transform"><Menu size={28} /></button></div>}
    </div>
  );
};

// Reusable Action Footer Component based on Image 2 - MOVED OUTSIDE FOR STABILITY
const ActionFooter = ({ onExit, onInclude, onSave, onAlter, onDelete, isTableEmpty, isEditing, isAddingNew, isSearching, isDeletingConfirmation, isAdmin = false }: any) => (
  <div className="p-3 border-t border-white/10 bg-slate-900/50 backdrop-blur-md shrink-0 grid grid-cols-2 md:flex md:justify-end gap-2">
    <button
      id="btn-incluir"
      onClick={onInclude}
      disabled={!isAdmin || isDeletingConfirmation || isEditing}
      title={!isAdmin ? "Acesso restrito a administradores" : (isDeletingConfirmation ? "Botão desabilitado durante exclusão" : (isEditing ? "Conclua a edição atual antes de incluir novo" : "Limpar todos os campos e preparar para um novo cadastro"))}
      className={`flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-500 text-white py-3 px-6 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 shadow-lg group ${(!isAdmin || isDeletingConfirmation || isEditing) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Plus size={18} className="text-white group-hover:rotate-90 transition-transform" />
      <span className="font-bold text-xs uppercase tracking-wider">INCLUIR</span>
    </button>
    <button
      id="btn-salvar"
      onClick={onSave}
      disabled={(!isEditing && !isAddingNew) || isDeletingConfirmation}
      title={isDeletingConfirmation ? "Finalize a exclusão" : (!isEditing && !isAddingNew ? "Botão desabilitado: Aguardando ação (Incluir ou Alterar)" : "Gravar dados no banco de dados")}
      className={`flex items-center justify-center gap-2 bg-gradient-to-r from-[#e31837] to-[#ff4d6d] text-white py-3 px-8 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(227,24,55,0.4)] active:scale-95 shadow-lg group ${((!isEditing && !isAddingNew) || isDeletingConfirmation) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Save size={18} className="text-white group-hover:rotate-12 transition-transform" />
      <span className="font-bold text-xs uppercase tracking-wider">SALVAR</span>
    </button>
    <button
      onClick={onAlter}
      disabled={!isAdmin || isTableEmpty || isDeletingConfirmation || isAddingNew || isEditing}
      title={!isAdmin ? "Acesso restrito a administradores" : (isDeletingConfirmation ? "Botão desabilitado durante exclusão" : (isAddingNew || isEditing ? "Conclua a operação atual antes de alterar" : "Habilitar edição para o registro selecionado"))}
      className={`flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-500 text-white py-3 px-6 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 shadow-lg group ${(!isAdmin || isTableEmpty || isDeletingConfirmation || isAddingNew || isEditing) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Edit size={18} className="text-white group-hover:-rotate-12 transition-transform" />
      <span className="font-bold text-xs uppercase tracking-wider">ALTERAR</span>
    </button>
    <button
      onClick={onDelete}
      disabled={!isAdmin || isTableEmpty || isDeletingConfirmation || isAddingNew || isEditing}
      title={!isAdmin ? "Acesso restrito a administradores" : (isDeletingConfirmation ? "Botão desabilitado durante exclusão" : (isAddingNew || isEditing ? "Conclua a ação atual antes de excluir" : "Excluir permanentemente o registro selecionado"))}
      className={`flex items-center justify-center gap-2 bg-gradient-to-r from-red-700 to-rose-600 text-white py-3 px-6 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95 shadow-lg group ${(!isAdmin || isTableEmpty || isDeletingConfirmation || isAddingNew || isEditing) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Trash2 size={18} className="text-white group-hover:scale-110 transition-transform" />
      <span className="font-bold text-xs uppercase tracking-wider">EXCLUIR</span>
    </button>
    <button
      onClick={onExit}
      title="Fechar tela atual e voltar ao Painel Principal"
      className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-700 to-slate-600 text-white py-3 px-8 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(71,85,105,0.4)] active:scale-95 col-span-2 md:col-span-1 shadow-lg group"
    >
      <LogOut size={18} className="text-white group-hover:translate-x-1 transition-transform" />
      <span className="font-bold text-xs uppercase tracking-wider">SAIR</span>
    </button>
  </div>
);

const ScreenWrapper = ({ title, subtitle, icon: Icon, children, ...footerProps }: any) => (
  <div className="glass-effect flex flex-col w-full h-full rounded-[1.5rem] md:rounded-[2rem] border border-white/10 shadow-2xl relative z-10 animate-fade-in-up overflow-hidden max-h-[calc(100vh-100px)]">
    <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 border-b border-white/10 shrink-0">
      <div className="p-2 bg-primary/20 rounded-xl text-primary border border-primary/20">
        <Icon size={20} className="md:w-6 md:h-6" />
      </div>
      <div>
        <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-tighter leading-tight">{title}</h2>
        <p className="text-slate-400 text-[10px] md:text-xs uppercase tracking-widest">{subtitle}</p>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
      {children}
    </div>
    <ActionFooter {...footerProps} />
  </div>
);

const GenericTable = ({ headers, data, title }: any) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <div className="mt-8 glass-effect rounded-[32px] border border-white/10 overflow-hidden shadow-xl animate-fade-in flex flex-col h-full max-h-[400px]">
      <div className="bg-slate-800/50 p-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <h3 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
          <Calendar size={16} className="text-primary" /> {title}
        </h3>
        {totalPages > 1 && (
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
            Página {currentPage} de {totalPages}
          </span>
        )}
      </div>
      <div className="overflow-x-auto custom-scrollbar flex-1 relative">
        <div className="overflow-y-auto custom-scrollbar h-full">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-900/90 backdrop-blur-md border-b border-white/5">
                {headers.map((h: string) => (
                  <th key={h} className={`p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${h.toLowerCase().includes('preço') || h.toLowerCase().includes('valor') ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentData.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  {Object.entries(row).map(([key, val]: any, vIdx) => {
                    const isNumeric = typeof val === 'string' && (val.includes('R$') || !isNaN(Number(val.replace(',', '.'))));
                    const isStatus = key.toLowerCase().includes('status');

                    return (
                      <td key={vIdx} className={`p-4 text-sm text-slate-300 group-hover:text-white transition-colors ${isNumeric && !val.toString().includes('R$') ? 'text-right font-mono' : 'text-left'}`}>
                        {isStatus && val === 'ATIVO' ? (
                          <span className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                            ATIVO
                          </span>
                        ) : isStatus && val === 'INATIVO' ? (
                          <span className="bg-slate-700 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            INATIVO
                          </span>
                        ) : val.toString().includes('R$') ? (
                          <div className="flex items-center justify-between w-full max-w-[140px] ml-auto font-mono">
                            <span className="text-slate-500 mr-2">R$</span>
                            <span className="text-right flex-1">{val.toString().replace('R$', '').trim()}</span>
                          </div>
                        ) : (
                          val
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-white/10 bg-slate-900/50 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            aria-label="Página anterior"
            title="Página anterior"
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              }

              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            aria-label="Próxima página"
            title="Próxima página"
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-white transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;