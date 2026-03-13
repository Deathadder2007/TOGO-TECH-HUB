import React, { useState, useEffect } from 'react';
import { db, auth, signInWithGoogle, logout } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Product, Category } from '../types';
import { PRODUCTS as DEFAULT_PRODUCTS, CATEGORIES as DEFAULT_CATEGORIES } from '../constants';
import * as Icons from 'lucide-react';
import { Plus, Edit2, Trash2, LogOut, Shield, Package, Tag, Image as ImageIcon, DollarSign, X, Check, Database, Layers, LayoutGrid, RefreshCw, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

const ADMIN_EMAILS = ['thomwinner2007@gmail.com', 'alikizanjoyce@gmail.com', 'ephra888@gmail.com'];

type Tab = 'products' | 'categories';

export const AdminPanel = () => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    badge: ''
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    icon: 'Package',
    description: '',
    order: '0',
    type: 'hardware' as Category['type']
  });

  const [isDragging, setIsDragging] = useState(false);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        setFormData(prev => ({ ...prev, image: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const AVAILABLE_ICONS = [
    'Laptop', 'Mouse', 'Wifi', 'HardDrive', 'Smartphone', 'Monitor', 'Cpu', 'Headphones', 
    'Keyboard', 'Speaker', 'Printer', 'Camera', 'Watch', 'Tablet', 'Server', 'Database',
    'Shield', 'Globe', 'Cloud', 'Zap', 'Settings', 'Tool', 'Briefcase', 'ShoppingBag'
  ];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    const qProducts = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
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
      
      setProducts(sortedProds);
    });

    const qCategories = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(cats);
      
      // Set default category in form if not set
      if (cats.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: cats[0].id }));
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, [formData.category]);

  const handleOpenModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        image: product.image,
        badge: product.badge || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: categories.length > 0 ? categories[0].id : '',
        image: '',
        badge: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenCategoryModal = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({
        name: category.name,
        icon: category.icon,
        description: category.description,
        order: (category.order || 0).toString(),
        type: category.type || 'hardware'
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        icon: 'Package',
        description: '',
        order: categories.length.toString(),
        type: 'hardware'
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      createdAt: editingProduct ? editingProduct.createdAt : serverTimestamp()
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      setIsModalOpen(false);
    } catch (error) {
      const wrappedError = handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, 'products');
      console.error("Erreur lors de l'enregistrement du produit:", error);
      throw wrappedError;
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryData = {
      ...categoryFormData,
      order: parseInt(categoryFormData.order)
    };

    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), categoryData);
      } else {
        await addDoc(collection(db, 'categories'), categoryData);
      }
      setIsCategoryModalOpen(false);
    } catch (error) {
      const wrappedError = handleFirestoreError(error, editingCategory ? OperationType.UPDATE : OperationType.CREATE, 'categories');
      console.error("Erreur lors de l'enregistrement de la catégorie:", error);
      throw wrappedError;
    }
  };

  const handleDelete = async (id: string) => {
    console.log("Attempting to delete product with ID:", id);
    if (!id) {
      console.error("Delete failed: No ID provided");
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'products', id));
      console.log("Product deleted successfully:", id);
    } catch (error) {
      const wrappedError = handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      console.error("Erreur lors de la suppression du produit:", error);
      throw wrappedError;
    }
  };

  const handleCategoryDelete = async (id: string) => {
    const productsInCategory = products.filter(p => p.category === id);
    if (productsInCategory.length > 0) {
      console.warn(`Impossible de supprimer cette catégorie car elle contient ${productsInCategory.length} produits.`);
      return;
    }

    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      const wrappedError = handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
      console.error("Erreur lors de la suppression de la catégorie:", error);
      throw wrappedError;
    }
  };

  const seedData = async (reset = false) => {
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      
      if (reset) {
        // Delete existing products
        for (const prod of products) {
          batch.delete(doc(db, 'products', prod.id));
        }
        // Delete existing categories
        for (const cat of categories) {
          batch.delete(doc(db, 'categories', cat.id));
        }
      }
      
      // Seed Categories
      for (const cat of DEFAULT_CATEGORIES) {
        const catRef = doc(collection(db, 'categories'), cat.id);
        batch.set(catRef, {
          name: cat.name,
          icon: cat.icon,
          description: cat.description,
          order: DEFAULT_CATEGORIES.indexOf(cat),
          type: cat.type || 'hardware'
        });
      }
      
      // Seed Products
      for (const prod of DEFAULT_PRODUCTS) {
        const prodRef = doc(collection(db, 'products'));
        batch.set(prodRef, {
          name: prod.name,
          description: prod.description,
          price: prod.price,
          category: prod.category,
          image: prod.image,
          badge: prod.badge || '',
          createdAt: serverTimestamp()
        });
      }
      
      await batch.commit();
      console.log(reset ? 'Données réinitialisées avec succès !' : 'Données importées avec succès !');
    } catch (error) {
      console.error("Seed error:", error);
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Accès Administrateur</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Veuillez vous connecter avec votre compte administrateur pour gérer la boutique.</p>
          <button
            onClick={signInWithGoogle}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
          >
            Se connecter avec Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => seedData(false)}
              disabled={isSeeding}
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
              title="Importer les données par défaut"
            >
              <Database className={`w-5 h-5 ${isSeeding ? 'animate-pulse' : ''}`} />
              Initialiser
            </button>
            <button
              onClick={() => seedData(true)}
              disabled={isSeeding}
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              title="Réinitialiser aux valeurs par défaut"
            >
              <RefreshCw className={`w-5 h-5 ${isSeeding ? 'animate-spin' : ''}`} />
              Réinitialiser
            </button>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-10 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 w-fit">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'products' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            Produits
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'categories' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Layers className="w-5 h-5" />
            Catégories
          </button>
        </div>

        {activeTab === 'products' ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">Gestion des Produits</h2>
                <p className="text-gray-500 dark:text-gray-400">Ajoutez, modifiez ou supprimez vos produits en temps réel.</p>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none flex items-center gap-2 self-start"
              >
                <Plus className="w-5 h-5" />
                Nouveau Produit
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden group hover:shadow-xl transition-all"
                >
                  <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.badge && (
                      <span className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {product.badge}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-900 dark:text-white hover:bg-indigo-600 hover:text-white transition-all shadow-lg"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-900 dark:text-white hover:bg-red-600 hover:text-white transition-all shadow-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Mobile Actions */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 lg:hidden">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-gray-900 dark:text-white shadow-md"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 shadow-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                        {categories.find(c => c.id === product.category)?.name || 'Catégorie inconnue'}
                      </span>
                      <span className="text-lg font-black text-gray-900 dark:text-white">
                        {product.price.toLocaleString()} FCFA
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{product.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">Gestion des Catégories</h2>
                <p className="text-gray-500 dark:text-gray-400">Organisez vos produits par types d'équipements.</p>
              </div>
              <button
                onClick={() => handleOpenCategoryModal()}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none flex items-center gap-2 self-start"
              >
                <Plus className="w-5 h-5" />
                Nouvelle Catégorie
              </button>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  layout
                  className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
                        {(() => {
                          const Icon = (Icons as any)[category.icon] || LayoutGrid;
                          return <Icon className="w-6 h-6" />;
                        })()}
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full w-fit">
                        {category.type || 'hardware'}
                      </span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenCategoryModal(category)}
                        className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCategoryDelete(category.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{category.name}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 uppercase font-bold tracking-widest">Icon: {category.icon}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{category.description}</p>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingProduct ? 'Modifier le Produit' : 'Ajouter un Produit'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Package className="w-4 h-4" /> Nom du Produit
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white transition-all"
                      placeholder="ex: MacBook Pro M3"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Prix (FCFA)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white transition-all"
                      placeholder="ex: 1500000"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Catégorie
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white transition-all"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Image du Produit
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center overflow-hidden transition-colors cursor-pointer ${
                        isDragging 
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-900'
                      }`}
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      {formData.image ? (
                        <>
                          <img src={formData.image} alt="Aperçu" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                          <div className="relative z-10 flex flex-col items-center bg-white/80 dark:bg-gray-900/80 p-2 rounded-lg backdrop-blur-sm">
                            <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-1" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Changer l'image</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className={`w-8 h-8 mb-2 ${isDragging ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                          <span className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                            Glissez-déposez ou <span className="text-indigo-600 dark:text-indigo-400 font-bold">parcourez</span>
                          </span>
                        </>
                      )}
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileInput}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Étiquette (Badge)
                    </label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white transition-all"
                      placeholder="ex: Nouveau, Populaire, -20%"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white transition-all resize-none"
                      placeholder="Décrivez le produit..."
                    />
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {editingProduct ? 'Mettre à jour' : 'Créer le Produit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingCategory ? 'Modifier la Catégorie' : 'Ajouter une Catégorie'}
                </h3>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="p-8 overflow-y-auto max-h-[70vh]">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nom de la Catégorie</label>
                    <input
                      type="text"
                      required
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white transition-all"
                      placeholder="ex: Gaming"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Type de Catégorie</label>
                    <select
                      value={categoryFormData.type}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, type: e.target.value as any })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white transition-all"
                    >
                      <option value="hardware">Matériel (Hardware)</option>
                      <option value="software">Logiciel (Software)</option>
                      <option value="service">Service</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Icône</label>
                    <div className="grid grid-cols-6 gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                      {AVAILABLE_ICONS.map((iconName) => {
                        const Icon = (Icons as any)[iconName] || LayoutGrid;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setCategoryFormData({ ...categoryFormData, icon: iconName })}
                            className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                              categoryFormData.icon === iconName 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                            }`}
                            title={iconName}
                          >
                            <Icon className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Ordre d'affichage</label>
                    <input
                      type="number"
                      required
                      value={categoryFormData.order}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, order: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                      rows={3}
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white transition-all resize-none"
                      placeholder="Brève description..."
                    />
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {editingCategory ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
