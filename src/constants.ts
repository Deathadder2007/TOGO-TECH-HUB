import { Product, Category } from './types';

export const CATEGORIES: Category[] = [
  {
    id: 'laptops',
    name: 'Ordinateurs Portables',
    icon: 'Laptop',
    description: 'PC Gamer, Bureautique et Professionnels',
    type: 'hardware'
  },
  {
    id: 'accessories',
    name: 'Accessoires',
    icon: 'Mouse',
    description: 'Souris, Claviers, Casques et plus',
    type: 'hardware'
  },
  {
    id: 'networking',
    name: 'Réseaux',
    icon: 'Wifi',
    description: 'Routeurs, Switchs et Solutions WiFi',
    type: 'hardware'
  },
  {
    id: 'storage',
    name: 'Stockage',
    icon: 'HardDrive',
    description: 'Disques durs, SSD et Clés USB',
    type: 'hardware'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'MacBook Pro M3',
    description: 'Le plus puissant des MacBook pour les professionnels.',
    price: 1250000,
    category: 'laptops',
    image: 'https://picsum.photos/seed/macbook/600/400',
    badge: 'Populaire'
  },
  {
    id: '2',
    name: 'Dell XPS 15',
    description: 'Écran InfinityEdge 4K, performance exceptionnelle.',
    price: 950000,
    category: 'laptops',
    image: 'https://picsum.photos/seed/dellxps/600/400',
    badge: 'Populaire'
  },
  {
    id: '3',
    name: 'Logitech MX Master 3S',
    description: 'La souris de précision ultime pour les créateurs.',
    price: 65000,
    category: 'accessories',
    image: 'https://picsum.photos/seed/mouse/600/400',
    badge: 'Populaire'
  },
  {
    id: '4',
    name: 'Routeur TP-Link Archer AX55',
    description: 'WiFi 6 ultra-rapide pour toute la maison.',
    price: 85000,
    category: 'networking',
    image: 'https://picsum.photos/seed/router/600/400'
  },
  {
    id: '5',
    name: 'SSD Samsung 990 Pro 2TB',
    description: 'Vitesse de lecture séquentielle jusqu\'à 7450 Mo/s.',
    price: 120000,
    category: 'storage',
    image: 'https://picsum.photos/seed/ssd/600/400'
  },
  {
    id: '6',
    name: 'HP Victus 16',
    description: 'PC Portable Gamer avec RTX 4060.',
    price: 750000,
    category: 'laptops',
    image: 'https://picsum.photos/seed/hpvictus/600/400',
    badge: 'Populaire'
  }
];
