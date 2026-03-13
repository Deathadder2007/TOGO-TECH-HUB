import { useState, useEffect } from 'react';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../constants';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Category } from '../types';
import { useStore } from '../context/StoreContext';

export const CategorySection = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const { setSearchQuery } = useStore();

  const handleCategoryClick = (categoryName: string) => {
    setSearchQuery(categoryName);
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      
      const sortedCats = cats.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCategories(sortedCats.length > 0 ? sortedCats : DEFAULT_CATEGORIES);
    }, (error) => {
      console.error("Firestore error:", error);
      setCategories(DEFAULT_CATEGORIES);
    });

    return () => unsubscribe();
  }, []);

  return (
    <section id="categories" className="py-24 bg-gray-50/50 dark:bg-gray-800/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Parcourir par Catégorie</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Trouvez exactement ce dont vous avez besoin parmi nos sélections spécialisées.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category, index) => {
            const Icon = (Icons as any)[category.icon] || Icons.HelpCircle;
            return (
              <motion.div
                key={category.id}
                onClick={() => handleCategoryClick(category.name)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl hover:shadow-indigo-50 dark:hover:shadow-indigo-900/20 transition-all group cursor-pointer"
              >
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                  <Icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full w-fit mb-3 block">
                  {category.type || 'hardware'}
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{category.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
