// ✅ src/Context/CartContext.jsx — FINAL PRODUCTION VERSION
import React, { createContext, useContext, useState } from "react";

export const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  /* ============================================================
     🛒 addToCart — Strictly validates mess_id & mess_name
     ============================================================ */
  const addToCart = (itemToAdd) => {
    if (!itemToAdd) {
      console.error("🚫 addToCart called with empty item!");
      return;
    }

    // ✅ Extract correct mess info
    const realMessId =
      itemToAdd?.mess_id &&
      itemToAdd?.mess_id !== "N/A" &&
      itemToAdd?.mess_id !== "unknown"
        ? itemToAdd.mess_id
        : itemToAdd?.mess?._id?.toString();

    const realMessName =
      itemToAdd?.mess_name &&
      itemToAdd?.mess_name !== "Unknown Mess" &&
      itemToAdd?.mess_name !== "unknown"
        ? itemToAdd.mess_name
        : itemToAdd?.mess?.name;

    // ❌ Block invalid mess entries
    if (!realMessId || !realMessName) {
      console.error(
        "🚫 addToCart blocked: Invalid mess info detected:",
        itemToAdd
      );
      return;
    }

    // ✅ Normalize item
    const normalizedItem = {
      ...itemToAdd,
      mess_id: realMessId,
      mess_name: realMessName,
      image: itemToAdd.image || "default.png",
      quantity: itemToAdd.quantity || 1,
    };

    console.log("✅ Item added to cart:", normalizedItem);

    // ✅ Merge items from same mess
    setCartItems((prevCart) => {
      const existingItem = prevCart.find(
        (item) =>
          item.name === normalizedItem.name &&
          item.mess_id === normalizedItem.mess_id
      );

      if (existingItem) {
        return prevCart.map((item) =>
          item.name === normalizedItem.name &&
          item.mess_id === normalizedItem.mess_id
            ? { ...item, quantity: item.quantity + normalizedItem.quantity }
            : item
        );
      } else {
        return [...prevCart, normalizedItem];
      }
    });
  };

  /* ============================================================
     ❌ removeFromCart — removes a specific item
     ============================================================ */
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

  /* ============================================================
     🧹 clearCart — empties the cart
     ============================================================ */
  const clearCart = () => {
    console.log("🧹 Cart cleared");
    setCartItems([]);
  };

  /* ============================================================
     💰 calculateTotal — safely computes total
     ============================================================ */
  const calculateTotal = () =>
    cartItems.reduce(
      (total, item) => total + (item.price || 0) * (item.quantity || 1),
      0
    );

  /* ============================================================
     📦 Helper Functions
     ============================================================ */
  const getItemCount = () => cartItems.length;

  const getTotalQuantity = () =>
    cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  /* ============================================================
     ✅ Context Provider
     ============================================================ */
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
