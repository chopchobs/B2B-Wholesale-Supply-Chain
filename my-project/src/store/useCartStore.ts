import { create } from "zustand";

export type Tier = {
  id: string;
  minQuantity: number;
  unitPrice: number;
};

export type CartProduct = {
  id: string;
  sku: string;
  name: string;
  basePrice: number;
  moq: number;
  stock: number;
  priceTiers: Tier[];
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
  appliedTierUnitPrice: number;
  totalPrice: number;
};

interface CartState {
  items: CartItem[];
  addItem: (product: CartProduct, quantity: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

// Helper to calculate the correct unit price based on tiers
export function calculateUnitPrice(basePrice: number, quantity: number, tiers: Tier[]): number {
  if (!tiers || tiers.length === 0) return basePrice;
  
  // Sort tiers by minQuantity descending so we find the highest applicable tier first
  const sortedTiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  
  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) {
      return tier.unitPrice;
    }
  }
  
  return basePrice;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (product, quantity) => {
    // Validate MOQ
    if (quantity < product.moq) return;

    const currentItems = get().items;
    const existingItem = currentItems.find((item) => item.product.id === product.id);

    const unitPrice = calculateUnitPrice(product.basePrice, quantity, product.priceTiers);
    const totalPrice = unitPrice * quantity;

    if (existingItem) {
      // If it exists, update it (we overwrite quantity rather than add to avoid accidentally going over stock/budget, or we could add it. Let's overwrite as is standard for B2B "Update Quote" flows, or we can add them.)
      // For now, let's treat it as adding to the existing quantity.
      const newQuantity = existingItem.quantity + quantity;
      const newUnitPrice = calculateUnitPrice(product.basePrice, newQuantity, product.priceTiers);
      
      set({
        items: currentItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
                appliedTierUnitPrice: newUnitPrice,
                totalPrice: newUnitPrice * newQuantity,
              }
            : item
        ),
      });
    } else {
      set({
        items: [...currentItems, { product, quantity, appliedTierUnitPrice: unitPrice, totalPrice }],
      });
    }
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.product.id === productId) {
          // ensure quantity is at least MOQ
          const validQty = Math.max(quantity, item.product.moq);
          const newUnitPrice = calculateUnitPrice(item.product.basePrice, validQty, item.product.priceTiers);
          return {
            ...item,
            quantity: validQty,
            appliedTierUnitPrice: newUnitPrice,
            totalPrice: newUnitPrice * validQty,
          };
        }
        return item;
      }),
    }));
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },
}));
