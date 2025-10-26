// src/Context/CartContext.jsx
import React, { createContext, useContext, useState } from "react";

export const CartContext = createContext(); // ✅ Added export
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (itemToAdd) => {
    setCartItems((prevCart) => {
      const existingItem = prevCart.find(
        (item) =>
          item.name === itemToAdd.name && item.mess_id === itemToAdd.mess_id
      );

      if (existingItem) {
        return prevCart.map((item) =>
          item.name === itemToAdd.name && item.mess_id === itemToAdd.mess_id
            ? { ...item, quantity: item.quantity + itemToAdd.quantity }
            : item
        );
      } else {
        return [...prevCart, { ...itemToAdd }];
      }
    });
  };

  const removeFromCart = (itemToRemove) => {
    setCartItems((prevCart) =>
      prevCart.filter(
        (item) =>
          !(
            item.name === itemToRemove.name &&
            item.mess_id === itemToRemove.mess_id
          )
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const calculateTotal = () =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const getItemCount = () => cartItems.length;
  const getTotalQuantity = () =>
    cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        calculateTotal,
        getItemCount,
        getTotalQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
