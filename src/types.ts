export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  badge?: string;
  createdAt?: any;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  order?: number;
  type?: 'hardware' | 'software' | 'service' | 'other';
}

export interface CartItem extends Product {
  quantity: number;
}
