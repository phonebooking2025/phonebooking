import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import "./Client.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';
import Loading from './Loading';
import { useNavigate } from 'react-router-dom';

// Define key for storing user login info in localStorage
const USER_LOGGED_IN_KEY = 'user_logged_in_status';

// --- Helper Functions for localStorage ---
function getLocalStorageData(key) {
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Error parsing localStorage key:", key, e);
    return null;
  }
}

function setLocalStorageData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- API Configuration ---
const API_URL = 'https://phonebooking.vercel.app/api';
const axiosInstance = axios.create({ baseURL: API_URL });

// --- Axios Interceptor to add Auth Token ---
axiosInstance.interceptors.request.use(
  (config) => {
    const loggedInUser = getLocalStorageData(USER_LOGGED_IN_KEY);
    const token = loggedInUser?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Offer Time Calculation Helper ---
const getOfferEndTime = (offerTime) => {
  if (!offerTime) return null;
  const [hours, minutes] = offerTime.split(':').map(Number);
  const now = new Date();
  let endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  if (now > endTime) {
    endTime.setDate(endTime.getDate() + 1);
  }
  return endTime;
};


// --- Login/Signup Component ---
const LoginComponent = ({ onLoginSuccess, onModalClose }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleView = () => setIsLoginView(prev => !prev);

  const handleAuth = async () => {
    if ((isLoginView && (!mobile || !password)) || (!isLoginView && (!username || !password || !mobile))) {
      toast.error('Please fill all the required fields.');
      return;
    }
    setLoading(true);
    try {
      const response = isLoginView ?
        await axiosInstance.post('/auth/login', { loginMobile: mobile, password }) :
        await axiosInstance.post('/auth/signup', { username, password, phone: mobile });

      const { token, user } = response.data;
      setLocalStorageData(USER_LOGGED_IN_KEY, { ...user, token, timestamp: Date.now() });
      onLoginSuccess(user);
      toast.success(isLoginView ? 'Login successful!' : 'Account created successfully!');
      onModalClose();
    } catch (error) {
      const message = error.response?.data?.message || `Authentication failed. ${isLoginView ? 'Please check your credentials.' : 'Please try a different username or mobile.'}`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modal-content">
      <h3>{isLoginView ? 'Login' : 'Signup'}</h3>
      {!isLoginView && (
        <div className="form-group">
          <label htmlFor="auth-username">Username:</label>
          <input type="text" id="auth-username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
      )}
      <div className="form-group">
        <label htmlFor="auth-mobile">Mobile:</label>
        <input type="text" id="auth-mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="auth-password">Password:</label>
        <input type="password" id="auth-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button onClick={handleAuth} disabled={loading} style={{ marginRight: '10px' }}>
        {loading ? 'Processing...' : (isLoginView ? 'Login' : 'Signup')}
      </button>
      <button onClick={onModalClose} disabled={loading}>Close</button>
      <p style={{ marginTop: '15px' }}>
        {isLoginView ?
          (<>Don't have an account? <span onClick={toggleView} style={{ color: 'blue', cursor: 'pointer', fontWeight: 'bold' }}>Create Account</span></>) :
          (<>Already have an account? <span onClick={toggleView} style={{ color: 'blue', cursor: 'pointer', fontWeight: 'bold' }}>Login</span></>)
        }
      </p>
    </div>
  );
};


// --- Main Client Component ---
const Client = () => {
  // Auth State
  const [loggedInUser, setLoggedInUser] = useState(getLocalStorageData(USER_LOGGED_IN_KEY));
  const [isLoggedIn, setIsLoggedIn] = useState(!!loggedInUser);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  // Data State
  const [preciousItems, setPreciousItems] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [netpaySales, setNetpaySales] = useState([]);
  const [settings, setSettings] = useState({ banners: [], headerTitle: 'Booking Now', companyLogo: '', deliveryImage: '' });
  const [adminSms, setAdminSms] = useState('');
  const [userSmsReply, setUserSmsReply] = useState('');

  // UI/Flow State
  const [pageLoading, setPageLoading] = useState(true);
  const [activePage, setActivePage] = useState('home-page');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [time, setTime] = useState(new Date());
  const [currentBookingModel, setCurrentBookingModel] = useState(null);
  const [pendingNetpay, setPendingNetpay] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [orderSuccessPopup, setOrderSuccessPopup] = useState(false);
  const [netpayForm, setNetpayForm] = useState({
    name: loggedInUser?.username || '',
    mobile: loggedInUser?.phone || '',
    address: ''
  });

  const netpayScreenshotRef = useRef(null);
  const navigate = useNavigate();

  // --- Data Fetching ---
  const fetchUserData = useCallback(async () => {
    if (!isLoggedIn) {
      setNetpaySales([]);
      setAdminSms('');
      return;
    }
    try {
      const [ordersRes, messagesRes] = await Promise.all([
        axiosInstance.get('/orders/my-orders'),
        axiosInstance.get('/messages/my-thread')
      ]);

      const mapOrderFromDb = (order) => ({
        id: order.id,
        model: order.product?.model,
        userName: order.user_name,
        amount: order.amount,
        deliveryStatus: order.delivery_status,
        deliveryDate: order.delivery_date,
        createdAt: order.created_at,
      });
      setNetpaySales((ordersRes.data || []).map(mapOrderFromDb));
      console.log(netpaySales);
      

      const adminMessage = (messagesRes.data || [])
        .filter(msg => msg.is_from_admin)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      setAdminSms(adminMessage ? adminMessage.content : 'No recent messages from the admin.');

    } catch (error) {
      console.error("Failed to fetch user data:", error);
      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please log in again.");
        handleLogout();
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchPublicData = async () => {
      setPageLoading(true);
      try {
        const [preciousRes, otherRes, settingsRes] = await Promise.all([
          axiosInstance.get('/products/precious'),
          axiosInstance.get('/products/other'),
          axiosInstance.get('/settings')
        ]);
        setPreciousItems(preciousRes.data || []);
        setOtherItems(otherRes.data || []);
        const fetchedSettings = settingsRes.data || {};
        setSettings({
          banners: (fetchedSettings.banners || []).map(url => ({ path: url })),
          headerTitle: fetchedSettings.header_title || 'Booking Now',
          companyLogo: fetchedSettings.company_logo_url,
          deliveryImage: fetchedSettings.delivery_image_url
        });
      } catch (error) {
        console.error("Failed to fetch public data:", error);
        toast.error("Could not load website data. Please refresh.");
      } finally {
        setPageLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // --- Auth Handlers ---
  const handleLoginSuccess = useCallback((user) => {
    setLoggedInUser(user);
    setIsLoggedIn(true);
    setNetpayForm(prev => ({
      ...prev,
      name: user?.username || '',
      mobile: user?.phone || ''
    }));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(USER_LOGGED_IN_KEY);
    setLoggedInUser(null);
    setIsLoggedIn(false);
    setNetpayForm({ name: '', mobile: '', address: '' });
    toast.info('You have been logged out.', { autoClose: 3000 });
  };

  // --- Timers and Intervals ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(`Date: ${now.toLocaleDateString('en-IN')} | Time: ${now.toLocaleTimeString('en-IN')}`);
      setTime(now);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const banners = settings.banners?.filter(Boolean) || [];
    if (banners.length > 1) {
      const carouselInterval = setInterval(() => {
        setCurrentBannerIndex(prevIndex => (prevIndex + 1) % banners.length);
      }, 3000);
      return () => clearInterval(carouselInterval);
    }
  }, [settings.banners]);

  // --- Page and Form Handlers ---
  const showPage = (pageId) => {
    setActivePage(pageId);
    window.scrollTo(0, 0);
  };

  const handleNetpayFormChange = (e) => {
    const { id, value } = e.target;
    setNetpayForm(prev => ({ ...prev, [id.replace('netpay-user-', '')]: value }));
  };

  const sendSmsToAdmin = async () => {
    if (!isLoggedIn) {
      toast.warn("Login first to send a message.", { autoClose: 3000 });
      return;
    }
    if (!userSmsReply.trim()) {
      toast.warn("Message cannot be empty.");
      return;
    }
    try {
      await axiosInstance.post('/messages/send', { content: userSmsReply });
      toast.success('Your message has been sent to the admin.');
      setUserSmsReply('');
    } catch (error) {
      console.error('SMS API Error:', error.response?.data || error.message);
      toast.error('Failed to send message. Please try logging in again.');
    }
  };

  // --- Netpay Order Flow ---
  const showNetpayDetails = (productId) => {
    if (!isLoggedIn) {
      toast.warn("Login first to place an order.", { autoClose: 3000 });
      setLoginModalVisible(true);
      return;
    }
    const allProducts = [...preciousItems, ...otherItems];
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      setCurrentBookingModel(product);
      showPage('netpay-details-page');
    }
  };

  const submitNetpayForm = () => {
    if (!netpayForm.name || !netpayForm.mobile || !netpayForm.address) {
      toast.error('Please fill all required fields (Name, Mobile, Address).');
      return;
    }
    setPendingNetpay({
      product_id: currentBookingModel.id,
      name: netpayForm.name,
      mobile: netpayForm.mobile,
      address: netpayForm.address,
      model: currentBookingModel.model,
      amount: currentBookingModel.netpayPrice,
    });
    showPage('netpay-qr-page');
  };

  const confirmNetpay = async () => {
    if (!netpayScreenshotRef.current?.files?.[0]) {
      toast.error("Please upload a payment screenshot.");
      return;
    }
    if (!pendingNetpay) return;

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

      await axiosInstance.post('/orders/place', formData);

      await fetchUserData(); // Refresh user orders

      setPendingNetpay(null);
      setNetpayForm(prev => ({ ...prev, address: '' }));
      showPage('netpay-history-page');
      setOrderSuccessPopup(true);

    } catch (error) {
      console.error("Order placement API error:", error.response?.data || error.message);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setConfirmingPayment(false);
    }
  };

  // --- Render Functions ---
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

  const renderProductCard = (product) => (
    <div className="product-card" key={product.id}>
      {product.offer && <div className="offer-circle"><span className="offer-text">{product.offer}% OFF</span></div>}
      {product.offer && product.offerTime && renderOfferTimer(product) && <div className="offer-time-display">{renderOfferTimer(product)}</div>}
      <h3>{product.model}</h3>
      <img src={product.image} alt={product.model} />
      <p className="price">Netpay Price: INR {product.netpayPrice}</p>
      <p style={{ textDecoration: 'line-through', color: 'gray', fontSize: '0.9em' }}>Market Price: INR {product.bookingAmount}</p>
      <p style={{ fontSize: '0.9em', color: 'green' }}>Original Price: INR {product.price}</p>
      <button onClick={() => showNetpayDetails(product.id)}>Netpay</button>
    </div>
  );

  const renderNetpayHistory = () => (
    <ul id="netpay-history-list" className="history-list">
      {netpaySales.length > 0 ? netpaySales.map(netpay => {
        const key = `${netpay.id}-${netpay.model}-${new Date(netpay.createdAt).getTime()}`;
        const netpayDate = new Date(netpay.createdAt).toLocaleString();
        const deliveryStatus = netpay.deliveryStatus === 'Confirmed' ? `Delivery Confirmed` : 'Pending Confirmation';
        const deliveryMessage = netpay.deliveryStatus === 'Confirmed' ? `Available on: ${new Date(netpay.deliveryDate).toLocaleDateString()}.` : '';
        return (
          <li className="history-item" key={key}>
            <h4>
              Netpay No: {netpay.id} for {netpay.model}
              {netpay.deliveryStatus === 'Confirmed' && <span className="tick-mark">✔</span>}
            </h4>
            <p><strong>Date & Time:</strong> {netpayDate}</p>
            <p><strong>Total Price:</strong> INR {netpay.amount}</p>
            <p><strong>Delivery Status:</strong> {deliveryStatus}</p>
            {deliveryMessage && <p>{deliveryMessage}</p>}
          </li>
        );
      }) : <li>No Netpay history found.</li>}
    </ul>
  );

  // --- Styles for Popup ---
  const popupOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 };
  const popupContentStyle = { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', maxWidth: '400px', width: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' };
  const popupTitleStyle = { marginBottom: '15px', color: '#1D4ED8' };
  const popupTextStyle = { marginBottom: '20px', fontSize: '1rem' };
  const popupButtonStyle = { padding: '10px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' };
  const popupButtonHoverStyle = { backgroundColor: '#2563EB' };

  if (pageLoading) return <Loading />;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Toaster />

      <div className="header">
        <img
          src={settings.companyLogo || "https://placehold.co/100x50/4F46E5/ffffff?text=Company+Logo"}
          alt="Company Logo"
          className="header-image"
        />
        <h1>{settings.headerTitle}</h1>
        <div className="date-time">{currentDateTime}</div>
        <div className="login-status-container" style={{ position: 'absolute', top: '10px', right: '10px' }}>
          {isLoggedIn ? (
            <button onClick={handleLogout} className="login-button">Logout ({loggedInUser.username})</button>
          ) : (
            <button onClick={() => setLoginModalVisible(true)} className="login-button">Login/Signup</button>
          )}
        </div>
      </div>

      {/* Banner Carousel */}
      {settings.banners && settings.banners.length > 0 && (
        <div className="banner-carousel">
          <div className="carousel-track" style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}>
            {settings.banners.map((banner, index) => banner.path && (
              <div className="carousel-slide" key={index}>
                <img src={banner.path} alt={`Promotional Banner ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="container">
        {/* Home Page */}
        <div id="home-page" className={`page ${activePage === 'home-page' ? 'active' : ''}`}>
          <div className="product-sections-container">
            <div className="product-section">
              <h2 className="section-title">Precious Items</h2>
              <div className="product-list">{preciousItems.map(renderProductCard)}</div>
            </div>
            <div className="product-section">
              <h2 className="section-title">Other Items</h2>
              <div className="product-list">{otherItems.map(renderProductCard)}</div>
            </div>
          </div>

          <div className="stats-section">
            <h2>Statistics</h2>
            <p>Your Total Orders: <span>{netpaySales.length}</span></p>
            <button onClick={() => showPage('netpay-history-page')}>My Order History</button>
          </div>

          <div className="delivery-image-display">
            <h2>Our Delivery Fleet</h2>
            {settings.deliveryImage ? (
              <img src={settings.deliveryImage} alt="Delivery Vehicle" />
            ) : <span className="waiting-emoji">⏳</span>}
          </div>

          <div className="sms-section">
            <h2>Company Staff Message</h2>
            <p>{adminSms || 'No recent messages from the admin.'}</p>
            <div className="form-group">
              <label htmlFor="user-sms-reply">Reply to Admin:</label>
              <textarea id="user-sms-reply" className="sms-input" rows="3" value={userSmsReply} onChange={(e) => setUserSmsReply(e.target.value)}></textarea>
            </div>
            <button onClick={sendSmsToAdmin}>Send Reply</button>
          </div>
        </div>

        {/* Netpay Pages */}
        {currentBookingModel && <>
          <div id="netpay-details-page" className={`page ${activePage === 'netpay-details-page' ? 'active' : ''}`}>
            <button onClick={() => showPage('home-page')}>Back to Home</button>
            <h2>Netpay Purchase</h2>
            <div>
              <h3>{currentBookingModel.model}</h3>
              <img src={currentBookingModel.image} alt="Product" style={{ width: '100%', maxWidth: '400px', display: 'block', margin: '0 auto' }} />
              <h4>Item Full Details:</h4>
              <p>{currentBookingModel.fullSpecs || 'No details available.'}</p>
              <h3>Netpay Price: INR {currentBookingModel.netpayPrice}</h3>
            </div>
            <button onClick={() => showPage('netpay-info-page')}>Proceed to Checkout</button>
          </div>

          <div id="netpay-info-page" className={`page ${activePage === 'netpay-info-page' ? 'active' : ''}`}>
            <button onClick={() => showPage('netpay-details-page')}>Back</button>
            <h2>Enter Your Details for Netpay</h2>
            <form onSubmit={(e) => { e.preventDefault(); submitNetpayForm(); }}>
              <div className="form-group"><label>Item Name:</label><p style={{ fontWeight: 'bold' }}>{currentBookingModel.model}</p></div>
              <div className="form-group"><label htmlFor="netpay-user-name">Your Name:</label><input type="text" id="netpay-user-name" value={netpayForm.name} onChange={handleNetpayFormChange} required /></div>
              <div className="form-group"><label htmlFor="netpay-user-mobile">Mobile Number:</label><input type="text" id="netpay-user-mobile" value={netpayForm.mobile} onChange={handleNetpayFormChange} required /></div>
              <div className="form-group"><label htmlFor="netpay-user-address">Home Address:</label><textarea id="netpay-user-address" rows="3" value={netpayForm.address} onChange={handleNetpayFormChange} required></textarea></div>
              <button type="submit">Proceed to Payment (QR)</button>
            </form>
          </div>

          <div id="netpay-qr-page" className={`page ${activePage === 'netpay-qr-page' ? 'active' : ''}`}>
            <button onClick={() => showPage('netpay-info-page')}>Back</button>
            <h2>Scan to Pay (INR {currentBookingModel.netpayPrice})</h2>
            <img src={currentBookingModel.netpayQrCode} alt="QR Code" style={{ width: '100%', maxWidth: '300px', display: 'block', margin: '0 auto' }} />
            <p>Please complete the payment and upload a screenshot of your payment confirmation below.</p>
            <div className="form-group"><label htmlFor="netpay-screenshot-upload">Upload Screenshot:</label><input type="file" id="netpay-screenshot-upload" accept="image/*" ref={netpayScreenshotRef} required /></div>
            <button onClick={confirmNetpay} disabled={confirmingPayment}>
              {confirmingPayment ? (
                <span className="button-loader"><div className="spinner-small"></div> Processing...</span>
              ) : ("Confirm Order & Upload Payment")}
            </button>
          </div>
        </>}

        {orderSuccessPopup && (
          <div style={popupOverlayStyle}>
            <div style={popupContentStyle}>
              <h3 style={popupTitleStyle}>🎉 Order Placed Successfully!</h3>
              <p style={popupTextStyle}>Your order is placed. It will arrive at your home within 5 days.</p>
              <button
                style={popupButtonStyle}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = popupButtonHoverStyle.backgroundColor}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = popupButtonStyle.backgroundColor}
                onClick={() => {
                  setOrderSuccessPopup(false);
                  showPage('home-page');
                  setCurrentBookingModel(null);
                }}>
                Go to Home Page
              </button>
            </div>
          </div>
        )}

        {/* Netpay History Page */}
        <div id="netpay-history-page" className={`page ${activePage === 'netpay-history-page' ? 'active' : ''}`}>
          <button onClick={() => showPage('home-page')}>Back to Home</button>
          <h2>My Netpay History</h2>
          <div className="history-section">{renderNetpayHistory()}</div>
        </div>
      </div>

      {/* Login Modal */}
      {loginModalVisible && (
        <div id="login-modal" className="modal active">
          <div className="modal-content">
            <LoginComponent onLoginSuccess={handleLoginSuccess} onModalClose={() => setLoginModalVisible(false)} />
          </div>
        </div>
      )}


      <div className="email-display">
        <p>For any queries, contact us at: <em>bookingmobile202526@gmail.com</em></p>
      </div>
    </>
  );
};

export default Client;
