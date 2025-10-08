import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const ClientContext = createContext();
const API_URL = "https://phonebooking.vercel.app/api";

const axiosInstance = axios.create({ baseURL: API_URL });

export const useClientData = () => useContext(ClientContext);

export const ClientDataProvider = ({ children }) => {
  // --- STATE ---
  const [preciousItems, setPreciousItems] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [settings, setSettings] = useState({
    id: null,
    headerTitle: "",
    companyLogo: "",
    deliveryImage: "",
    banners: [],
  });
  const [netpaySalesCount, setNetpaySalesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- MAPPERS ---
  const mapProductFromDb = (p) => ({
    id: p.id,
    category: p.category,
    model: p.model,
    price: p.price,
    bookingAmount: p.bookingAmount,
    netpayPrice: p.netpayPrice,
    offer: p.offer,
    offerTime: p.offerTime,
    fullSpecs: p.fullSpecs,
    image: p.image,
    netpayQrCode: p.netpayQrCode,
    createdAt: p.createdAt,
  });

  const fetchPublicData = useCallback(async () => {
    setLoading(true);
    try {
      const [preciousRes, otherRes, settingsRes, countRes] = await Promise.all([
        axiosInstance.get("/products/precious"),
        axiosInstance.get("/products/other"),
        axiosInstance.get("/settings"),
        axiosInstance.get("/count"), // Create public count API if needed
      ]);

      setPreciousItems((preciousRes.data || []).map(mapProductFromDb));
      setOtherItems((otherRes.data || []).map(mapProductFromDb));
      setSettings(settingsRes.data || {
        id: null,
        headerTitle: "",
        companyLogo: "",
        deliveryImage: "",
        banners: [],
      });
      setNetpaySalesCount(countRes.data?.total_sales_count || 0);
      setError(null);
    } catch (err) {
      console.error("Public data fetch error:", err);
      setError("Failed to load public data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicData();
  }, [fetchPublicData]);

  const contextValue = {
    preciousItems,
    otherItems,
    settings,
    netpaySalesCount,
    loading,
    error,
    fetchPublicData,
  };

  return <ClientContext.Provider value={contextValue}>{children}</ClientContext.Provider>;
};
