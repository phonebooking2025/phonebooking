import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const ClientContext = createContext();
const API_URL = "https://phonebooking.vercel.app/api";

// axios instance for public + user requests
const axiosInstance = axios.create({ baseURL: API_URL });

// Token helper uses same key as the app's components
const STORAGE_USER_KEY = "user_logged_in_status";
const getUserToken = () => {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch (e) {
    return null;
  }
};

// Attach user token (if any) to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getUserToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

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
  // Keep compatibility with existing AdminContext usage in UI
  const [netpaySalesCount, setNetpaySalesCount] = useState(0);
  // Provide netpaySales array and setter for UI mapping (keeps Client.jsx working)
  const [netpaySales, setNetpaySales] = useState([]);
  const [adminReplyContent, setAdminReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track if we've already fetched to prevent infinite loops
  const hasInitialFetched = useRef(false);

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
    productVideo: p.productVideo || null,
    buyOneGetOne: p.buyOneGetOne || 'No',
    offerEndDateTime: p.offerEndDateTime || null,
    emiMonths: p.emiMonths || '',
    downPaymentAmount: p.downPaymentAmount || 0,
    createdAt: p.createdAt,
  });

  const mapSettingsFromDb = (s) => ({
    id: s.id || null,
    headerTitle: s.header_title || '',
    whatsappNumber: s.whatsapp_number || '',
    headerBgColor: s.header_bg_color || '#1D4ED8',
    headerBgImage: s.header_background_image_url || '',
    // Convert opacity from decimal (0-1) to percentage (0-100) for Client component
    headerImageOpacity: typeof s.header_image_opacity !== 'undefined' && s.header_image_opacity !== null
      ? Math.round(Number(s.header_image_opacity) * 100)
      : 100,
    companyLogo: s.company_logo_url || '',
    deliveryImage: s.delivery_image_url || '',
    banners: (s.banners || []).map(url => ({ path: url, newFile: null })),
    advertisementVideoUrl: s.advertisement_video_url || '',
    advertisementVideoFile: null,
    companyLogoFile: null,
    deliveryImageFile: null
  });

  const fetchPublicData = useCallback(async () => {
    setLoading(true);
    try {
      const [preciousRes, otherRes, settingsRes, ordersRes, countRes] = await Promise.all([
        axiosInstance.get("/products/precious"),
        axiosInstance.get("/products/other"),
        axiosInstance.get("/settings"),
        // public orders for client display
        axiosInstance.get("/public/orders"),
        axiosInstance.get("/count"), // Create public count API if needed
      ]);

      setPreciousItems((preciousRes.data || []).map(mapProductFromDb));
      setOtherItems((otherRes.data || []).map(mapProductFromDb));

      const fetchedSettings = mapSettingsFromDb(settingsRes.data || {});
      setSettings(fetchedSettings);
      try { localStorage.setItem('website_settings', JSON.stringify(fetchedSettings)); } catch (e) { }
      setNetpaySalesCount(countRes.data?.total_sales_count || 0);
      setNetpaySales((ordersRes.data || []).map(o => ({
        id: o.id,
        model: o.product?.model,
        userName: o.user_name,
        amount: o.amount,
        screenshot: o.screenshot_url,
        deliveryStatus: o.delivery_status,
        deliveryDate: o.delivery_date,
        createdAt: o.created_at,
        address: o.address || '',
        mobile: o.mobile || '',
      })));
      setError(null);
    } catch (err) {
      console.error("Public data fetch error:", err);
      setError("Failed to load public data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data only once on component mount
  useEffect(() => {
    if (!hasInitialFetched.current) {
      hasInitialFetched.current = true;
      fetchPublicData();
    }
  }, []);

  const contextValue = {
    preciousItems,
    otherItems,
    settings,
    netpaySalesCount,
    netpaySales,
    setNetpaySales,
    adminReplyContent,
    setAdminReplyContent,
    loading,
    error,
    fetchPublicData,
    // Client-side actions
    sendMessage: async (content) => {
      try {
        const res = await axiosInstance.post('/messages/send', { content });
        return res.data;
      } catch (err) {
        throw err;
      }
    },
    fetchUserMessages: async () => {
      try {
        const res = await axiosInstance.get('/messages/user');
        // server returns { messages: [...], latestAdminMessage }
        const latest = res.data?.latestAdminMessage || null;
        setAdminReplyContent(latest?.content || '');
        return res.data;
      } catch (err) {
        throw err;
      }
    },
    placeOrder: async (formData) => {
      try {
        const res = await axiosInstance.post('/orders/place', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data;
      } catch (err) {
        throw err;
      }
    },
    placeNetpayOrder: async (payload) => {
      try {
        const res = await axiosInstance.post('/orders/netpay', payload);
        return res.data;
      } catch (err) {
        throw err;
      }
    },
    placeEmiOrder: async (formData) => {
      try {
        const res = await axiosInstance.post('/orders/emi', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data;
      } catch (err) {
        throw err;
      }
    },
    getUserSalesCount: async () => {
      try {
        const res = await axiosInstance.get('/user/sales/count');
        return res.data;
      } catch (err) {
        throw err;
      }
    },
  };

  return <ClientContext.Provider value={contextValue}>{children}</ClientContext.Provider>;
};
