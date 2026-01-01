import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, AuthProvider } from "../context/AuthContext";
import { useAdminData, AdminDataProvider } from "../context/AdminContext";
import {
  FiGrid, FiLogOut, FiSettings, FiShoppingBag, FiUsers,
  FiSave, FiSend, FiMenu, FiX, FiPlus, FiTrash2,
  FiMoon, FiSun, FiTrendingUp, FiMessageSquare,
  FiHome, FiCreditCard, FiActivity, FiPhone, FiEdit2,
  FiCheck, FiAlertCircle, FiChevronUp, FiChevronDown
} from "react-icons/fi";
import { MdInventory2 } from "react-icons/md";
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
      <p className={styles.homeBtn} onClick={() => navigate("/")}>← Home Page</p>
      <div className={styles.loginCard}>
        <h2>Admin Portal</h2>
        <form onSubmit={handleSubmit}>
          {loginError && <p className={styles.errorMsg}>⚠️ {loginError}</p>}
          <div className={styles.formGroup}>
            <label>Mobile Number</label>
            <input type="text" placeholder="Enter mobile" value={mobile} onChange={e => setMobile(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label>Password</label>
            <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className={styles.loginBtn}>{loading ? "🔄 Logging In..." : "Login"}</button>
        </form>
      </div>
    </div>
  );
};

