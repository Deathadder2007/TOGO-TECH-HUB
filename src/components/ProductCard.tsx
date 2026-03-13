import React from 'react';
import { Product } from '../types';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  key?: React.Key;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useStore();
  const navigate = useNavigate();

  const handleImageClick = () => {
    addToCart(product);
    navigate('/checkout');
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden group hover:shadow-2xl hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20 transition-all duration-300"
    >
      <div 
        className="relative aspect-[4/3] overflow-hidden cursor-pointer"
        onClick={handleImageClick}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {product.badge && (
          <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            {product.badge}
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 dark:text-gray-500 block uppercase font-bold tracking-tighter">Prix</span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
              {product.price.toLocaleString()} FCFA
            </span>
          </div>
          <button 
            onClick={() => addToCart(product)}
            className="bg-gray-900 dark:bg-gray-700 text-white p-3 rounded-2xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors shadow-lg shadow-gray-200 dark:shadow-none active:scale-95 transition-transform"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
