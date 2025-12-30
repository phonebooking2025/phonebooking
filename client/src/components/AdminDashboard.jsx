import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, AuthProvider } from "../context/AuthContext";
import { useAdminData, AdminDataProvider } from "../context/AdminContext";
import {
  FiGrid, FiLogOut, FiSettings, FiShoppingBag, FiUsers,
  FiSave, FiSend, FiMenu, FiX, FiPlus, FiTrash2,
  FiMoon, FiSun, FiTrendingUp, FiMessageSquare,
  FiHome
} from "react-icons/fi";
import styles from './AdminDashboard.module.css';
import Loader from "./Loading";

// --- LOGIN FORM ---
const AdminLoginForm = () => {
  const { login, loginError, loading } = useAuth();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(mobile, password);
  };

  return (
    <div className={styles.loginContainer}>
      <p className={styles.homeBtn} onClick={() => navigate("/")}>Home Page</p>
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        {loginError && <p className={styles.errorMsg}>{loginError}</p>}
        <input type="text" placeholder="Mobile" value={mobile} onChange={e => setMobile(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? "Logging In..." : "Login"}</button>
      </form>
    </div>
  );
};

// --- DASHBOARD CONTENT ---
const DashboardContent = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const {
    preciousItems = [], otherItems = [], netpaySales = [],
    latestUserMessage = {}, adminReplyContent = "", setAdminReplyContent = () => { },
    settings = {}, loading = false, handleProductChange, addMoreProduct, deleteProduct,
    handleSettingsChange, handleBannerFileChange, addBannerInput, deleteBanner,
    confirmNetpayDelivery, sendSmsToUser, saveAllChanges
  } = useAdminData() || {};

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  if (loading) return <Loader message="Loading Admin Panel..." />;

  const NavItem = ({ id, icon: Icon, label }) => (
    <button className={`${styles.navLink} ${activeTab === id ? styles.navLinkActive : ""}`} onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}>
      <Icon /> <span>{label}</span>
    </button>
  );

  const renderFilePreview = (file, url) => file ? URL.createObjectURL(file) : url;

  return (
    <div className={`${styles.adminShell} ${theme}`}>
      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>A</div>
          <span>CORE ADMIN</span>
          <button className={styles.closeBtn} onClick={() => setIsSidebarOpen(false)}><FiX /></button>
        </div>

        {/* HOME LINK */}
        <div className={`${styles.navLink} ${activeTab === 'home' ? styles.navLinkActive : ""}`} onClick={() => { setActiveTab('home'); navigate("/admin"); setIsSidebarOpen(false); }}>
          <FiHome /> <span>Home</span>
        </div>

        {/* NAV LINKS */}
        <nav className={styles.sidebarNav}>
          <NavItem id="dashboard" icon={FiGrid} label="Insights" />
          <NavItem id="products" icon={FiShoppingBag} label="Inventory" />
          <NavItem id="orders" icon={FiUsers} label="Orders" />
          <NavItem id="settings" icon={FiSettings} label="Config" />
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={logout}>
            <FiLogOut /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setIsSidebarOpen(!isSidebarOpen)}><FiMenu /></button>
          <h1>{activeTab}</h1>
          <div className={styles.topbarActions}>
            <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? <FiMoon /> : <FiSun />}
            </button>
          </div>
        </header>

        <section className={styles.scrollArea}>
          {activeTab === "dashboard" && (
            <div className={styles.dashboardCards}>
              <div className={styles.statsGrid}>
                <StatCard label="Revenue" value={`₹${netpaySales.reduce((a, c) => a + (Number(c.amount) || 0), 0).toLocaleString()}`} icon={<FiTrendingUp />} />
                <StatCard label="Inventory" value={preciousItems.length + otherItems.length} icon={<FiShoppingBag />} />
                <StatCard label="Orders" value={netpaySales.length} icon={<FiUsers />} />
              </div>

              <div className={styles.dashboardCards}>
                <div className={styles.chatCard}>
                  <h3><FiMessageSquare /> Support Queue</h3>
                  <div className={styles.chatPreview}>
                    <div>UID: {latestUserMessage.userId || 'None'}</div>
                    <div>{latestUserMessage.content || 'No pending messages'}</div>
                    <textarea value={adminReplyContent} onChange={e => setAdminReplyContent(e.target.value)} placeholder="Reply..." />
                    <button style={{ height: "35px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }} onClick={sendSmsToUser}><FiSend /> Send</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <ProductSection title="Precious Items" data={preciousItems} type="precious" handler={handleProductChange} add={addMoreProduct} del={deleteProduct} />
          )}
          {activeTab === "orders" && (
            <div className={styles.ordersView}>
              {netpaySales.length === 0 ? <p>No Orders.</p> : netpaySales.map(order => <OrderCard key={order.id} order={order} confirmDelivery={confirmNetpayDelivery} />)}
            </div>
          )}
          {activeTab === "settings" && (
            <div className={styles.settingsView}>
              <h3>Website Settings</h3>
              <div className="form-group">
                <label>Header Title</label>
                <input value={settings.headerTitle || ''} onChange={e => handleSettingsChange('headerTitle', e.target.value)} />
              </div>
            </div>
          )}
        </section>

        <div className={styles.floatingSave}>
          <button onClick={saveAllChanges}><FiSave /> Save Changes</button>
        </div>
      </main>
    </div>
  );
};

// --- STAT CARD ---
const StatCard = ({ label, value, icon }) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statInfo}>
      <small>{label}</small>
      <h3>{value}</h3>
    </div>
  </div>
);

// --- PRODUCT SECTION ---
const ProductSection = ({ title, data, type, handler, add, del }) => (
  <div className={styles.productSection}>
    <h3>{title} <button onClick={() => add(type)}><FiPlus /></button></h3>
    {data.map((item, i) => (
      <div key={i} className={styles.productCard}>
        <input placeholder="Model" value={item.model} onChange={e => handler(i, 'model', e.target.value, type)} />
        <input type="number" placeholder="Price" value={item.price} onChange={e => handler(i, 'price', e.target.value, type)} />
        <input type="file" onChange={e => handler(i, 'imageFile', e.target.files[0], type)} />
        <button onClick={() => del(item.id, i, type)}><FiTrash2 /></button>
      </div>
    ))}
  </div>
);

// --- ORDER CARD ---
const OrderCard = ({ order, confirmDelivery }) => (
  <div className={styles.orderCard}>
    <h4>{order.model} <span>₹{order.amount}</span></h4>
    <p>{order.userName} | {order.mobile}</p>
    {order.deliveryStatus !== "delivered" ? <button onClick={() => confirmDelivery(order.id)}>Confirm</button> : <span>✅ Delivered</span>}
  </div>
);

// --- AUTH GATE ---
const AuthGate = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader message="Checking Authentication..." />;
  return isAuthenticated ? <AdminDataProvider><DashboardContent /></AdminDataProvider> : <AdminLoginForm />;
};

// --- ADMIN WRAPPER ---
const AdminDashboard = () => <AuthProvider><AuthGate /></AuthProvider>;

export default AdminDashboard;