// --- DASHBOARD CONTENT ---
const DashboardContent = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("insights");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [configTab, setConfigTab] = useState("general");
  const [editingProduct, setEditingProduct] = useState(null);

  const {
    preciousItems = [], otherItems = [], netpaySales = [],
    latestUserMessage = {}, adminReplyContent = "", setAdminReplyContent = () => { },
    settings = {}, loading = false, handleProductChange, addMoreProduct, deleteProduct,
    handleSettingsChange, handleBannerFileChange, addBannerInput, deleteBanner,
    confirmNetpayDelivery, sendSmsToUser, saveAllChanges
  } = useAdminData() || {};

  const saveTimeoutRef = useRef(null);
  const sidebarRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const [showScrollButtons, setShowScrollButtons] = useState({ up: false, down: false });

  // Scroll detection
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const scrollTop = scrollAreaRef.current.scrollTop;
      const scrollHeight = scrollAreaRef.current.scrollHeight;
      const clientHeight = scrollAreaRef.current.clientHeight;

      const isScrollable = scrollHeight > clientHeight + 2;
      if (!isScrollable) {
        setShowScrollButtons({ up: false, down: false });
        return;
      }

      setShowScrollButtons({
        up: scrollTop > 50,
        down: scrollTop < scrollHeight - clientHeight - 50
      });
    } else {
      setShowScrollButtons({ up: false, down: false });
    }
  };

  const scrollToTop = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target) &&
        !e.target.closest(`.${styles.menuBtn}`)) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener('scroll', handleScroll);
      // initial check
      handleScroll();
      return () => scrollArea.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (loading) return <Loader message="Loading Admin Panel..." />;

  const NavItem = ({ id, icon: Icon, label }) => (
    <button
      className={`${styles.navLink} ${activeTab === id ? styles.navLinkActive : ""}`}
      onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
    >
      <Icon size={20} /> <span>{label}</span>
    </button>
  );

  // Calculate Analytics
  const totalMobileItems = preciousItems.length;
  const totalOtherItems = otherItems.length;
  const totalItems = totalMobileItems + totalOtherItems;
  const totalOrders = netpaySales.length;
  const totalPrice = netpaySales.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
  const totalUsers = new Set(netpaySales.map(o => o.userName)).size;
  const deliveredOrders = netpaySales.filter(o => o.deliveryStatus === "delivered").length;
  const pendingOrders = totalOrders - deliveredOrders;

  return (
    <div className={`${styles.adminShell} ${styles[theme]}`}>
      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`} ref={sidebarRef}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>⚙️</div>
          <h3>ADMIN CORE</h3>
          <button className={styles.closeBtn} onClick={() => setIsSidebarOpen(false)}><FiX size={20} /></button>
        </div>

        <nav className={styles.sidebarNav}>
          <NavItem id="insights" icon={FiActivity} label="Insights" />
          <NavItem id="products" icon={MdInventory2} label="Inventory" />
          <NavItem id="orders" icon={FiShoppingBag} label="Orders" />
          <NavItem id="payments" icon={FiCreditCard} label="Payments" />
          <NavItem id="config" icon={FiSettings} label="Config" />
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.adminPanelBtn} onClick={() => navigate("/admin")}>
            <FiHome size={18} /> <span>Admin Panel</span>
          </button>
          <button className={styles.logoutBtn} onClick={logout}>
            <FiLogOut size={18} /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        {/* TOPBAR */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.menuBtn} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <FiMenu size={24} />
            </button>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          </div>
          <div className={styles.topbarRight}>
            <button className={styles.themeBtn} onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? <FiMoon size={20} /> : <FiSun size={20} />}
            </button>
          </div>
        </header>

        {/* SCROLL AREA */}
        <section className={styles.scrollArea} ref={scrollAreaRef}>
          {/* ===== INSIGHTS TAB ===== */}
          {activeTab === "insights" && (
            <div className={styles.insightsView}>
              <div className={styles.analyticsGrid}>
                <AnalyticsCard
                  title="Total Revenue"
                  value={`₹${totalPrice.toLocaleString()}`}
                  icon={<FiTrendingUp />}
                  color="revenue"
                />
                <AnalyticsCard
                  title="Other Items"
                  value={totalOtherItems}
                  icon={<MdInventory2 />}
                  color="other"
                />
                <AnalyticsCard
                  title="Mobiles Items"
                  value={totalMobileItems}
                  icon={<FiPhone />}
                  color="mobile"
                />
                <AnalyticsCard
                  title="Total Orders"
                  value={totalOrders}
                  icon={<FiShoppingBag />}
                  color="orders"
                />
                <AnalyticsCard
                  title="Total Users"
                  value={totalUsers}
                  icon={<FiUsers />}
                  color="users"
                />
                <AnalyticsCard
                  title="Delivered Orders"
                  value={`${deliveredOrders}/${totalOrders}`}
                  icon={<FiCheck />}
                  color="delivered"
                />
              </div>

              {/* Support Messages */}
              <div className={styles.supportSection}>
                <div className={styles.sectionHeader}>
                  <h2><FiMessageSquare /> Latest Support Message</h2>
                </div>
                <div className={styles.messageCard}>
                  {latestUserMessage.userId ? (
                    <>
                      <div className={styles.messageHeader}>
                        <strong>User ID:</strong> <span className={styles.userId}>{latestUserMessage.userId}</span>
                      </div>
                      <div className={styles.messageContent}>
                        <p>{latestUserMessage.content || 'Loading...'}</p>
                      </div>
                      <textarea
                        className={styles.replyInput}
                        value={adminReplyContent}
                        onChange={e => setAdminReplyContent(e.target.value)}
                        placeholder="Type your reply here..."
                        rows="3"
                      />
                      <button className={styles.sendBtn} onClick={sendSmsToUser}>
                        <FiSend /> Send Reply
                      </button>
                    </>
                  ) : (
                    <p className={styles.noMessages}>No pending messages</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== INVENTORY TAB ===== */}
          {activeTab === "products" && (
            <div className={styles.productsView}>
              {/* PRECIOUS ITEMS */}
              <div className={styles.productCategory}>
                <div className={styles.categoryHeader}>
                  <h2>📱 Mobile Phones</h2>
                  <button className={styles.addBtn} onClick={() => addMoreProduct("precious")}>
                    <FiPlus size={20} /> Add Mobile
                  </button>
                </div>
                {preciousItems.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No mobile phones added yet</p>
                  </div>
                ) : (
                  <div className={styles.productGrid}>
                    {preciousItems.map((item, i) => (
                      <ProductCard
                        key={i}
                        item={item}
                        index={i}
                        type="precious"
                        onDelete={deleteProduct}
                        onChange={handleProductChange}
                        isEditing={editingProduct === `precious-${i}`}
                        onEdit={() => setEditingProduct(`precious-${i}`)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* OTHER ITEMS */}
              <div className={styles.productCategory}>
                <div className={styles.categoryHeader}>
                  <h2>📦 Other Products</h2>
                  <button className={styles.addBtn} onClick={() => addMoreProduct("other")}>
                    <FiPlus size={20} /> Add Product
                  </button>
                </div>
                {otherItems.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No products added yet</p>
                  </div>
                ) : (
                  <div className={styles.productGrid}>
                    {otherItems.map((item, i) => (
                      <ProductCard
                        key={i}
                        item={item}
                        index={i}
                        type="other"
                        onDelete={deleteProduct}
                        onChange={handleProductChange}
                        isEditing={editingProduct === `other-${i}`}
                        onEdit={() => setEditingProduct(`other-${i}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== ORDERS TAB ===== */}
          {activeTab === "orders" && (
            <div className={styles.ordersView}>
              <div className={styles.sectionHeader}>
                <h2>📋 Order Management</h2>
                <span className={styles.orderCount}>Total: {totalOrders}</span>
              </div>
              {netpaySales.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {netpaySales.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      confirmDelivery={confirmNetpayDelivery}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== PAYMENTS TAB ===== */}
          {activeTab === "payments" && (
            <div className={styles.paymentsView}>
              <div className={styles.sectionHeader}>
                <h2>💳 Payment Analytics</h2>
              </div>
              {netpaySales.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No payment records</p>
                </div>
              ) : (
                <div className={styles.paymentsTable}>
                  {netpaySales.map(payment => (
                    <PaymentCard key={payment.id} payment={payment} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== CONFIG TAB ===== */}
          {activeTab === "config" && (
            <div className={styles.configView}>
              <div className={styles.configTabs}>
                <button
                  className={`${styles.configTabBtn} ${configTab === 'general' ? styles.configTabActive : ''}`}
                  onClick={() => setConfigTab('general')}
                >
                  General
                </button>
                <button
                  className={`${styles.configTabBtn} ${configTab === 'banners' ? styles.configTabActive : ''}`}
                  onClick={() => setConfigTab('banners')}
                >
                  Banners
                </button>
                <button
                  className={`${styles.configTabBtn} ${configTab === 'media' ? styles.configTabActive : ''}`}
                  onClick={() => setConfigTab('media')}
                >
                  Media
                </button>
              </div>

              {configTab === 'general' && (
                <div className={styles.configContent}>
                  <h3>General Settings</h3>
                  <div className={styles.formField}>
                    <label>Header Title</label>
                    <input
                      value={settings.headerTitle || ''}
                      onChange={e => handleSettingsChange('headerTitle', e.target.value)}
                      placeholder="Enter header title"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>WhatsApp Number</label>
                    <input
                      value={settings.whatsappNumber || ''}
                      onChange={e => handleSettingsChange('whatsappNumber', e.target.value)}
                      placeholder="Enter WhatsApp number"
                    />
                  </div>
                </div>
              )}

              {configTab === 'banners' && (
                <div className={styles.configContent}>
                  <h3>Website Banners</h3>
                  <button className={styles.addBannerBtn} onClick={addBannerInput}>
                    <FiPlus size={18} /> Add Banner
                  </button>
                  <div className={styles.bannersGrid}>
                    {settings.banners && settings.banners.map((banner, idx) => (
                      <div key={idx} className={styles.bannerCard}>
                        {banner.image && (
                          <img src={banner.image} alt={`Banner ${idx}`} />
                        )}
                        <div className={styles.bannerInputs}>
                          <div className={styles.formField}>
                            <label>Banner URL</label>
                            <input
                              type="text"
                              value={banner.url || ''}
                              onChange={e => {
                                const newBanners = [...settings.banners];
                                newBanners[idx].url = e.target.value;
                                handleSettingsChange('banners', newBanners);
                              }}
                              placeholder="https://example.com"
                            />
                            {banner.url && (
                              <small className={styles.urlPreview}>
                                Link: {banner.url.length > 30 ? banner.url.substring(0, 30) + '...' : banner.url}
                              </small>
                            )}
                          </div>
                          <div className={styles.formField}>
                            <label>Banner Image</label>
                            <input
                              type="file"
                              onChange={e => handleBannerFileChange(idx, e.target.files[0])}
                              placeholder="Upload banner image"
                            />
                          </div>
                        </div>
                        <button onClick={() => deleteBanner(idx)} className={styles.deleteBannerBtn}>
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {configTab === 'media' && (
                <div className={styles.configContent}>
                  <h3>Media Settings</h3>
                  <div className={styles.formField}>
                    <label>Company Logo</label>
                    <input
                      type="file"
                      onChange={e => handleSettingsChange('companyLogoFile', e.target.files[0])}
                    />
                    {settings.companyLogo && (
                      <img src={settings.companyLogo} alt="Logo" className={styles.mediaPreview} />
                    )}
                  </div>
                  <div className={styles.formField}>
                    <label>Delivery Image</label>
                    <input
                      type="file"
                      onChange={e => handleSettingsChange('deliveryImageFile', e.target.files[0])}
                    />
                    {settings.deliveryImage && (
                      <img src={settings.deliveryImage} alt="Delivery" className={styles.mediaPreview} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* FLOATING SAVE BUTTON */}
        <div className={styles.floatingSave}>
          <button onClick={saveAllChanges} className={styles.saveBtn}>
            <FiSave size={18} /> Save All Changes
          </button>
        </div>

        {/* SCROLL NAVIGATION BUTTONS */}
        {showScrollButtons.up && (
          <button
            className={styles.scrollBtn + ' ' + styles.scrollUp}
            onClick={scrollToTop}
            title="Scroll to top"
          >
            <FiChevronUp size={20} />
          </button>
        )}

        {showScrollButtons.down && (
          <button
            className={styles.scrollBtn + ' ' + styles.scrollDown}
            onClick={scrollToBottom}
            title="Scroll to bottom"
          >
            <FiChevronDown size={20} />
          </button>
        )}
      </main>
    </div>
  );
};

// ===== ANALYTICS CARD COMPONENT =====
const AnalyticsCard = ({ title, value, icon, color }) => (
  <div className={`${styles.analyticsCard} ${styles[`analytics${color?.charAt(0).toUpperCase() + color?.slice(1)}`]}`}>
    <div className={styles.cardBackground}></div>
    <div className={styles.cardIconWrapper}>
      <div className={styles.cardIcon}>{icon}</div>
    </div>
    <div className={styles.cardContent}>
      <small className={styles.cardTitle}>{title}</small>
      <h3 className={styles.cardValue}>{value}</h3>
    </div>
    <div className={styles.cardGradient}></div>
  </div>
);

// ===== PRODUCT CARD COMPONENT =====
const ProductCard = ({ item, index, type, onDelete, onChange, isEditing, onEdit }) => {
  return (
    <div className={`${styles.productCard} ${isEditing ? styles.productCardEditing : ''}`}>
      {item.image && (
        <div className={styles.productImage}>
          <img src={item.image} alt={item.model} />
        </div>
      )}
      <div className={styles.productBody}>
        <div className={styles.formGroup}>
          <label>Model Name</label>
          <input
            type="text"
            value={item.model}
            onChange={e => onChange(index, 'model', e.target.value, type)}
            placeholder="Model name"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Price</label>
          <input
            type="number"
            value={item.price}
            onChange={e => onChange(index, 'price', e.target.value, type)}
            placeholder="₹ Price"
          />
        </div>
        {item.offer && (
          <div className={styles.formGroup}>
            <label>Offer</label>
            <input
              type="text"
              value={item.offer}
              onChange={e => onChange(index, 'offer', e.target.value, type)}
              placeholder="Offer text"
            />
          </div>
        )}
        <div className={styles.fileInput}>
          <input
            type="file"
            onChange={e => onChange(index, 'imageFile', e.target.files[0], type)}
          />
          <span>📸 Upload Image</span>
        </div>
        <div className={styles.productActions}>
          <button onClick={() => onDelete(item.id, index, type)} className={styles.deleteBtn}>
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== ORDER CARD COMPONENT =====
const OrderCard = ({ order, confirmDelivery }) => {
  const isDelivered = order.deliveryStatus === "delivered";
  return (
    <div className={`${styles.orderCard} ${isDelivered ? styles.orderDelivered : ''}`}>
      <div className={styles.orderCardGrid}>
        <div className={styles.orderCardCol}>
          <div className={styles.orderLabel}>Product</div>
          <div className={styles.orderValue}>{order.model}</div>
        </div>
        <div className={styles.orderCardCol}>
          <div className={styles.orderLabel}>Customer</div>
          <div className={styles.orderValue}>{order.userName}</div>
        </div>
        <div className={styles.orderCardCol}>
          <div className={styles.orderLabel}>Mobile</div>
          <div className={styles.orderValue}>{order.mobile}</div>
        </div>
        <div className={styles.orderCardCol}>
          <div className={styles.orderLabel}>Amount</div>
          <div className={styles.orderValue}>₹{order.amount}</div>
        </div>
        <div className={styles.orderCardCol}>
          <div className={styles.orderLabel}>Payment Method</div>
          <div className={styles.orderValue}>{order.paymentMethod || 'N/A'}</div>
        </div>
        <div className={styles.orderCardCol}>
          <div className={styles.orderLabel}>Status</div>
          <div className={styles.orderValue}>{order.deliveryStatus}</div>
        </div>
        {order.emiMonths && (
          <div className={styles.orderCardCol}>
            <div className={styles.orderLabel}>EMI Plan</div>
            <div className={styles.orderValue}>{order.emiMonths} months</div>
          </div>
        )}
      </div>
      <div className={styles.orderStatus}>
        {isDelivered ? (
          <span className={styles.statusBadgeDelivered}>✓ Delivered</span>
        ) : (
          <button className={styles.confirmBtn} onClick={() => confirmDelivery(order.id)}>
            Mark as Delivered
          </button>
        )}
      </div>
    </div>
  );
};

// ===== PAYMENT CARD COMPONENT =====
const PaymentCard = ({ payment }) => {
  const isDelivered = payment.deliveryStatus === "delivered";
  return (
    <div className={styles.paymentShortCard}>
      <div className={styles.paymentPriceBar}>
        <span className={styles.paymentPriceValue}>₹{payment.amount}</span>
        <span className={`${styles.paymentStatusBadge} ${isDelivered ? styles.badgeDelivered : styles.badgePending}`}>
          {isDelivered ? "Delivered" : "Pending"}
        </span>
      </div>
      <div className={styles.paymentInfoGrid}>
        <div className={styles.paymentInfoItem}>
          <span className={styles.infoLabel}>Product</span>
          <span className={styles.infoValue}>{payment.model}</span>
        </div>
        <div className={styles.paymentInfoItem}>
          <span className={styles.infoLabel}>Customer</span>
          <span className={styles.infoValue}>{payment.userName}</span>
        </div>
        <div className={styles.paymentInfoItem}>
          <span className={styles.infoLabel}>Phone</span>
          <span className={styles.infoValue}>{payment.mobile}</span>
        </div>
        <div className={styles.paymentInfoItem}>
          <span className={styles.infoLabel}>Payment</span>
          <span className={styles.infoValue}>{payment.paymentMethod || 'N/A'}</span>
        </div>
        {payment.location && (
          <div className={styles.paymentInfoItem}>
            <span className={styles.infoLabel}>Location</span>
            <span className={styles.infoValue}>{payment.location}</span>
          </div>
        )}
        {payment.emiMonths && (
          <div className={styles.paymentInfoItem}>
            <span className={styles.infoLabel}>EMI</span>
            <span className={styles.infoValue}>{payment.emiMonths}m @ ₹{payment.monthlyEmi || 'N/A'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- AUTH GATE ---
const AuthGate = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader message="Checking Authentication..." />;
  return isAuthenticated ? <AdminDataProvider><DashboardContent /></AdminDataProvider> : <AdminLoginForm />;
};

// --- ADMIN WRAPPER ---
const AdminDashboard = () => <AuthProvider><AuthGate /></AuthProvider>;

export default AdminDashboard;
