import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useCatalog } from './CatalogContext';
import { readJSON, writeJSON } from '../utils/storage';

const CartContext = createContext(null);

const cartKey = (email) => `hmf_cart_${email}`;

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  // items: [{ id, name, price, icon, category, quantity }]
  const [stored, setItems] = useState([]);
  const { foods, status } = useCatalog();

  // Keep the cart in step with the live menu: current prices (incorporating active food offers),
  // and dishes the admin has removed drop out.
  const items = useMemo(() => {
    if (status !== 'ready') return stored;
    return stored
      .map((it) => {
        const f = foods.find((x) => x.id === it.id);
        if (!f) return null;
        const price = f.offer ? f.offer.discountedPrice : f.price;
        return {
          ...it,
          name: f.name,
          price,
          originalPrice: f.price,
          offer: f.offer || null,
          chefId: f.chefId,
          category: f.category,
          photo: f.photo || null
        };
      })
      .filter(Boolean);
  }, [stored, foods, status]);

  // Load the right cart as soon as we know who is signed in. Done during render
  // (not in an effect) so pages like /checkout see the saved cart on first paint
  // instead of an empty one and bouncing back to /cart on refresh.
  const userEmail = user?.email || null;
  const [loadedFor, setLoadedFor] = useState(null);
  if (userEmail !== loadedFor) {
    setLoadedFor(userEmail);
    setItems(userEmail ? readJSON(cartKey(userEmail), []) : []);
  }

  // Persist on every change (only when a user is signed in).
  useEffect(() => {
    if (userEmail && userEmail === loadedFor) {
      writeJSON(cartKey(userEmail), stored);
    }
  }, [stored, userEmail, loadedFor]);

  const addItem = useCallback((food, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.id === food.id);
      if (existing) {
        return prev.map((it) =>
          it.id === food.id ? { ...it, quantity: it.quantity + quantity } : it
        );
      }
      return [
        ...prev,
        {
          id: food.id,
          name: food.name,
          price: food.price,
          icon: food.icon,
          category: food.category,
          chefId: food.chefId,
          quantity
        }
      ];
    });
  }, []);

  const removeItem = useCallback((foodId) => {
    setItems((prev) => prev.filter((it) => it.id !== foodId));
  }, []);

  const updateQuantity = useCallback((foodId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((it) => it.id !== foodId));
      return;
    }
    setItems((prev) =>
      prev.map((it) => (it.id === foodId ? { ...it, quantity } : it))
    );
  }, []);

  const increment = useCallback((foodId) => {
    setItems((prev) =>
      prev.map((it) => (it.id === foodId ? { ...it, quantity: it.quantity + 1 } : it))
    );
  }, []);

  const decrement = useCallback((foodId) => {
    setItems((prev) =>
      prev
        .map((it) => (it.id === foodId ? { ...it, quantity: it.quantity - 1 } : it))
        .filter((it) => it.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getQuantity = useCallback(
    (foodId) => items.find((it) => it.id === foodId)?.quantity || 0,
    [items]
  );

  // Only the food total is known in the cart. Delivery fee (cash on delivery only)
  // and tax are worked out at payment, once the payment method is chosen.
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const originalSubtotal = items.reduce((sum, it) => sum + (it.originalPrice || it.price) * it.quantity, 0);
    const offerSavings = originalSubtotal - subtotal;
    const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
    return { subtotal, originalSubtotal, offerSavings, itemCount };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        ...totals,
        addItem,
        removeItem,
        updateQuantity,
        increment,
        decrement,
        clearCart,
        getQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export default CartContext;
