import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from "react-hot-toast";


const AdminContext = createContext();
const API_URL = 'https://phonebooking.vercel.app/api';

// --- Axios Instance ---
const axiosInstance = axios.create({ baseURL: API_URL });
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

export const useAdminData = () => useContext(AdminContext);

// ------------------ AdminDataProvider ------------------
export const AdminDataProvider = ({ children }) => {
    const auth = useAuth();
    if (!auth) throw new Error("AdminDataProvider must be wrapped inside AuthProvider.");

    const { isAuthenticated, user, logout } = auth;

    // --- STATE ---
    const [preciousItems, setPreciousItems] = useState([]);
    const [otherItems, setOtherItems] = useState([]);
    const [netpaySales, setNetpaySales] = useState([]);
    const [latestUserMessage, setLatestUserMessage] = useState({ content: 'Loading...', userId: null });
    const [adminReplyContent, setAdminReplyContent] = useState('');
    const [settings, setSettings] = useState({
        id: null,
        headerTitle: '',
        companyLogo: '',
        deliveryImage: '',
        banners: [],
        advertisementVideoUrl: '',
        advertisementVideoFile: null,
        companyLogoFile: null,
        deliveryImageFile: null
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ------------------ Mappers ------------------
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
        imageFile: null,
        netpayQrCodeFile: null,
        createdAt: p.createdAt
    });

    const mapOrderFromDb = (order) => ({
        id: order.id,
        model: order.product?.model,
        userName: order.user_name,
        amount: order.amount,
        screenshot: order.screenshot_url,
        deliveryStatus: order.delivery_status,
        deliveryDate: order.delivery_date,
        createdAt: order.created_at,
        address: order.address || '',
        mobile: order.mobile || '',
    });

    const mapSettingsFromDb = (s) => ({
        id: s.id || null,
        headerTitle: s.header_title || '',
        companyLogo: s.company_logo_url || '',
        deliveryImage: s.delivery_image_url || '',
        banners: (s.banners || []).map(url => ({ path: url, newFile: null })),
        advertisementVideoUrl: s.advertisement_video_url || '',
        advertisementVideoFile: null,
        companyLogoFile: null,
        deliveryImageFile: null
    });



    // ------------------ PUBLIC DATA ------------------
    const fetchPublicData = useCallback(async () => {
        try {
            setLoading(true);

            const [preciousRes, otherRes, salesRes, settingsRes, messagesRes,] = await Promise.all([
                axiosInstance.get('/products/precious'),
                axiosInstance.get('/products/other'),
                axiosInstance.get('/admin/orders'),
                axiosInstance.get('/settings'),
                axiosInstance.get('/admin/messages/latest-per-user'),
            ]);

            setPreciousItems((preciousRes.data || []).map(mapProductFromDb));
            setOtherItems((otherRes.data || []).map(mapProductFromDb));
            setNetpaySales((salesRes.data || []).map(mapOrderFromDb));

            const fetchedSettings = mapSettingsFromDb(settingsRes.data || {});
            setSettings(fetchedSettings);

            // Corrected latest message mapping
            const latestMessagesArray = messagesRes.data?.latestMessages || [];
            if (latestMessagesArray.length > 0) {
                const latestMessage = latestMessagesArray.reduce((prev, current) =>
                    new Date(prev.created_at) > new Date(current.created_at) ? prev : current
                );
                setLatestUserMessage({
                    content: latestMessage?.content || 'No messages from users.',
                    userId: latestMessage?.user_id || null
                });
            } else {
                setLatestUserMessage({ content: 'No messages found.', userId: null });
            }

            setError(null);
        } catch (err) {
            console.error("Public data fetch error:", err);
            setError("Failed to load public data");
        } finally {
            setLoading(false);
        }
    }, []);

    // Public Fetch 
    useEffect(() => {
        fetchPublicData();
    }, []);

    // ------------------ ADMIN DATA ------------------
    const fetchAdminData = useCallback(async () => {
        if (!isAuthenticated || !user?.is_admin) {
            await fetchPublicData();
            return;
        }
        setLoading(true);
        try {
            const [preciousRes, otherRes, salesRes, messagesRes, settingsRes] = await Promise.all([
                axiosInstance.get('/products/precious'),
                axiosInstance.get('/products/other'),
                axiosInstance.get('/admin/orders'),
                axiosInstance.get('/admin/messages/latest-per-user'),
                axiosInstance.get('/settings'),
            ]);

            setPreciousItems((preciousRes.data || []).map(mapProductFromDb));
            setOtherItems((otherRes.data || []).map(mapProductFromDb));
            setNetpaySales((salesRes.data || []).map(mapOrderFromDb));

            const fetchedSettings = mapSettingsFromDb(settingsRes.data || {});
            setSettings(fetchedSettings);

            const latestMessagesArray = messagesRes.data?.latestMessages || [];
            if (latestMessagesArray.length > 0) {
                const latestMessage = latestMessagesArray.reduce((prev, current) =>
                    new Date(prev.created_at) > new Date(current.created_at) ? prev : current
                );
                setLatestUserMessage({
                    content: latestMessage?.content || 'No messages from users.',
                    userId: latestMessage?.user_id || null
                });
            } else {
                setLatestUserMessage({ content: 'No messages found.', userId: null });
            }

            setError(null);
        } catch (err) {
            console.error('Admin fetch error:', err);
            if (err.response?.status === 401) logout();
            else setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user, logout, fetchPublicData]);


    const handleAdVideoFileChange = (file) => {
        setSettings(prev => ({
            ...prev,
            advertisementVideoFile: file
        }));
    };



    // ------------------ INIT ------------------
    useEffect(() => {
        if (isAuthenticated && user?.is_admin) fetchAdminData();
        else fetchPublicData();
    }, [isAuthenticated, user, fetchAdminData, fetchPublicData]);

    // ------------------ PRODUCT HANDLERS ------------------
    const handleProductChange = (index, field, value, category) => {
        const setter = category === 'precious' ? setPreciousItems : setOtherItems;
        setter(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const addMoreProduct = (category) => {
        const newItem = {
            id: null,
            model: '',
            price: 0,
            bookingAmount: 0,
            netpayPrice: 0,
            offer: 0,
            offerTime: '',
            fullSpecs: '',
            category,
            image: '',
            netpayQrCode: '',
            imageFile: null,
            netpayQrCodeFile: null
        };
        category === 'precious' ? setPreciousItems(prev => [...prev, newItem]) : setOtherItems(prev => [...prev, newItem]);
    };

    const deleteProduct = async (id, index, category) => {
        const setter = category === 'precious' ? setPreciousItems : setOtherItems;
        setLoading(true);
        try {
            if (id) {
                await axiosInstance.delete(`/products/admin/${id}`);
                await fetchAdminData();
            } else {
                setter(prev => prev.filter((_, i) => i !== index));
            }
        } catch (err) {
            console.error('Delete product error:', err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    // ------------------ SETTINGS HANDLERS ------------------
    const handleSettingsChange = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));

    const handleBannerFileChange = (index, file) => setSettings(prev => {
        const newBanners = [...prev.banners];
        if (!newBanners[index]) newBanners.push({ path: '', newFile: null });
        newBanners[index] = { path: file ? '' : newBanners[index].path, newFile: file };
        return { ...prev, banners: newBanners };
    });

    const addBannerInput = () => {
        if (settings.banners.length < 20)  // Increased limit to 20
            setSettings(prev => ({ ...prev, banners: [...prev.banners, { path: '', newFile: null }] }));
    };

    const deleteBanner = (index) =>
        setSettings(prev => ({ ...prev, banners: prev.banners.filter((_, i) => i !== index) }));

    // ------------------ ADMIN ACTIONS ------------------
    const confirmNetpayDelivery = async (orderId) => {
        setLoading(true);
        try {
            await axiosInstance.put(`/admin/orders/${orderId}/confirm`);
            await fetchAdminData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const sendSmsToUser = async () => {
        const targetUserId = latestUserMessage.userId;
        if (!adminReplyContent.trim()) return console.error('Reply empty.');
        if (!targetUserId) return console.error('No user message to reply to.');
        setLoading(true);
        try {
            await axiosInstance.post(`/admin/messages/reply/${targetUserId}`, { content: adminReplyContent });
            setAdminReplyContent('');
            await fetchAdminData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    // ------------------ SAVE ALL CHANGES ------------------
    const saveAllChanges = async () => {
        setLoading(true);
        try {
            // SETTINGS
            const settingsFormData = new FormData();
            settingsFormData.append('id', settings.id || '');
            settingsFormData.append('header_title', settings.headerTitle || '');
            if (settings.companyLogoFile) settingsFormData.append('companyLogoFile', settings.companyLogoFile);
            if (settings.deliveryImageFile) settingsFormData.append('deliveryImageFile', settings.deliveryImageFile);
            if (settings.advertisementVideoFile) { settingsFormData.append('advertisementVideoFile', settings.advertisementVideoFile); }

            const bannerPaths = [];
            for (const banner of settings.banners || []) {
                if (banner.newFile) settingsFormData.append('bannerFiles', banner.newFile);
                else if (banner.path) bannerPaths.push(banner.path);
            }
            settingsFormData.append('banners', JSON.stringify(bannerPaths));

            await axiosInstance.post('/admin/settings', settingsFormData, { headers: { 'Content-Type': 'multipart/form-data' } });

            // PRODUCTS
            const allItems = [...preciousItems, ...otherItems];
            const toNumberOrNull = (val) => {
                if (val === '' || val === null || val === undefined) return null;
                const n = parseFloat(val);
                return isNaN(n) ? null : n;
            };

            for (const item of allItems) {
                if (!item.model || !item.category) continue;
                const formData = new FormData();
                if (item.id) formData.append('id', item.id);
                formData.append('model', item.model);
                formData.append('category', item.category);
                formData.append('price', toNumberOrNull(item.price));
                formData.append('bookingAmount', toNumberOrNull(item.bookingAmount));
                formData.append('netpayPrice', toNumberOrNull(item.netpayPrice));
                formData.append('offer', toNumberOrNull(item.offer));
                formData.append('offerTime', item.offerTime || '');
                formData.append('fullSpecs', item.fullSpecs || '');
                if (item.imageFile) formData.append('imageFile', item.imageFile);
                if (item.netpayQrCodeFile) formData.append('netpayQrCodeFile', item.netpayQrCodeFile);
                await axiosInstance.post('/products/admin', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }

            await fetchAdminData();
            toast.success("All changes saved successfully");
        } catch (err) {
            console.error('Save all error:', err);
            setError(err.response?.data?.details || err.message);
            toast.error(err.response?.data?.details || err.message);
        } finally {
            setLoading(false);
        }
    };

    // ------------------ CONTEXT VALUE ------------------
    const contextValue = {
        preciousItems,
        otherItems,
        netpaySales,
        latestUserMessage,
        adminReplyContent,
        settings,
        loading,
        error,
        setAdminReplyContent,
        handleProductChange,
        addMoreProduct,
        deleteProduct,
        handleSettingsChange,
        handleBannerFileChange,
        addBannerInput,
        deleteBanner,
        confirmNetpayDelivery,
        sendSmsToUser,
        saveAllChanges,
        fetchAdminData,
        fetchPublicData,
        handleAdVideoFileChange,

    };

    return <AdminContext.Provider value={contextValue}>{children}</AdminContext.Provider>;
};
