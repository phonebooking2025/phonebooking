import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useClientData } from '../context/ClientContext';
import "./Client.css";
import { Toaster, toast } from 'react-hot-toast';
import Loading from './Loading';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiTruck, FiShield } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

// ==================== STORAGE MANAGEMENT ====================
const STORAGE_KEYS = {
  NETPAY_SALES: 'user_netpay_sales',
  USER_SMS: 'user_sms_latest',
  USER_LOGGED_IN: 'user_logged_in_status',
  MOBILES: 'admin_mobiles_data',
  HOME_APPLIANCES: 'admin_home_appliances_data',
  SETTINGS: 'website_settings',
  ADMIN_SMS: 'admin_sms_reply',
  USER_ACCOUNTS: 'user_accounts_list'
};

/**
 * Store data in localStorage with JSON serialization
 */
function setLocalStorageData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Retrieve and parse data from localStorage
 */
function getLocalStorageData(key) {
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Error parsing localStorage key:", key, e);
    return null;
  }
}

// ==================== TIME & OFFER UTILITIES ====================
/**
 * Calculate offer end time based on offer time string
 * @param {string} offerTime - DateTime in format "YYYY-MM-DDTHH:MM" or ISO timestamp
 * @returns {Date|null} - End time or null if invalid
 */
const getOfferEndTime = (offerTime) => {
  if (!offerTime) return null;

  // Handle datetime-local format (YYYY-MM-DDTHH:MM)
  if (offerTime.includes('T')) {
    const dt = new Date(offerTime);
    if (!isNaN(dt.getTime())) {
      return dt;
    }
  }

  // Fallback for old HH:MM format (if any data exists)
  const [hours, minutes] = offerTime.split(':').map(Number);
  const now = new Date();
  let todayEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

  if (now > todayEndTime) {
    todayEndTime.setDate(todayEndTime.getDate() + 1);
  }
  return todayEndTime;
};

// ==================== SAMPLE DATA ====================
const samplePreciousItem = {};
const sampleOtherItem = {};

// ==================== API CONFIGURATION ====================
const API_URL = 'https://phonebooking.vercel.app/api';
const axiosInstance = axios.create({ baseURL: API_URL });

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  const loggedInUser = getLocalStorageData(STORAGE_KEYS.USER_LOGGED_IN);
  return loggedInUser?.token;
};

// Axios interceptor for adding auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// ==================== LOGIN COMPONENT ====================
/**
 * LoginComponent - Handles user login and signup
 */
