import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowLeft, CreditCard, ShieldCheck, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

import { CartItem } from '../types';

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

interface OrderData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

const sendOrderEmail = async (orderData: OrderData, cartItems: CartItem[], total: number, method: string) => {
  const itemsList = cartItems.map(item => `${item.quantity}x ${item.name} (${(item.price * item.quantity).toLocaleString()} FCFA)`).join('\n');
  
  try {
    await fetch('https://formsubmit.co/ajax/thomwinner2007@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _cc: 'ephra888@gmail.com,alikizanjoyce@gmail.com',
        _subject: `Nouvelle commande de ${orderData.name} - ${total.toLocaleString()} FCFA`,
        _template: 'table',
        Client: orderData.name,
        Email: orderData.email,
        Téléphone: orderData.phone,
        Adresse: `${orderData.address}, ${orderData.city}`,
        Paiement: method,
        Total: `${total.toLocaleString()} FCFA`,
        Articles: itemsList
      })
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
  }
};

export const Checkout = () => {
  const { cart, cartTotal, clearCart } = useStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mobile' | 'card' | 'cod'>('mobile');

  useEffect(() => {
    // Check if we just returned from PayGate Global
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      const pendingOrder = sessionStorage.getItem('pendingOrder');
      if (pendingOrder) {
        try {
          const { formData: savedData, paymentMethod: savedMethod } = JSON.parse(pendingOrder);
          const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
          const savedTotal = savedCart.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);
          
          if (savedCart.length > 0) {
            sendOrderEmail(savedData, savedCart, savedTotal, savedMethod);
          }
          sessionStorage.removeItem('pendingOrder');
        } catch (e) {
          console.error("Error parsing pending order", e);
        }
      }

      setIsSuccess(true);
      clearCart();
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        navigate('/');
      }, 5000);
    }
  }, [clearCart, navigate]);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    address: '',
    city: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (paymentMethod === 'cod') {
      setIsProcessing(true);
      await sendOrderEmail(formData, cart, cartTotal, 'À la livraison');
      // Simulate processing delay for cash on delivery
      setTimeout(() => {
        setIsSuccess(true);
        clearCart();
        setTimeout(() => {
          navigate('/');
        }, 5000);
      }, 1500);
      return;
    }

    if (paymentMethod === 'card') {
      const flutterwaveKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;

      if (!flutterwaveKey) {
        setPaymentError("La clé publique Flutterwave n'est pas configurée. Veuillez contacter l'administrateur.");
        return;
      }

      if (!window.FlutterwaveCheckout) {
        setPaymentError("Le service de paiement Flutterwave n'est pas chargé. Veuillez rafraîchir la page.");
        return;
      }

      setIsProcessing(true);

      try {
        window.FlutterwaveCheckout({
          public_key: flutterwaveKey,
          tx_ref: `TOGOTECH-CARD-${Date.now()}`,
          amount: cartTotal,
          currency: "XOF",
          payment_options: "card",
          customer: {
            email: formData.email,
            phone_number: formData.phone.replace(/\s/g, ''),
            name: formData.name,
          },
          customizations: {
            title: "TogoTech Hub",
            description: `Paiement par carte - ${cart.length} articles`,
            logo: "https://ais-dev-lhwys4xrehzmxlrgdapfcn-128161317689.europe-west3.run.app/logo.png",
          },
          callback: async (data: any) => {
            console.log("Flutterwave Response:", data);
            if (data.status === "successful") {
              await sendOrderEmail(formData, cart, cartTotal, 'Carte Bancaire');
              setIsSuccess(true);
              clearCart();
              setTimeout(() => {
                navigate('/');
              }, 5000);
            } else {
              setPaymentError("Le paiement n'a pas pu être finalisé. Statut: " + data.status);
              setIsProcessing(false);
            }
          },
          onclose: () => {
            setIsProcessing(false);
          }
        });
      } catch (error) {
        console.error("Flutterwave Error:", error);
        setPaymentError("Une erreur est survenue lors de l'initialisation du paiement par carte.");
        setIsProcessing(false);
      }
    } else {
      // Mobile Money via PayGate Togo
      const token = import.meta.env.VITE_PAYGATE_TOKEN;

      if (!token) {
        setPaymentError("Le token PayGate Togo n'est pas configuré. Veuillez contacter l'administrateur.");
        return;
      }

      setIsProcessing(true);

      try {
        const identifier = `TOGOTECH-MOB-${Date.now()}`;
        const description = `Commande de ${cart.length} articles`;
        const returnUrl = `${window.location.origin}/checkout?payment=success`;

        // Construct PayGate Global payment URL
        const paygateUrl = `https://paygateglobal.com/v1/page?token=${token}&amount=${cartTotal}&description=${encodeURIComponent(description)}&identifier=${identifier}&url=${encodeURIComponent(returnUrl)}`;

        // Save order details for email notification upon return
        sessionStorage.setItem('pendingOrder', JSON.stringify({ formData, paymentMethod: 'Mobile Money (T-Money/Flooz)' }));

        // Redirect to PayGate Global
        window.location.href = paygateUrl;
      } catch (error) {
        console.error("PayGate Error:", error);
        setPaymentError("Une erreur est survenue lors de l'initialisation du paiement mobile.");
        setIsProcessing(false);
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Paiement Réussi !</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Merci pour votre achat. Un email de confirmation a été envoyé à {formData.email}.
            Vous allez être redirigé vers l'accueil dans quelques secondes.
          </p>
          <Link 
            to="/" 
            className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold">
            <ArrowLeft className="w-5 h-5" />
            Retour à la boutique
          </Link>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Finaliser la commande</h1>
          <div className="w-24" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className="space-y-8">
            <section className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Informations de livraison</h2>
              </div>
              
              <form id="checkout-form" onSubmit={handlePayment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Nom Complet</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                      placeholder="jean@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Adresse</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                    placeholder="Quartier Agoè, Rue 123"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Ville</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                      placeholder="Lomé"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Téléphone</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                      placeholder="+228 90 00 00 00"
                    />
                  </div>
                </div>
              </form>
            </section>

            <section className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Méthode de Paiement</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div 
                  onClick={() => setPaymentMethod('mobile')}
                  className={`p-4 rounded-2xl flex flex-col items-center text-center gap-2 cursor-pointer transition-all ${paymentMethod === 'mobile' ? 'border-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
                >
                  <div className="w-12 h-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded flex items-center justify-center font-bold text-[10px] text-gray-400">MOBILE</div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">T-Money / Flooz</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Paiement Mobile</p>
                  </div>
                </div>
                <div 
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl flex flex-col items-center text-center gap-2 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
                >
                  <div className="w-12 h-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded flex items-center justify-center font-bold text-[10px] text-gray-400">CARD</div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">Carte Bancaire</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Visa, Mastercard</p>
                  </div>
                </div>
                <div 
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-2xl flex flex-col items-center text-center gap-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
                >
                  <div className="w-12 h-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded flex items-center justify-center font-bold text-[10px] text-gray-400">CASH</div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">À la livraison</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Payer en espèces</p>
                  </div>
                </div>
              </div>
              
              {paymentError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{paymentError}</p>
                </motion.div>
              )}
            </section>
          </div>

          {/* Summary */}
          <div className="space-y-8">
            <div className="bg-gray-900 dark:bg-gray-800 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 dark:shadow-none sticky top-32 border border-gray-800 dark:border-gray-700">
              <h2 className="text-2xl font-black mb-8">Résumé de la commande</h2>
              
              <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/10 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-indigo-300">Qté: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-sm">{(item.price * item.quantity).toLocaleString()} FCFA</p>
                  </div>
                ))}
                {cart.length === 0 && (
                  <p className="text-indigo-300 text-center py-4 italic">Votre panier est vide</p>
                )}
              </div>

              <div className="border-t border-white/10 pt-6 space-y-3 mb-8">
                <div className="flex justify-between text-indigo-200">
                  <span>Sous-total</span>
                  <span>{cartTotal.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-indigo-200">
                  <span>Livraison</span>
                  <span>Gratuit</span>
                </div>
                <div className="flex justify-between text-xl font-black pt-3 border-t border-white/10">
                  <span>Total</span>
                  <span className="text-indigo-400">{cartTotal.toLocaleString()} FCFA</span>
                </div>
              </div>

              <button
                form="checkout-form"
                type="submit"
                disabled={isProcessing || cart.length === 0}
                className="w-full bg-white text-indigo-600 py-5 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-6 h-6" />
                    {paymentMethod === 'cod' ? 'Confirmer la commande' : 'Payer en toute sécurité'}
                  </>
                )}
              </button>
              
              <p className="text-center text-[10px] text-indigo-300 mt-6 uppercase tracking-widest font-bold">
                Paiement sécurisé par cryptage SSL
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
