import React, { useState, useEffect } from 'react';
import {
  Shield,
  LogOut,
  ShoppingBag,
  Calendar,
  Utensils,
  Layers,
  Star,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  X
} from 'lucide-react';
import { type User } from 'firebase/auth';
import { Category, MenuItem, Order, OrderStatus, Reservation, ReservationStatus, Review } from '../types/restaurant';
import { loginAdmin, logoutAdmin, subscribeToAuth } from '../services/authService';
import {
  subscribeOrders,
  updateOrderStatus,
  subscribeReservations,
  updateReservationStatus,
  subscribeMenuItems,
  saveMenuItem,
  deleteMenuItem,
  toggleItemAvailability,
  toggleItemFeatured,
  subscribeCategories,
  saveCategory,
  deleteCategory,
  subscribeReviews,
  updateReviewApproval,
  deleteReview,
} from '../services/dbService';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Login form state
  const [email, setEmail] = useState('admin@hotwok.com');
  const [password, setPassword] = useState('HotWok@2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'reservations' | 'menu' | 'categories' | 'reviews'>('dashboard');

  // Real-time Firestore Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Search & Filters in Admin
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [resStatusFilter, setResStatusFilter] = useState<string>('ALL');
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('ALL');

  // Dish Add/Edit Modal
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  // Category Add/Edit Modal
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const unsubOrders = subscribeOrders((data) => setOrders(data));
    const unsubRes = subscribeReservations((data) => setReservations(data));
    const unsubMenu = subscribeMenuItems((data) => setMenuItems(data));
    const unsubCats = subscribeCategories((data) => setCategories(data));
    const unsubReviews = subscribeReviews((data) => setReviews(data), true);

    return () => {
      unsubOrders();
      unsubRes();
      unsubMenu();
      unsubCats();
      unsubReviews();
    };
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await loginAdmin(email.trim(), password);
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
  };

  // Quick stats calculations
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => ['NEW', 'CONFIRMED', 'PREPARING'].includes(o.status)).length;
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingReservations = reservations.filter((r) => r.status === 'PENDING').length;

  // Popular dishes calculation from actual orders
  const dishSalesMap: Record<string, { name: string; count: number; revenue: number }> = {};
  orders.forEach((ord) => {
    if (ord.status !== 'CANCELLED') {
      ord.items.forEach((item) => {
        if (!dishSalesMap[item.itemId]) {
          dishSalesMap[item.itemId] = { name: item.name, count: 0, revenue: 0 };
        }
        dishSalesMap[item.itemId].count += item.quantity;
        dishSalesMap[item.itemId].revenue += item.totalPrice;
      });
    }
  });
  const popularDishes = Object.values(dishSalesMap).sort((a, b) => b.count - a.count).slice(0, 5);

  // Filtered Orders
  const filteredOrders = orders.filter((ord) => {
    if (orderStatusFilter !== 'ALL' && ord.status !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      const matchNo = ord.orderNumber.toLowerCase().includes(q);
      const matchName = ord.customerName.toLowerCase().includes(q);
      const matchPhone = ord.customerPhone.includes(q);
      return matchNo || matchName || matchPhone;
    }
    return true;
  });

  // Filtered Reservations
  const filteredReservations = reservations.filter((res) => {
    if (resStatusFilter !== 'ALL' && res.status !== resStatusFilter) return false;
    return true;
  });

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter((item) => {
    if (menuCategoryFilter !== 'ALL' && item.categoryId !== menuCategoryFilter) return false;
    if (menuSearch.trim()) {
      return item.name.toLowerCase().includes(menuSearch.toLowerCase().trim());
    }
    return true;
  });

  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#091711] flex items-center justify-center text-[#f6f3ed]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#c8c0b2]">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  // Not logged in: Show Admin Authentication Screen
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#07130e] text-[#f6f3ed] p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#091711] border border-[#224d3b] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#15382a] text-[#c8c0b2] hover:text-[#f6f3ed]"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#15382a] border border-[#d4af37] flex items-center justify-center mx-auto text-[#d4af37] shadow">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#f6f3ed]">Hot Wok Admin Portal</h2>
            <p className="text-xs text-[#d4af37] tracking-wider uppercase font-semibold">
              Firebase Authentication Secured
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-950/70 border border-red-500 rounded-lg text-xs text-red-200 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#c8c0b2] mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hotwok.com"
                className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c8c0b2] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="p-3 bg-[#15382a]/50 rounded-lg border border-[#224d3b] text-[11px] text-[#c8c0b2] space-y-1">
              <span className="font-semibold text-[#d4af37] block">Standard Restaurant Access:</span>
              <p>Default credentials are prefilled for instant access to Hot Wok manager tools.</p>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e2c258] hover:to-[#c59b27] text-[#091711] font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#091711] border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Authenticate Admin</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="fixed inset-0 z-50 bg-[#07130e] text-[#f6f3ed] flex flex-col overflow-hidden">
      {/* Top Admin Header */}
      <header className="bg-[#091711] border-b border-[#224d3b] px-4 sm:px-6 py-3.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif text-lg font-bold text-[#f6f3ed]">HOT WOK MANAGEMENT PORTAL</h1>
              <span className="bg-emerald-900/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-[#8ea098]">Authenticated as: {currentUser.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-[#15382a] border border-[#224d3b] text-xs text-[#c8c0b2] hover:text-red-400 hover:border-red-500 transition-colors flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#15382a] text-[#c8c0b2] hover:text-[#f6f3ed]"
            title="Close Admin Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-56 bg-[#091711] border-r border-[#224d3b] p-3 flex md:flex-col overflow-x-auto md:overflow-x-visible space-x-2 md:space-x-0 md:space-y-1.5 flex-shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-[#d4af37] text-[#091711]'
                : 'text-[#c8c0b2] hover:bg-[#15382a] hover:text-[#f6f3ed]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'orders'
                ? 'bg-[#d4af37] text-[#091711]'
                : 'text-[#c8c0b2] hover:bg-[#15382a] hover:text-[#f6f3ed]'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <ShoppingBag className="w-4 h-4" />
              <span>Orders</span>
            </div>
            {pendingOrders > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                {pendingOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'reservations'
                ? 'bg-[#d4af37] text-[#091711]'
                : 'text-[#c8c0b2] hover:bg-[#15382a] hover:text-[#f6f3ed]'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-4 h-4" />
              <span>Reservations</span>
            </div>
            {pendingReservations > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-[#091711] text-[10px] font-bold">
                {pendingReservations}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'menu'
                ? 'bg-[#d4af37] text-[#091711]'
                : 'text-[#c8c0b2] hover:bg-[#15382a] hover:text-[#f6f3ed]'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Menu Items ({menuItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'categories'
                ? 'bg-[#d4af37] text-[#091711]'
                : 'text-[#c8c0b2] hover:bg-[#15382a] hover:text-[#f6f3ed]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'reviews'
                ? 'bg-[#d4af37] text-[#091711]'
                : 'text-[#c8c0b2] hover:bg-[#15382a] hover:text-[#f6f3ed]'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Reviews ({reviews.length})</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#07130e]">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-[#091711] border border-[#224d3b] rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-[#8ea098] uppercase font-bold tracking-wider">Total Orders</span>
                  <div className="font-serif text-2xl font-bold text-[#f6f3ed]">{totalOrders}</div>
                </div>

                <div className="bg-[#091711] border border-[#224d3b] rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-amber-400 uppercase font-bold tracking-wider">Active Pending</span>
                  <div className="font-serif text-2xl font-bold text-amber-400">{pendingOrders}</div>
                </div>

                <div className="bg-[#091711] border border-[#224d3b] rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider">Completed</span>
                  <div className="font-serif text-2xl font-bold text-emerald-400">{completedOrders}</div>
                </div>

                <div className="bg-[#091711] border border-[#224d3b] rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-[#8ea098] uppercase font-bold tracking-wider">Reservations</span>
                  <div className="font-serif text-2xl font-bold text-[#d4af37]">{reservations.length}</div>
                </div>

                <div className="bg-[#091711] border border-[#224d3b] rounded-xl p-4 space-y-1 col-span-2 lg:col-span-1">
                  <span className="text-[11px] text-[#d4af37] uppercase font-bold tracking-wider">Total Revenue</span>
                  <div className="font-serif text-2xl font-bold text-[#d4af37]">₹{totalRevenue}</div>
                </div>
              </div>

              {/* Popular Dishes & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-[#091711] border border-[#224d3b] rounded-xl p-5 space-y-4">
                  <h3 className="font-serif text-base font-bold text-[#f6f3ed] flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-[#d4af37]" />
                    <span>Popular Dishes Breakdown</span>
                  </h3>
                  {popularDishes.length === 0 ? (
                    <p className="text-xs text-[#c8c0b2]">Customer order trends will populate here.</p>
                  ) : (
                    <div className="space-y-3 text-xs">
                      {popularDishes.map((dish, i) => (
                        <div key={i} className="flex justify-between items-center bg-[#15382a]/50 p-2.5 rounded-lg">
                          <div>
                            <span className="font-bold text-[#f6f3ed]">{dish.name}</span>
                            <span className="text-[11px] text-[#8ea098] block">{dish.count} portions sold</span>
                          </div>
                          <span className="font-serif font-bold text-[#d4af37]">₹{dish.revenue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-6 bg-[#091711] border border-[#224d3b] rounded-xl p-5 space-y-4">
                  <h3 className="font-serif text-base font-bold text-[#f6f3ed] flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#d4af37]" />
                    <span>Recent Customer Orders</span>
                  </h3>
                  <div className="space-y-2 text-xs max-h-72 overflow-y-auto">
                    {orders.slice(0, 5).map((ord) => (
                      <div key={ord.id} className="p-3 bg-[#15382a]/40 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-[#d4af37]">{ord.orderNumber}</span>
                            <span className="font-medium text-[#f6f3ed]">{ord.customerName}</span>
                          </div>
                          <span className="text-[11px] text-[#8ea098]">
                            {ord.items.length} dishes • {ord.orderType === 'dine_in' ? 'Dine-in' : 'Takeaway'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-serif font-bold text-[#f6f3ed]">₹{ord.total}</span>
                          <span className="block text-[10px] text-amber-400">{ord.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#d4af37] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by Order #, Customer or Phone..."
                    className="w-full bg-[#091711] border border-[#224d3b] rounded-lg pl-9 pr-3 py-2 text-xs text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-[#d4af37]" />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-[#091711] border border-[#224d3b] rounded-lg px-3 py-2 text-xs text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="ALL">All Statuses ({orders.length})</option>
                    <option value="NEW">NEW</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PREPARING">PREPARING</option>
                    <option value="READY">READY</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center bg-[#091711] border border-[#224d3b] rounded-xl text-xs text-[#c8c0b2]">
                  No orders match the selected filter.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-[#091711] border border-[#224d3b] rounded-xl p-4 sm:p-5 space-y-3 shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#224d3b] pb-3">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono font-bold text-sm text-[#d4af37]">{ord.orderNumber}</span>
                          <span className="text-xs text-[#f6f3ed] font-semibold">{ord.customerName}</span>
                          <span className="text-xs text-[#8ea098]">({ord.customerPhone})</span>
                        </div>

                        {/* Status dropdown */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-[#8ea098]">Status:</span>
                          <select
                            value={ord.status}
                            onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                            className="bg-[#15382a] border border-[#d4af37] text-xs font-bold text-[#d4af37] rounded-md px-2.5 py-1 focus:outline-none"
                          >
                            <option value="NEW">NEW</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="PREPARING">PREPARING</option>
                            <option value="READY">READY</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </div>
                      </div>

                      {/* Items & details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#8ea098] block mb-1">
                            Dishes Ordered:
                          </span>
                          <div className="space-y-1">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-[#c8c0b2]">
                                <span>
                                  {it.quantity}x {it.name} {it.portion !== 'single' && `(${it.portion})`}
                                </span>
                                <span className="font-mono text-[#f6f3ed]">₹{it.totalPrice}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1 text-[#c8c0b2] sm:border-l sm:border-[#224d3b] sm:pl-4">
                          <div>
                            <span className="text-[#8ea098]">Type: </span>
                            <span className="font-semibold text-[#f6f3ed] capitalize">
                              {ord.orderType === 'dine_in' ? 'Dine-in' : 'Takeaway'}
                              {ord.tableNumber ? ` (Table #${ord.tableNumber})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#8ea098]">Total: </span>
                            <span className="font-serif font-bold text-sm text-[#d4af37]">₹{ord.total}</span>
                          </div>
                          {ord.specialInstructions && (
                            <div>
                              <span className="text-[#8ea098]">Notes: </span>
                              <span className="italic text-amber-300">{ord.specialInstructions}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-[#8ea098] pt-1">
                            Ordered at: {new Date(ord.createdAt).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESERVATIONS */}
          {activeTab === 'reservations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-[#f6f3ed]">Table Bookings</h3>
                <select
                  value={resStatusFilter}
                  onChange={(e) => setResStatusFilter(e.target.value)}
                  className="bg-[#091711] border border-[#224d3b] rounded-lg px-3 py-1.5 text-xs text-[#f6f3ed]"
                >
                  <option value="ALL">All Reservations ({reservations.length})</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              {filteredReservations.length === 0 ? (
                <div className="p-8 text-center bg-[#091711] border border-[#224d3b] rounded-xl text-xs text-[#c8c0b2]">
                  No table reservations found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredReservations.map((res) => (
                    <div
                      key={res.id}
                      className="bg-[#091711] border border-[#224d3b] rounded-xl p-5 space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between border-b border-[#224d3b] pb-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-[#d4af37]">{res.reservationId}</span>
                          <h4 className="font-semibold text-sm text-[#f6f3ed]">{res.name}</h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            res.status === 'CONFIRMED'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                              : res.status === 'REJECTED'
                              ? 'bg-red-950 text-red-300 border-red-500'
                              : 'bg-amber-950 text-amber-300 border-amber-500'
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-[#c8c0b2]">
                        <div>
                          <span className="text-[#8ea098] block">Date & Time:</span>
                          <span className="font-medium text-[#f6f3ed]">
                            {res.date} at {res.time}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8ea098] block">Guests:</span>
                          <span className="font-medium text-[#f6f3ed]">{res.guests} Persons</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[#8ea098] block">Phone:</span>
                          <a href={`tel:${res.phone}`} className="text-[#d4af37] font-semibold">
                            +91 {res.phone}
                          </a>
                        </div>
                        {res.specialRequest && (
                          <div className="col-span-2 text-amber-200/90 italic">
                            "{res.specialRequest}"
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 pt-2 border-t border-[#224d3b]/60">
                        {res.status !== 'CONFIRMED' && (
                          <button
                            onClick={() => updateReservationStatus(res.id, 'CONFIRMED')}
                            className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Confirm</span>
                          </button>
                        )}
                        {res.status !== 'REJECTED' && (
                          <button
                            onClick={() => updateReservationStatus(res.id, 'REJECTED')}
                            className="flex-1 py-1.5 bg-red-900/80 hover:bg-red-800 text-red-200 rounded text-xs font-semibold flex items-center justify-center space-x-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                        {res.status === 'CONFIRMED' && (
                          <button
                            onClick={() => updateReservationStatus(res.id, 'COMPLETED')}
                            className="flex-1 py-1.5 bg-[#15382a] hover:bg-[#1d4b38] text-[#d4af37] rounded text-xs font-semibold"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MENU ITEMS MANAGEMENT (CRUD) */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-[#d4af37] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      placeholder="Search dish name..."
                      className="w-full bg-[#091711] border border-[#224d3b] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <select
                    value={menuCategoryFilter}
                    onChange={(e) => setMenuCategoryFilter(e.target.value)}
                    className="bg-[#091711] border border-[#224d3b] rounded-lg px-2.5 py-1.5 text-xs text-[#f6f3ed]"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    setEditingItem({
                      id: `dish-${Date.now()}`,
                      name: '',
                      description: '',
                      categoryId: categories[0]?.id || 'starters',
                      categoryName: categories[0]?.name || 'Starters',
                      isVeg: false,
                      priceType: 'single',
                      price: 250,
                      image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
                      isAvailable: true,
                      isFeatured: false,
                      cuisine: 'Chinese',
                      spiceLevel: 1,
                      sortOrder: menuItems.length + 1,
                    });
                    setIsNewItemModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b89327] text-[#091711] font-bold text-xs flex items-center justify-center space-x-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Dish</span>
                </button>
              </div>

              {/* Dish table */}
              <div className="bg-[#091711] border border-[#224d3b] rounded-xl overflow-x-auto shadow-md">
                <table className="w-full text-left text-xs text-[#c8c0b2]">
                  <thead className="bg-[#0f271d] text-[#f6f3ed] border-b border-[#224d3b] uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Dish</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Cuisine</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Available</th>
                      <th className="p-3">Featured</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#224d3b]/50">
                    {filteredMenuItems.map((item) => (
                      <tr key={item.id} className="hover:bg-[#15382a]/30 transition-colors">
                        <td className="p-3 flex items-center space-x-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-md object-cover border border-[#224d3b]"
                          />
                          <div>
                            <div className="font-semibold text-[#f6f3ed] flex items-center space-x-1.5">
                              <span>{item.name}</span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  item.isVeg ? 'bg-emerald-400' : 'bg-red-400'
                                }`}
                              />
                            </div>
                            <span className="text-[10px] text-[#8ea098] line-clamp-1">{item.description}</span>
                          </div>
                        </td>

                        <td className="p-3 whitespace-nowrap">{item.categoryName}</td>
                        <td className="p-3 whitespace-nowrap text-[#d4af37]">{item.cuisine}</td>
                        <td className="p-3 whitespace-nowrap font-serif font-bold text-[#f6f3ed]">
                          ₹{item.price}
                          {item.halfPrice && item.fullPrice && (
                            <span className="block text-[10px] text-[#8ea098] font-sans">
                              (H: ₹{item.halfPrice} / F: ₹{item.fullPrice})
                            </span>
                          )}
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <button
                            onClick={() => toggleItemAvailability(item.id, !item.isAvailable)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.isAvailable
                                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500'
                                : 'bg-red-900/60 text-red-300 border border-red-500'
                            }`}
                          >
                            {item.isAvailable ? 'In Stock' : 'Sold Out'}
                          </button>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <button
                            onClick={() => toggleItemFeatured(item.id, !item.isFeatured)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.isFeatured
                                ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]'
                                : 'text-[#8ea098] hover:text-[#f6f3ed]'
                            }`}
                          >
                            {item.isFeatured ? '★ Featured' : 'Normal'}
                          </button>
                        </td>

                        <td className="p-3 whitespace-nowrap text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem({ ...item });
                              setIsNewItemModalOpen(true);
                            }}
                            className="p-1.5 rounded hover:bg-[#15382a] text-[#c8c0b2] hover:text-[#d4af37]"
                            title="Edit dish"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${item.name}" from menu?`)) {
                                deleteMenuItem(item.id);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-[#15382a] text-[#c8c0b2] hover:text-red-400"
                            title="Delete dish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CATEGORIES MANAGEMENT (CRUD) */}
          {activeTab === 'categories' && (
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-[#f6f3ed]">Menu Categories</h3>
                <button
                  onClick={() => {
                    setEditingCategory({
                      id: `cat-${Date.now()}`,
                      name: '',
                      slug: '',
                      sortOrder: categories.length + 1,
                      description: '',
                    });
                    setIsCategoryModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b89327] text-[#091711] font-bold text-xs flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
              </div>

              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-[#091711] border border-[#224d3b] rounded-xl p-4 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#f6f3ed] text-sm">{cat.name}</div>
                      <span className="text-[11px] text-[#8ea098]">
                        Slug: {cat.slug} • Order: #{cat.sortOrder}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingCategory({ ...cat });
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1.5 rounded bg-[#15382a] text-[#c8c0b2] hover:text-[#d4af37]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete category "${cat.name}"?`)) {
                            deleteCategory(cat.id);
                          }
                        }}
                        className="p-1.5 rounded bg-[#15382a] text-[#c8c0b2] hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#f6f3ed]">Customer Reviews & Moderation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-[#091711] border border-[#224d3b] rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-[#f6f3ed]">{rev.name}</h4>
                        <div className="flex items-center text-[#d4af37] text-[10px] mt-0.5">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-[#d4af37]" />
                          ))}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rev.approved ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {rev.approved ? 'Live On Site' : 'Hidden'}
                      </span>
                    </div>

                    <p className="text-[#c8c0b2] italic">"{rev.comment}"</p>

                    {rev.dishRecommended && (
                      <div className="text-[11px] text-[#d4af37]">Recommended: {rev.dishRecommended}</div>
                    )}

                    <div className="pt-2 border-t border-[#224d3b] flex items-center justify-end space-x-2">
                      <button
                        onClick={() => updateReviewApproval(rev.id, !rev.approved)}
                        className="px-2.5 py-1 rounded bg-[#15382a] text-[#c8c0b2] hover:text-[#d4af37] text-[11px] flex items-center space-x-1"
                      >
                        {rev.approved ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{rev.approved ? 'Hide' : 'Approve'}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this review?')) deleteReview(rev.id);
                        }}
                        className="p-1 rounded bg-[#15382a] text-[#c8c0b2] hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DISH CREATE / EDIT MODAL */}
      {isNewItemModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-[#091711] border border-[#224d3b] rounded-2xl max-w-xl w-full p-6 text-[#f6f3ed] shadow-2xl space-y-4">
            <h3 className="font-serif text-xl font-bold">
              {menuItems.some((m) => m.id === editingItem.id) ? 'Edit Dish' : 'Add New Asian Dish'}
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await saveMenuItem(editingItem);
                setIsNewItemModalOpen(false);
                setEditingItem(null);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-[#c8c0b2] mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="e.g. Hot Wok Dragon Chicken"
                  className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg p-2 text-[#f6f3ed]"
                />
              </div>

              <div>
                <label className="block text-[#c8c0b2] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg p-2 text-[#f6f3ed]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#c8c0b2] mb-1">Category</label>
                  <select
                    value={editingItem.categoryId}
                    onChange={(e) => {
                      const c = categories.find((cat) => cat.id === e.target.value);
                      setEditingItem({
                        ...editingItem,
                        categoryId: e.target.value,
                        categoryName: c ? c.name : editingItem.categoryName,
                      });
                    }}
                    className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg p-2 text-[#f6f3ed]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#c8c0b2] mb-1">Cuisine</label>
                  <select
                    value={editingItem.cuisine}
                    onChange={(e) => setEditingItem({ ...editingItem, cuisine: e.target.value as any })}
                    className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg p-2 text-[#f6f3ed]"
                  >
                    <option value="Chinese">Chinese</option>
                    <option value="Korean">Korean</option>
                    <option value="Malaysian">Malaysian</option>
                    <option value="Thai">Thai</option>
                    <option value="Fusion">Fusion</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#c8c0b2] mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg p-2 text-[#f6f3ed]"
                  />
                </div>
                <div>
                  <label className="block text-[#c8c0b2] mb-1">Half Price (₹ Optional)</label>
                  <input
                    type="number"
                    value={editingItem.halfPrice || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        halfPrice: e.target.value ? Number(e.target.value) : undefined,
                        priceType: e.target.value ? 'portion' : editingItem.priceType,
                      })
                    }
                    className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg p-2 text-[#f6f3ed]"
                  />
                </div>
                <div>
                  <label className="block text-[#c8c0b2] mb-1">Full Price (₹ Optional)</label>
                  <input
                    type="number"
                    value={editingItem.fullPrice || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        fullPrice: e.target.value ? Number(e.target.value) : undefined,
                        priceType: e.target.value ? 'portion' : editingItem.priceType,
                      })
                    }
                    className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg p-2 text-[#f6f3ed]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#c8c0b2] mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={editingItem.image}
                  onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg p-2 text-[#f6f3ed]"
                />
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isVeg}
                    onChange={(e) => setEditingItem({ ...editingItem, isVeg: e.target.checked })}
                    className="accent-emerald-500"
                  />
                  <span>Pure Vegetarian</span>
                </label>

                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isAvailable}
                    onChange={(e) => setEditingItem({ ...editingItem, isAvailable: e.target.checked })}
                    className="accent-[#d4af37]"
                  />
                  <span>In Stock / Available</span>
                </label>

                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isFeatured}
                    onChange={(e) => setEditingItem({ ...editingItem, isFeatured: e.target.checked })}
                    className="accent-[#d4af37]"
                  />
                  <span>Chef Featured</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#224d3b]">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#224d3b] text-[#c8c0b2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#d4af37] text-[#091711] font-bold"
                >
                  Save Dish to Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY CREATE / EDIT MODAL */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-[#091711] border border-[#224d3b] rounded-2xl max-w-sm w-full p-6 text-[#f6f3ed] shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold">Category Details</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await saveCategory(editingCategory);
                setIsCategoryModalOpen(false);
                setEditingCategory(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-[#c8c0b2] mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                    })
                  }
                  className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg p-2 text-[#f6f3ed]"
                />
              </div>

              <div>
                <label className="block text-[#c8c0b2] mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={editingCategory.slug}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg p-2 text-[#f6f3ed]"
                />
              </div>

              <div>
                <label className="block text-[#c8c0b2] mb-1">Sort Order Index</label>
                <input
                  type="number"
                  value={editingCategory.sortOrder}
                  onChange={(e) => setEditingCategory({ ...editingCategory, sortOrder: Number(e.target.value) })}
                  className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg p-2 text-[#f6f3ed]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#224d3b] text-[#c8c0b2]"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-[#d4af37] text-[#091711] font-bold">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