const LoginComponent = ({ onLoginSuccess, onModalClose }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loginMobile, setLoginMobile] = useState('');
  const [username, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleView = () => {
    setIsLoginView(prev => !prev)
  };

  const handleAuth = async () => {
    // Validation
    if (isLoginView) {
      if (!loginMobile || !password) {
        toast.error("Please fill Mobile and Password to login.");
        return;
      }
    } else {
      if (!username || !phone || !password) {
        toast.error("Please fill Username, Mobile, and Password to signup.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLoginView) {
        // Login API call
        const res = await axiosInstance.post('/auth/login', { loginMobile, password });
        const { user, token } = res.data;
        setLocalStorageData(STORAGE_KEYS.USER_LOGGED_IN, { ...user, token, timestamp: Date.now() });
        toast.success('Login successful!');
        onLoginSuccess(user.username);
      } else {
        // Signup API call
        const res = await axiosInstance.post('/auth/signup', { username, phone, password });
        const { user, token } = res.data;
        setLocalStorageData(STORAGE_KEYS.USER_LOGGED_IN, { ...user, token, timestamp: Date.now() });
        toast.success('Account created successfully!');
        onLoginSuccess(user.username);
      }

      onModalClose();

    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modal-content">
      <h3>{isLoginView ? 'Login' : 'Signup'}</h3>

      {isLoginView ? (
        <div className="login-form-group">
          <label htmlFor="login-mobile">Mobile:</label>
          <input
            type="text"
            id="login-mobile"
            value={loginMobile}
            onChange={(e) => setLoginMobile(e.target.value)}
            placeholder="Enter your mobile number"
          />
        </div>
      ) : (
        <>
          <div className="login-form-group">
            <label htmlFor="signup-username">Username:</label>
            <input
              type="text"
              id="signup-username"
              value={username}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Choose a username"
            />
          </div>
          <div className="login-form-group">
            <label htmlFor="signup-phone">Mobile:</label>
            <input
              type="text"
              id="signup-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your mobile number"
            />
          </div>
        </>
      )}

      <div className="login-form-group">
        <label htmlFor="auth-password">Password:</label>
        <input
          type="password"
          id="auth-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
      </div>

      <div className="button-group">
        <button onClick={handleAuth} disabled={loading} className="btn-primary">
          {loading ? 'Processing...' : isLoginView ? 'Login' : 'Signup'}
        </button>
        <button onClick={onModalClose} disabled={loading} className="btn-secondary">Close</button>
      </div>

      <p className="auth-toggle">
        {isLoginView ? (
          <>Don't have an account? <span onClick={toggleView} className="toggle-link">Create Account</span></>
        ) : (
          <>Already have an account? <span onClick={toggleView} className="toggle-link">Login</span></>
        )}
      </p>
    </div>
  );
};


const Client = () => {
  // ==================== CONTEXT HOOKS ====================
  const {
    preciousItems,
    otherItems,
    netpaySales,
    settings,
    adminReplyContent: adminSms,
    setNetpaySales,
    fetchPublicData,
    sendMessage,
    placeOrder,
    placeNetpayOrder,
    placeEmiOrder,
    fetchUserMessages,
  } = useClientData();

  // ==================== LIFECYCLE - FETCH DATA ====================
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchPublicData();
      } catch (error) {
        console.error("Error fetching public data:", error);
      }
    };
    fetchData();
  }, [fetchPublicData]);

  // ==================== STATE MANAGEMENT ====================
  const [loggedInUser, setLoggedInUser] = useState(getLocalStorageData(STORAGE_KEYS.USER_LOGGED_IN));
  const [isLoggedIn, setIsLoggedIn] = useState(!!loggedInUser);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [activePage, setActivePage] = useState('home-page');
  const [userSmsReply, setUserSmsReply] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentBookingModel, setCurrentBookingModel] = useState(null);
  const [pendingNetpay, setPendingNetpay] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [pendingEmi, setPendingEmi] = useState(null);
  const [confirmingEmi, setConfirmingEmi] = useState(false);
  const [emiSelectedMonths, setEmiSelectedMonths] = useState('');
  const [emiDownPaymentInput, setEmiDownPaymentInput] = useState('');
  const [orderSuccessPopup, setOrderSuccessPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  const [netpayForm, setNetpayForm] = useState({
    name: loggedInUser?.username || '',
    mobile: loggedInUser?.phone || '',
    address: '',
    aadhar: '',
    bankDetails: ''
  });

  const netpayScreenshotRef = useRef(null);
  const userPhotoRef = useRef(null);
  const navigate = useNavigate();

  // ==================== DATA PROCESSING ====================
  const mobileData = preciousItems.filter(p => p.id).length > 0 ? preciousItems.filter(p => p.id) : [samplePreciousItem];
  const homeAppliancesData = otherItems.filter(p => p.id).length > 0 ? otherItems.filter(p => p.id) : [sampleOtherItem];

  // ==================== EVENT HANDLERS ====================
  const handleLoginSuccess = useCallback((username) => {
    const updatedUser = getLocalStorageData(STORAGE_KEYS.USER_LOGGED_IN);
    setLoggedInUser(updatedUser);
    setIsLoggedIn(true);
    setNetpayForm(prev => ({
      ...prev,
      name: updatedUser?.username || prev.name,
      mobile: updatedUser?.phone || prev.mobile
    }));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER_LOGGED_IN);
    setLoggedInUser(null);
    setIsLoggedIn(false);
    setNetpayForm({ name: '', mobile: '', address: '' });
    toast('You have been logged out.', { icon: 'ℹ️', duration: 3000 });
  };

  const handleNetpayFormChange = (e) => {
    const { id, value } = e.target;
    setNetpayForm(prev => ({ ...prev, [id.replace('netpay-user-', '')]: value }));
  };

  const showPage = (pageId) => {
    setActivePage(pageId);
    window.scrollTo(0, 0);
  };

  // ==================== LIFECYCLE - TIME & BANNER UPDATES ====================
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(`Date: ${now.toLocaleDateString('en-IN')} | Time: ${now.toLocaleTimeString('en-IN')}`);
      setTime(now);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const banners = settings.banners?.map(b => b.path).filter(Boolean) || [];

    if (banners.length > 1) {
      const carouselInterval = setInterval(() => {
        setCurrentBannerIndex(prevIndex => (prevIndex + 1) % banners.length);
      }, 3000);
      return () => clearInterval(carouselInterval);
    }
    if (banners.length <= 1) setCurrentBannerIndex(0);
  }, [settings.banners]);

  // ==================== LIFECYCLE - LOADER ====================
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loading />;

  // ==================== SMS FUNCTIONALITY ====================
  const sendSmsToAdmin = async (message, isInternal = false) => {
    if (!isLoggedIn) {
      if (!isInternal) toast.error("Login first to send message.", { duration: 3000 });
      return;
    }
    const smsContent = message || userSmsReply;
    if (!smsContent) {
      toast.error("Message cannot be empty.");
      return;
    }

    try {
      await sendMessage(smsContent);
      if (!isInternal) toast.success('Your message has been sent to the admin.');
      setUserSmsReply('');
      // refresh latest admin reply for logged in user
      try { await fetchUserMessages(); } catch (e) { }
    } catch (error) {
      console.error('SMS API Error:', error.response?.data || error.message);
      toast.error('Failed to send message. Please log in again.');
    }
  };

  // ==================== NETPAY ORDER WORKFLOW ====================
  const showNetpayDetails = (productId) => {
    if (!isLoggedIn) {
      toast.error("Login first to place a Netpay order.", { duration: 3000 });
      setLoginModalVisible(true);
      return;
    }
    const allProducts = [...mobileData, ...homeAppliancesData];
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      setCurrentBookingModel(product);
      showPage('netpay-details-page');
    }
  };

  // ==================== EMI WORKFLOW ====================
  const showEmiDetails = (productId) => {
    if (!isLoggedIn) {
      toast.error("Login first to place an EMI order.", { duration: 3000 });
      setLoginModalVisible(true);
      return;
    }
    const allProducts = [...mobileData, ...homeAppliancesData];
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      setCurrentBookingModel(product);
      // initialize EMI form values from product (admin-controlled)
      setEmiDownPaymentInput(product.downPaymentAmount || '');
      setEmiSelectedMonths('');
      showPage('emi-details-page');
    }
  };

  const submitEmiForm = () => {
    if (!netpayForm.name || !netpayForm.mobile || !netpayForm.address) {
      toast.error('Please fill all the required fields (Name, Mobile, Address).');
      return;
    }
    const months = parseInt((emiSelectedMonths || '').toString().split(',')[0], 10) || parseInt((currentBookingModel?.emiMonths || '').toString().split(',')[0], 10) || 0;
    setPendingEmi({
      product_id: currentBookingModel.id,
      name: netpayForm.name,
      mobile: netpayForm.mobile,
      address: netpayForm.address,
      aadhar: netpayForm.aadhar || '',
      bankDetails: netpayForm.bankDetails || '',
      model: currentBookingModel.model,
      amount: currentBookingModel.netpayPrice,
      emiMonths: emiSelectedMonths || currentBookingModel?.emiMonths || '',
      downPayment: Number(emiDownPaymentInput || currentBookingModel?.downPaymentAmount || 0),
      timestamp: new Date().toISOString(),
    });
    showPage('emi-qr-page');
  };

  const confirmEmi = async () => {
    if (!netpayScreenshotRef.current || netpayScreenshotRef.current.files.length === 0) {
      toast.error('Please upload payment screenshot');
      return;
    }
    if (!pendingEmi) {
      toast.error('Order data not found');
      return;
    }

    setConfirmingEmi(true);

    try {
      const file = netpayScreenshotRef.current.files[0];
      const formData = new FormData();
      formData.append('product_id', pendingEmi.product_id);
      formData.append('user_name', pendingEmi.name);
      formData.append('product_name', pendingEmi.model);
      formData.append('mobile', pendingEmi.mobile);
      formData.append('address', pendingEmi.address);
      formData.append('aadhar', pendingEmi.aadhar || '');
      formData.append('bank_details', pendingEmi.bankDetails || '');
      if (userPhotoRef.current && userPhotoRef.current.files.length > 0) {
        formData.append('user_photo', userPhotoRef.current.files[0]);
      }
      formData.append('amount', pendingEmi.amount);
      formData.append('emi_months', pendingEmi.emiMonths);
      formData.append('down_payment', pendingEmi.downPayment);
      formData.append('screenshot', file);

      const response = await placeEmiOrder(formData);

      if (response.order) {
        toast.success('EMI Order placed successfully!');
        setPendingEmi(null);
        setNetpayForm(prev => ({ ...prev, address: '', name: '', mobile: '', aadhar: '', bankDetails: '' }));
        showPage('home-page');
        setOrderSuccessPopup(true);
      }

    } catch (error) {
      console.error("EMI order placement API error:", error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to place EMI order';
      toast.error(errorMsg);
    } finally {
      setConfirmingEmi(false)
    }
  };

  // EMI calculations helper
  const computeEmiValues = () => {
    const total = Number(currentBookingModel?.netpayPrice || 0);
    const dp = Number(emiDownPaymentInput || currentBookingModel?.downPaymentAmount || 0);
    const months = parseInt((emiSelectedMonths || '').toString().split(',')[0], 10) || parseInt((currentBookingModel?.emiMonths || '').toString().split(',')[0], 10) || 0;
    const remaining = Math.max(0, total - dp);
    const monthly = months > 0 ? (remaining / months) : 0;
    return { total, dp, months, remaining, monthly };
  };

  const getEmiPreview = () => {
    if (pendingEmi) {
      const total = Number(pendingEmi.amount || 0);
      const dp = Number(pendingEmi.downPayment || 0);
      const months = parseInt((pendingEmi.emiMonths || '').toString().split(',')[0], 10) || 0;
      const remaining = Math.max(0, total - dp);
      const monthly = months > 0 ? (remaining / months) : 0;
      return { total, dp, months, remaining, monthly };
    }
    return computeEmiValues();
  };

  const submitNetpayForm = () => {
    if (!netpayForm.name || !netpayForm.mobile || !netpayForm.address) {
      toast.error('Please fill all the required fields (Name, Mobile, Address).');
      return;
    }
    setPendingNetpay({
      product_id: currentBookingModel.id,
      name: netpayForm.name,
      mobile: netpayForm.mobile,
      address: netpayForm.address,
      model: currentBookingModel.model,
      amount: currentBookingModel.netpayPrice,
      timestamp: new Date().toISOString(),
    });
    showPage('netpay-qr-page');
  };

  const confirmNetpay = async () => {
    if (!netpayScreenshotRef.current || netpayScreenshotRef.current.files.length === 0) {
      toast.error('Please upload payment screenshot');
      return;
    }
    if (!pendingNetpay) {
      toast.error('Order data not found');
      return;
    }

    setConfirmingPayment(true);

    try {
      const file = netpayScreenshotRef.current.files[0];
      const formData = new FormData();
      formData.append('product_id', pendingNetpay.product_id);
      formData.append('user_name', pendingNetpay.name);
      formData.append('product_name', pendingNetpay.model);
      formData.append('mobile', pendingNetpay.mobile);
      formData.append('address', pendingNetpay.address);
      formData.append('amount', pendingNetpay.amount);
      formData.append('screenshot', file);

      const response = await placeOrder(formData);

      if (response.order) {
        toast.success('Netpay Order placed successfully!');
        const newOrder = response.order;
        const newLocalOrder = {
          id: newOrder.id,
          model: pendingNetpay.model,
          userName: newOrder.user_name,
          amount: newOrder.amount,
          screenshot: newOrder.screenshot_url,
          deliveryStatus: newOrder.delivery_status || 'Pending',
          deliveryDate: newOrder.delivery_date || 'N/A',
          timestamp: new Date().toISOString(),
        };
      }

      setPendingNetpay(null);
      setNetpayForm(prev => ({ ...prev, address: '', name: '', mobile: '' }));
      showPage('home-page');
      setOrderSuccessPopup(true);

    } catch (error) {
      console.error("Order placement API error:", error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to place order';
      toast.error(errorMsg);
    } finally {
      setConfirmingPayment(false)
    }
  };

  // ==================== RENDER HELPERS ====================
  const renderOfferTimer = (product) => {
    if (!product.offer || !product.offerTime) return null;
    const endTime = getOfferEndTime(product.offerTime);
    if (!endTime) return null;
    const distance = endTime.getTime() - time.getTime();
    if (distance < 0) return '00:00';
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };


  const renderProductCard = (product, index) => (
    <div className="product-card" key={product.id || `product-${index}`}>
      {product.offer && (
        <div className="offer-circle">
          <span className="offer-text">{product.offer}%</span>
        </div>
      )}
      <div className="product-image">
        <img src={product.image} alt={product.model} loading="lazy" />
      </div>
      <div className="product-content">
        <h3>{product.model}</h3>
        {product.buyOneGetOne === 'Yes' && (
          <p style={{ color: '#E91E63', fontWeight: '700', fontSize: '10px', margin: '6px 0', letterSpacing: '0.5px' }}>
            BUY 1 GET 1 FREE
          </p>
        )}
        <p className="price-struck">Market: ₹{product.bookingAmount}</p>
        <p className="price">Netpay: ₹{product.netpayPrice}</p>
        <div className="product-actions">
          <button onClick={() => showNetpayDetails(product.id)} className="btn-netpay">View</button>
        </div>
      </div>
    </div>
  );


  const renderNetpayHistory = () => (
    <ul id="netpay-history-list" className="history-list">
      {netpaySales.length > 0 ? netpaySales.map(netpay => {
        const key = `${netpay.id}-${netpay.model}-${new Date(netpay.timestamp || netpay.createdAt).getTime()}`;
        const netpayDate = new Date(netpay.timestamp || netpay.createdAt).toLocaleString();
        const status = (netpay.deliveryStatus || netpay.delivery_status || 'Pending').toLowerCase();

        let deliveryStatus = 'Pending';
        let deliveryMessage = '';
        let statusIcon = '';

        if (status === 'confirmed' || status === 'delivered') {
          deliveryStatus = 'Delivery Confirmed';
          deliveryMessage = `Available on: ${netpay.deliveryDate}.`;
          statusIcon = '✔';
        } else if (status === 'cancelled') {
          deliveryStatus = 'Cancelled';
          statusIcon = '✕';
        }

        return (
          <li className="history-item" key={key}>
            <h4>
              Netpay No: {netpay.id} for {netpay.model}
              {statusIcon && <span className="tick-mark">{statusIcon}</span>}
            </h4>
            <p><strong>Date & Time:</strong> {netpayDate}</p>
            <p><strong>Total Price:</strong> INR {netpay.amount}</p>
            <p><strong>Delivery Status:</strong> {deliveryStatus}</p>
            {deliveryMessage && <p>{deliveryMessage}</p>}
          </li>
        );
      }) : <li className="no-history">No Netpay history found.</li>}
    </ul>
  );

  // ==================== POPUP STYLES ====================
  const popupOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000
  };

  const popupContentStyle = {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  };

  const popupTitleStyle = {
    marginBottom: '15px',
    color: '#1D4ED8'
  };

  const popupTextStyle = {
    marginBottom: '20px',
    fontSize: '1rem'
  };

  const popupButtonStyle = {
    padding: '10px 20px',
    backgroundColor: '#1D4ED8',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  };

  const popupButtonHoverStyle = {
    backgroundColor: '#2563EB'
  };

  // ==================== RENDER COMPONENT ====================
  return (
    <>
      <Toaster position="top-center" />

      {/* HEADER */}
      <div
        className="header"
        style={{
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: settings.headerBgColor || '#1D4ED8',
          minHeight: '200px'
        }}
      >
        {/* Debug logging - check if image URL is being received */}
        {(() => {
          if (settings.headerBgImage && settings.headerBgImage.trim()) {
            console.log('✅ Image URL received:', settings.headerBgImage);
            console.log('✅ Opacity value:', settings.headerImageOpacity);
            console.log('✅ Calculated opacity (0-1):', (settings.headerImageOpacity || 100) / 100);
          } else {
            console.log('⚠️ No image URL or empty string');
          }
          return null;
        })()}

        {/* Background Image Layer - Only show if image exists and is not empty */}
        {settings.headerBgImage && settings.headerBgImage.trim() && (
          <img
            src={settings.headerBgImage}
            alt="Header Background"
            crossOrigin="anonymous"
            onLoad={() => {
              console.log('✅ Header background image loaded successfully');
              console.log('✅ Image URL:', settings.headerBgImage);
            }}
            onError={(e) => {
              console.error('❌ Header background image failed to load');
              console.error('   URL:', settings.headerBgImage);
              console.error('   Error:', e);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: (Number(settings.headerImageOpacity ?? 100) || 100) / 100,
              transition: 'opacity 300ms ease',
              zIndex: 0
            }}
          />
        )}

        {/* Color Overlay Layer - shows when image opacity is less than 100 */}
        {settings.headerBgImage && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: settings.headerBgColor || '#1D4ED8',
              opacity: 1 - ((Number(settings.headerImageOpacity ?? 100) || 100) / 100),
              transition: 'opacity 300ms ease',
              zIndex: 1
            }}
          />
        )}

        {/* Content Container - Above all layers */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          padding: '25px 20px',
          minHeight: '200px',
          justifyContent: 'center'
        }}>
          <img
            src={settings.companyLogo || "https://placehold.co/100x50/4F46E5/ffffff?text=Company+Logo"}
            alt="Company Logo"
            className="header-image"
          />
          <h1>{settings.headerTitle || 'Booking Now'}</h1>
          <div className="date-time">{currentDateTime}</div>
        </div>

        {/* Login Button - Top layer */}
        <div className="login-status-container" style={{ zIndex: 3 }}>
          {isLoggedIn ? (
            <button onClick={handleLogout} className="login-button">Logout ({loggedInUser.username})</button>
          ) : (
            <button onClick={() => setLoginModalVisible(true)} className="login-button">Login/Signup</button>
          )}
        </div>
      </div>

      {/* BANNER CAROUSEL */}
      {settings.banners && settings.banners.length > 0 && (
        <div className="banner-carousel">
          <div className="carousel-track" style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}>
            {settings.banners.map((banner, index) => banner.path && (
              <div className="carousel-slide" key={banner.path || `banner-${index}`}>
                <img src={banner.path} alt={`Promotional Banner ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="container client-container">
        {/* HOME PAGE */}
        <div id="home-page" className={`page ${activePage === 'home-page' ? 'active' : ''}`}>
          {/* Product Grid Container */}
          <div className="product-sections-container">
            <div className="product-section left-section">
              <h2 className="section-title items-section">Mobile Items</h2>
              <div className="product-list grid-cards">
                {mobileData.map((p, i) => renderProductCard(p, i))}
              </div>
            </div>

            <div className="product-section right-section">
              <h2 className="section-title items-section">Other Items</h2>
              <div className="product-list grid-cards">
                {homeAppliancesData.map((p, i) => renderProductCard(p, i))}
              </div>
            </div>
          </div>


          <div className="stats-section statistic-container">
            <h2>Statistics</h2>
            <p>Total Netpay Sales: <span className="stats-number">{netpaySales.length}</span></p>
            <button onClick={() => showPage('netpay-history-page')} className="btn-primary">View Netpay History</button>
          </div>

          <div className="delivery-image-display">
            <h2>Our Delivery Fleet</h2>
            {settings.deliveryImage ? (
              <img src={settings.deliveryImage} alt="Delivery Vehicle" />
            ) : <span className="waiting-emoji">⏳</span>}
          </div>

          <div className="sms-section">
            <h2>Customer Support Message</h2>
            <p className="admin-message">{adminSms || 'No recent messages from the admin.'}</p>
            <div className="form-group">
              <label htmlFor="user-sms-reply">Reply to Admin:</label>
              <textarea id="user-sms-reply" className="sms-input" rows="3" value={userSmsReply} onChange={(e) => setUserSmsReply(e.target.value)}></textarea>
            </div>
            <button onClick={() => sendSmsToAdmin()} className="btn-primary">Send Reply</button>
          </div>


          {/* ADVERTISEMENT VIDEO SECTION */}
          {settings?.advertisementVideoUrl && (
            <div className="advertisement-section">
              <h2 className="ad-title">Special Advertisement</h2>

              <div className="ad-video-box">
                <video
                  className="ad-video"
                  controls
                  preload="metadata"
                >
                  <source src={settings.advertisementVideoUrl} type="video/mp4" />
                </video>
              </div>

              <p className="ad-note">Watch our latest offers & updates.</p>
            </div>
          )}


          {/* ===SERVICE SECTION==== */}
          <div className="services-section">
            <div className="service-item">
              <FiCheckCircle className="service-icon" />
              <span>Quality Service</span>
            </div>

            <div className="service-item">
              <FiTruck className="service-icon" />
              <span>Fast Delivery</span>
            </div>

            <div className="service-item">
              <FiShield className="service-icon" />
              <span>Trusted & Secure</span>
            </div>
          </div>

          {/* ================= APP DOWNLOAD SECTION ================= */}
          <div className="download-app-simple">
            <span className="download-text">
              📱 Download our mobile app for faster booking
            </span>

            <a
              href="https://drive.google.com/file/d/1tToEQX87EDQXqGvnuhYWpk3PCPcDj3Un/view?usp=sharing"
              className="download-btn"
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              ⬇ Download App
            </a>
          </div>

        </div>
        {/*------------------- HOME PAGE END ------------------- */}

        {/* NETPAY WORKFLOW PAGES */}
        {currentBookingModel && activePage?.startsWith('netpay') && <>
          {/* Netpay Details Page */}
          <div id="netpay-details-page" className={`page ${activePage === 'netpay-details-page' ? 'active' : ''}`}>
            <button onClick={() => showPage('home-page')} className="btn-back">← Back to Home</button>
            <h2>Purchase Option</h2>
            <div className="netpay-details">
              <h3>{currentBookingModel.model}</h3>
              <img src={currentBookingModel.image} alt="Product Image" className="netpay-product-image" />
              <h4>Item Full Details:</h4>
              <p className="item-specs">{currentBookingModel.fullSpecs || 'No details available.'}</p>
              <h3 className="netpay-price">Netpay Price: <span style={{ fontWeight: "600" }}>₹{currentBookingModel.netpayPrice}</span> </h3>
              {currentBookingModel.buyOneGetOne === 'Yes' && (
                <div className="b1g1-detail-box">
                  <h4 style={{ color: '#E91E63' }}>BUY 1 GET 1 FREE</h4>
                  <p style={{ fontSize: "12px", fontWeight: "700", color: "red" }}>(This offer is valid for Netpay only)</p>
                  <p style={{ margin: "5px 0", display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "13px", color: "#666", fontWeight: "600" }}>Offer Ends On:</span><span style={{ fontSize: "15px", color: "#FF0000", fontWeight: "bold" }}>{currentBookingModel.offerTime ? `${new Date(currentBookingModel.offerTime).getDate().toString().padStart(2, '0')}/${(new Date(currentBookingModel.offerTime).getMonth() + 1).toString().padStart(2, '0')}/${new Date(currentBookingModel.offerTime).getFullYear()} at ${new Date(currentBookingModel.offerTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : 'Limited Time'}</span></p>
                </div>
              )}
            </div>
            <div className="purchase-options" style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
              <button onClick={() => showPage('netpay-info-page')} className="netpay-buy-btn" style={{ flex: 1 }}>Netpay Buy</button>
              <button onClick={() => showPage('emi-details-page')} className="netpay-emi-btn" style={{ flex: 1 }}>EMI Payment</button>
            </div>
          </div>

          {/* Netpay Info Page */}
          <div id="netpay-info-page" className={`page ${activePage === 'netpay-info-page' ? 'active' : ''}`}>
            <button onClick={() => showPage('netpay-details-page')} className="btn-back">← Back</button>
            <h2>Enter Your Details for Netpay Purchase</h2>
            <form onSubmit={(e) => { e.preventDefault(); submitNetpayForm(); }} className="netpay-form">
              <div className="form-group">
                <label>Product Name:</label>
                <p className="form-display-value">{currentBookingModel.model}</p>
              </div>
              <div className="form-group">
                <label>Netpay Amount (INR):</label>
                <p className="form-display-value">{currentBookingModel.netpayPrice}</p>
              </div>
              <div className="form-group">
                <label htmlFor="netpay-user-name">Customer Name:</label>
                <input type="text" id="netpay-user-name" value={netpayForm.name} onChange={handleNetpayFormChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="netpay-user-mobile">Mobile Number:</label>
                <input type="text" id="netpay-user-mobile" value={netpayForm.mobile} onChange={handleNetpayFormChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="netpay-user-address">Home Address:</label>
                <textarea id="netpay-user-address" rows="3" value={netpayForm.address} onChange={handleNetpayFormChange} required></textarea>
              </div>
              <button type="button" onClick={submitNetpayForm} className="btn-primary">Proceed to Payment (QR)</button>
            </form>
          </div>

          {/* Netpay QR Page */}
          <div id="netpay-qr-page" className={`page ${activePage === 'netpay-qr-page' ? 'active' : ''}`}>
            <button onClick={() => showPage('netpay-info-page')} className="btn-back">← Back</button>
            <h2>Scan to Pay (INR {currentBookingModel.netpayPrice})</h2>
            <img src={currentBookingModel.netpayQrCode} alt="QR Code" className="qr-code-image" />
            <p className="qr-instruction">Please complete the payment and upload a screenshot of your payment confirmation below.</p>
            <div className="form-group">
              <label htmlFor="netpay-screenshot-upload">Upload Screenshot:</label>
              <input type="file" id="netpay-screenshot-upload" accept="image/*" ref={netpayScreenshotRef} required />
            </div>
            <button onClick={confirmNetpay} disabled={confirmingPayment} className="btn-primary">
              {confirmingPayment ? (
                <span className="button-loader">
                  <div className="spinner-small"></div> Processing...
                </span>) : ("Confirm Order & Upload Payment")}
            </button>
          </div>
        </>}

        {/* EMI WORKFLOW PAGES */}
        {currentBookingModel && activePage?.startsWith('emi') && <>
          <div id="emi-details-page" className={`page ${activePage === 'emi-details-page' ? 'active' : ''}`}>
            <button onClick={() => showPage('netpay-details-page')} className="btn-back">← Back</button>
            <h2>EMI Application Form</h2>
            <form onSubmit={(e) => { e.preventDefault(); submitEmiForm(); }} className="netpay-form">
              <div className="form-group">
                <label>Product Name:</label>
                <p className="form-display-value">{currentBookingModel.model}</p>
              </div>
              <div className="form-group">
                <label>Amount (INR):</label>
                <p className="form-display-value">{currentBookingModel.netpayPrice}</p>
              </div>
              <div className="form-group">
                <label>EMI Plan (months):</label>
                <select value={emiSelectedMonths} onChange={(e) => setEmiSelectedMonths(e.target.value)} required>
                  <option value="">Select a plan</option>
                  {(currentBookingModel.emiMonths || '').toString().split(',').map((m, idx) => m.trim() && <option key={idx} value={m.trim()}>{m.trim()} months</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Down Payment Amount (INR):</label>
                {currentBookingModel?.downPaymentAmount ? (
                  <p className="form-display-value">₹{Number(currentBookingModel.downPaymentAmount).toFixed(2)}</p>
                ) : (
                  <input type="number" value={emiDownPaymentInput} onChange={(e) => setEmiDownPaymentInput(e.target.value)} placeholder={currentBookingModel.downPaymentAmount || '0'} />
                )}
              </div>
              <div className="form-group">
                <label>Remaining Amount (INR):</label>
                <p className="form-display-value">₹{computeEmiValues().remaining.toFixed(2)}</p>
              </div>
              <div className="form-group">
                <label>Estimated Monthly EMI (INR):</label>
                <p className="form-display-value">₹{computeEmiValues().monthly.toFixed(2)}{computeEmiValues().months ? ` • ${computeEmiValues().months} months` : ''}</p>
              </div>
              <div className="form-group">
                <label>Customer Name:</label>
                <input type="text" value={netpayForm.name} onChange={handleNetpayFormChange} id="netpay-user-name" required />
              </div>
              <div className="form-group">
                <label>Mobile Number:</label>
                <input type="text" value={netpayForm.mobile} onChange={handleNetpayFormChange} id="netpay-user-mobile" required />
              </div>
              <div className="form-group">
                <label>Home Address:</label>
                <textarea rows="3" value={netpayForm.address} onChange={handleNetpayFormChange} id="netpay-user-address" required></textarea>
              </div>
              <div className="form-group">
                <label>Aadhar / Driving License Number:</label>
                <input type="text" value={netpayForm.aadhar} onChange={handleNetpayFormChange} id="netpay-user-aadhar" placeholder="Enter Aadhar or DL number" />
              </div>
              <div className="form-group">
                <label>Bank Details:</label>
                <textarea rows="2" value={netpayForm.bankDetails} onChange={handleNetpayFormChange} id="netpay-user-bankDetails" placeholder="Enter bank name / account / IFSC"></textarea>
              </div>
              <div className="form-group">
                <label>Customer Photo (for EMI verification):</label>
                <input type="file" accept="image/*" ref={userPhotoRef} />
              </div>

              <button type="button" onClick={submitEmiForm} className="btn-primary">Proceed to Payment (QR)</button>
            </form>
          </div>

          <div id="emi-qr-page" className={`page ${activePage === 'emi-qr-page' ? 'active' : ''}`}>
            <button onClick={() => showPage('emi-details-page')} className="btn-back">← Back</button>
            <h2>Scan to Pay (INR {currentBookingModel.netpayPrice})</h2>
            <div className="emi-breakdown" style={{ textAlign: 'left', margin: '12px 0' }}>
              {(() => {
                const preview = getEmiPreview();
                return (
                  <div>
                    <p><strong>Down Payment:</strong> ₹{Number(preview.dp || 0).toLocaleString('en-IN')}</p>
                    <p><strong>Remaining:</strong> ₹{Number(preview.remaining || 0).toLocaleString('en-IN')}</p>
                    <p><strong>Monthly EMI:</strong> ₹{Number(preview.monthly || 0).toLocaleString('en-IN')}{preview.months ? ` • ${preview.months} months` : ''}</p>
                  </div>

                )
              })()}
            </div>
            <img src={currentBookingModel.netpayQrCode} alt="QR Code" className="qr-code-image" />
            <p className="qr-instruction">Please complete the payment and upload a screenshot of your payment confirmation below.</p>
            <div className="form-group">
              <label htmlFor="emi-screenshot-upload">Upload Screenshot:</label>
              <input type="file" id="emi-screenshot-upload" accept="image/*" ref={netpayScreenshotRef} required />
            </div>
            <button onClick={confirmEmi} disabled={confirmingEmi} className="btn-primary">
              {confirmingEmi ? (
                <span className="button-loader">
                  <div className="spinner-small"></div> Processing...
                </span>) : ("Confirm EMI Order & Upload Payment")}
            </button>
          </div>
        </>}

        {/* ORDER SUCCESS POPUP */}
        {orderSuccessPopup && (
          <div style={popupOverlayStyle}>
            <div style={popupContentStyle}>
              <h3 style={popupTitleStyle}>🎉 Order Placed Successfully!</h3>
              <p style={popupTextStyle}>
                Your order is placed. It will arrive at your home within 5 days.
              </p>
              <button
                style={popupButtonStyle}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = popupButtonHoverStyle.backgroundColor}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = popupButtonStyle.backgroundColor}
                onClick={() => {
                  setOrderSuccessPopup(false);
                  showPage('home-page');
                  navigate("/")
                }}>
                Go to Home Page
              </button>
            </div>
          </div>
        )}

        {/* NETPAY HISTORY PAGE */}
        <div id="netpay-history-page" className={`page ${activePage === 'netpay-history-page' ? 'active' : ''}`}>
          <button onClick={() => showPage('home-page')} className="btn-back">← Back to Home</button>
          <h2>Netpay History</h2>
          <div className="history-section">{renderNetpayHistory()}</div>
        </div>
      </div>

      {/* LOGIN MODAL */}
      <div id="login-modal" className={`modal ${loginModalVisible ? 'active' : ''}`}>
        <div className="modal-content">
          <LoginComponent onLoginSuccess={handleLoginSuccess} onModalClose={() => setLoginModalVisible(false)} />
        </div>
      </div>

      {
        (() => {
          let wa = settings?.whatsappNumber;
          if (!wa) {
            try {
              const cached = JSON.parse(localStorage.getItem('website_settings')) || null;
              wa = cached?.whatsappNumber || '';
            } catch (e) {
              wa = '';
            }
          }
          wa = wa || '9123585348';
          const cleaned = String(wa).replace(/[^0-9]/g, '');
          const href = `https://wa.me/${cleaned}`;
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="whatsapp-float" aria-label="Chat on WhatsApp">
              <FaWhatsapp className="whatsapp-icon" />
            </a>
          );
        })()
      }


      {/* FOOTER */}
      <div className="email-display">
        <p>For any queries, contact us at: <em>phonebooking2025@gmail.com</em></p>
      </div>
    </>
  );
};

export default Client;
