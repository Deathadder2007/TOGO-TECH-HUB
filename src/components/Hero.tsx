import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ShieldCheck, Truck, Clock } from 'lucide-react';

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800&h=1000",
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800&h=1000",
  "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=800&h=1000",
  "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80&w=800&h=1000"
];

export const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
        <div className="absolute top-20 right-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold tracking-wide uppercase mb-6">
              N°1 de l'informatique au Togo
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-tight mb-8">
              Équipez votre <span className="text-indigo-600 dark:text-indigo-400">Futur</span> dès Aujourd'hui.
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-lg">
              Découvrez les dernières technologies informatiques livrées partout au Togo. Qualité garantie et service après-vente local.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="#products"
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 group"
              >
                Voir le catalogue
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-gray-100 dark:border-gray-800 pt-12">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Garantie 1 an</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Livraison Lomé</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Support 24/7</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/20 aspect-[4/5] bg-gray-100 dark:bg-gray-800">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={HERO_IMAGES[currentImageIndex]}
                  alt="Matériel Informatique de Haute Technologie"
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                />
              </AnimatePresence>
            </div>
            {/* Floating Card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 z-20 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-50 dark:border-gray-700 max-w-[200px]"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">En Stock</span>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Nouveaux Arrivages MacBook M3</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
