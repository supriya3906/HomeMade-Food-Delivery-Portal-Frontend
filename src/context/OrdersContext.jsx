import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';

const OrdersContext = createContext(null);

export const ORDER_STAGES = ['Order placed', 'Being prepared', 'Out for delivery', 'Delivered'];

export const OrdersProvider = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Keyed on the user id so a profile edit doesn't trigger a reload.
  const userId = user?.id || null;

  useEffect(() => {
    let cancelled = false;
    setOrders([]);
    setLoadError('');
    if (!userId) {
      setLoaded(false);
      return undefined;
    }
    setLoaded(false);
    api('/orders')
      .then((data) => !cancelled && setOrders(data))
      .catch((err) => !cancelled && setLoadError(err.message))
      .finally(() => !cancelled && setLoaded(true));
    return () => { cancelled = true; };
  }, [userId]);

  const replace = (order) => setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));

  // Cash on delivery only — the server prices the order itself. UPI / card
  // orders are created by the payment flow, which hands the finished order to addOrder.
  const placeOrder = useCallback(async ({ items, address, paymentMethod, couponCode }) => {
    const order = await api('/orders', {
      method: 'POST',
      body: { items: items.map(({ id, quantity }) => ({ id, quantity })), address, paymentMethod, couponCode }
    });
    setOrders((prev) => [order, ...prev]);
    return order;
  }, []);

  const addOrder = useCallback((order) => {
    setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
  }, []);

  // Re-reads one order from the server (tracking moves on its own over time).
  const refreshOrder = useCallback(async (orderId) => {
    const order = await api(`/orders/${orderId}`);
    setOrders((prev) => (prev.some((o) => o.id === order.id) ? prev.map((o) => (o.id === order.id ? order : o)) : [order, ...prev]));
    return order;
  }, []);

  // One review per delivered order. The server stores it and returns the updated order.
  const submitReview = useCallback(async (orderId, { rating, deliveryRating, comment }) => {
    const order = await api(`/orders/${orderId}/review`, { method: 'POST', body: { rating, deliveryRating, comment } });
    replace(order);
    return order;
  }, []);

  const getOrder = useCallback((orderId) => orders.find((o) => o.id === orderId), [orders]);

  // Cancelling keeps the order in history, marked as cancelled.
  const cancelOrder = useCallback(async (orderId) => {
    replace(await api(`/orders/${orderId}`, { method: 'DELETE' }));
  }, []);

  // Removes a single order from your visible history for good (any status).
  const removeOrder = useCallback(async (orderId) => {
    await api(`/orders/${orderId}/remove`, { method: 'DELETE' });
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  const clearOrders = useCallback(async () => {
    await api('/orders', { method: 'DELETE' });
    setOrders([]);
  }, []);

  return (
    <OrdersContext.Provider
      value={{ orders, loaded, loadError, placeOrder, addOrder, refreshOrder, getOrder, cancelOrder, removeOrder, clearOrders, submitReview }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
};

export default OrdersContext;
