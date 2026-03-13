/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategorySection } from './components/CategorySection';
import { ProductCard } from './components/ProductCard';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/AdminPanel';
import { Checkout } from './components/Checkout';
import { PRODUCTS } from './constants';
import { ArrowRight, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Product } from './types';
import { useStore } from './context/StoreContext';

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery, setSearchQuery } = useStore();

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // Sort in memory to avoid query issues if createdAt is missing
      const sortedProds = prods.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setProducts(sortedProds.length > 0 ? sortedProds : PRODUCTS);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setProducts(PRODUCTS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-300">
      <Navbar />
      
      <main>
        <Hero />
        
        <CategorySection />

        {/* Featured Products Section */}
        <section id="products" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                  {searchQuery ? `Résultats pour "${searchQuery}"` : 'Produits Vedettes'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-xl">
                  {searchQuery 
                    ? 'Découvrez les produits correspondants à votre recherche.' 
                    : 'Une sélection rigoureuse des meilleurs équipements informatiques disponibles actuellement à Lomé.'}
                </p>
              </div>
              {searchQuery ? (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="flex items-center gap-2 text-gray-500 font-bold hover:text-indigo-600 transition-all"
                >
                  Effacer la recherche <X className="w-5 h-5" />
                </button>
              ) : (
                <button className="flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all">
                  Voir tout le catalogue <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {products.filter(product => 
                  product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  product.category.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                  <div className="text-center py-20">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Aucun produit trouvé</h3>
                    <p className="text-gray-500 dark:text-gray-400">Essayez de modifier votre recherche.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products
                      .filter(product => 
                        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        product.category.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Newsletter / CTA Section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-indigo-600 rounded-[3rem] overflow-hidden px-8 py-16 md:p-20 text-center">
              {/* Decorative circles */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
              
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                  Ne manquez aucune de nos offres exclusives au Togo
                </h2>
                <p className="text-indigo-100 text-lg mb-10">
                  Inscrivez-vous à notre newsletter pour recevoir les derniers arrivages et des réductions spéciales réservées à nos abonnés.
                </p>
                <form 
                  action="https://formsubmit.co/thomwinner2007@gmail.com" 
                  method="POST"
                  className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
                >
                  <input type="text" name="_honey" style={{ display: 'none' }} />
                  <input type="hidden" name="_captcha" value="false" />
                  <input type="hidden" name="_next" value={window.location.href} />
                  
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Votre adresse email"
                    className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                  />
                  <button 
                    type="submit"
                    className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-colors shadow-lg"
                  >
                    S'abonner
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

import { ErrorBoundary } from './components/ErrorBoundary';
import { StoreProvider } from './context/StoreContext';

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Shop />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </Router>
      </StoreProvider>
    </ErrorBoundary>
  );
}
