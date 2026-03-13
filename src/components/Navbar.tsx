import React, { useState } from 'react';
import { ShoppingCart, Search, Menu, X, Laptop, Shield, LogOut, Trash2, Plus, Minus, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, login, logout, cart, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart, searchQuery, setSearchQuery, isDarkMode, toggleDarkMode } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (location.pathname !== '/') {
      navigate('/');
    }
    // Scroll to products if we have a query
    if (e.target.value.trim() !== '') {
      const productsSection = document.getElementById('products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Laptop className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              TogoTech
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Accueil</Link>
            <a href="#categories" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Catégories</a>
            <a href="#products" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Produits</a>
            <Link to="/admin" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors flex items-center gap-1">
              <Shield className="w-4 h-4" /> Admin
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title={isDarkMode ? "Passer au thème clair" : "Passer au thème sombre"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="relative flex items-center">
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.input
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Rechercher..."
                    className="absolute right-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                )}
              </AnimatePresence>
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-2 transition-colors z-10 ${isSearchOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
            
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
                  <span className="text-sm font-medium text-gray-700 hidden lg:block">{user.displayName}</span>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                Connexion
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 transition-colors ${isSearchOpen ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-gray-400 relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 px-4 py-3"
          >
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher un produit..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              <Link to="/" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-gray-600 font-medium hover:bg-indigo-50 rounded-xl">Accueil</Link>
              <a href="#categories" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-gray-600 font-medium hover:bg-indigo-50 rounded-xl">Catégories</a>
              <a href="#products" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-gray-600 font-medium hover:bg-indigo-50 rounded-xl">Produits</a>
              <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-gray-600 font-medium hover:bg-indigo-50 rounded-xl flex items-center gap-2">
                <Shield className="w-5 h-5" /> Administration
              </Link>
              
              {user ? (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full" />
                    <span className="text-sm font-medium text-gray-700">{user.displayName}</span>
                  </div>
                  <button onClick={logout} className="text-red-600 text-sm font-bold">Déconnexion</button>
                </div>
              ) : (
                <button 
                  onClick={() => { login(); setIsOpen(false); }}
                  className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-semibold"
                >
                  Connexion
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl">
                    <ShoppingCart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Votre Panier</h2>
                </div>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button 
                      onClick={clearCart}
                      className="text-sm font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Vider
                    </button>
                  )}
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                      <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Votre panier est vide</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-[250px]">Découvrez nos produits et commencez vos achats dès maintenant.</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                      Continuer mes achats
                    </button>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {cart.map((item) => (
                      <motion.div 
                        key={item.id} 
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: -20 }}
                        className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 group"
                      >
                        <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white truncate mb-1">{item.name}</h4>
                            <p className="text-indigo-600 dark:text-indigo-400 font-black">{item.price.toLocaleString()} FCFA</p>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                              </button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors"
                              title="Retirer du panier"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-gray-500 dark:text-gray-400 font-medium text-lg">Total</span>
                    <span className="text-3xl font-black text-gray-900 dark:text-white">{cartTotal.toLocaleString()} FCFA</span>
                  </div>
                  <Link 
                    to="/checkout"
                    onClick={() => setIsCartOpen(false)}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 group"
                  >
                    Passer la commande
                    <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
