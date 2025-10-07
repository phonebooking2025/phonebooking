
import React, { useState } from 'react';
import { useAdminData, AdminDataProvider } from '../context/AdminContext';
import { useAuth, AuthProvider } from '../context/AuthContext';
import Loading from './Loading'; // <- new Loading component

// --- ADMIN LOGIN FORM COMPONENT ---
const AdminLoginForm = () => {
    const { login, loginError, loading } = useAuth();
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        login(mobile, password);
    };

    return (
        <div style={{
            maxWidth: '400px',
            margin: '100px auto',
            padding: '40px',
            backgroundColor: '#fff',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
            <h2 style={{ textAlign: 'center', color: '#264D59' }}>Admin Login</h2>
            <form onSubmit={handleSubmit}>
                {loginError && <p style={{ color: 'red', textAlign: 'center' }}>{loginError}</p>}

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Mobile:</label>
                    <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#264D59',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'Logging In...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

// --- ADMIN CONTENT COMPONENT ---
const AdminContent = () => {
    const { logout } = useAuth();

    // Consume state and actions from the context
    const {
        preciousItems, otherItems, netpaySales, settings, loading, error,
        setAdminSmsReply, handleProductChange, addMoreProduct, deleteProduct, handleSettingsChange,
        handleBannerFileChange, addBannerInput, deleteBanner, confirmNetpayDelivery, sendSmsToUser,
        saveAllChanges, latestUserMessage, adminReplyContent, setAdminReplyContent,
    } = useAdminData();


    const renderBannerImage = (banner) => {
        if (!banner) return null;
        if (banner.newFile) return URL.createObjectURL(banner.newFile);
        if (banner.path) return banner.path;
        return null;
    };

    const renderFilePreview = (file, url) => file ? URL.createObjectURL(file) : url;

    if (loading) return <Loading />; // <- animated loading for 2s

    if (error) return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>⚠️ Data Error: {error}</div>;

    return (
        <>
            <style>{`
                body { overflow-x:hidden; background-color: #f4f4f4; padding: 20px  5px; }
                .container { width:100%; max-width: 900px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
                h1, h2 { text-align: center; color: #333; }
                .form-section { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 8px; position: relative; }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
                .form-group input, .form-group textarea { box-sizing: border-box; width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; word-wrap: break-word; overflow-wrap: break-word; }
                .form-group textarea { resize: vertical; max-height: 150px; }
                .form-group input[type="file"] { border: none; padding: 3px; }
                .form-actions { text-align: right; margin-top: 10px; }
                .main-buttons { text-align: center; margin-top: 20px; }
                .main-buttons button, .form-actions button { background-color: #264D59; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 1em; margin: 0 5px; }
                .main-buttons button:hover, .form-actions button:hover { background-color: #3e7b8c; }
                .data-display { background: #e9e9e9; padding: 15px; margin-top: 20px; border-radius: 8px; word-wrap: break-word; overflow-wrap: break-word; }
                .data-display h3 { margin-top: 0; }
                .data-display ul { list-style-type: none; padding: 0; }
                .data-display li { background: white; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 4px; word-wrap: break-word; overflow-wrap: break-word; }
                .confirm-btn { background-color: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-top: 10px; }
                .confirm-btn:hover { background-color: #218838; }
                .user-screenshot { width:200px; max-width: 100%; height: auto; margin-top: 10px; margin-bottom:25px; border: 1px solid #ddd; }
                .delete-btn { background-color: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.5em; margin-left: 10px; margin-top: 5px; transition: background-color 0.3s ease; }
                .delete-btn:hover { background-color: #c82333; }
                .confirmation-status { color: green; font-weight: bold; display: flex; align-items: center; }
                .confirmation-status span { margin-left: 5px; }
                .banner-item { display: flex; align-items: center; margin-bottom: 10px; gap: 10px; }
                .banner-item input[type="file"] { flex-grow: 1; }
                .header-actions { display: flex; justify-content: flex-end; padding-top: 10px; }
                .header-actions button { margin-left: 10px; background-color: #264D59; color: white; border-radius: 5px; padding: 8px 15px; border: none; cursor: pointer; }
                .header-actions button:hover { background-color: #3e7b8c; }
                .banner-item{display:block; gap:2px}
            `}</style>

            <div className="container">
                <div className="header-actions">
                    <button onClick={logout}>Logout</button>
                </div>
                <h1>Admin Panel</h1>

                {/* --- 1. Website Customization --- */}
                <div className="form-section">
                    <h2>Website Customization</h2>
                    <div className="form-group">
                        <label htmlFor="header-title">User Panel Header Title:</label>
                        <input type="text" id="header-title" placeholder="Enter title (any language)" value={settings.headerTitle || ''} onChange={e => handleSettingsChange('headerTitle', e.target.value)} />
                    </div>

                    {/* Company Logo */}
                    <div className="form-group">
                        <label htmlFor="company-logo-upload">Company Logo:</label>
                        {(settings.companyLogo || settings.companyLogoFile) && <img src={renderFilePreview(settings.companyLogoFile, settings.companyLogo)} alt="Logo Preview" style={{ maxWidth: '100px', display: 'block', marginBottom: '10px' }} />}
                        <input type="file" id="company-logo-upload" accept="image/*" onChange={e => handleSettingsChange('companyLogoFile', e.target.files[0])} />
                    </div>

                    {/* Delivery Vehicle Image */}
                    <div className="form-group">
                        <label htmlFor="delivery-image-upload">Delivery Vehicle Image:</label>
                        {(settings.deliveryImage || settings.deliveryImageFile) && <img src={renderFilePreview(settings.deliveryImageFile, settings.deliveryImage)} alt="Delivery Preview" style={{ maxWidth: '150px', display: 'block', marginBottom: '10px' }} />}
                        <input type="file" id="delivery-image-upload" accept="image/*" onChange={e => handleSettingsChange('deliveryImageFile', e.target.files[0])} />
                    </div>

                    {/* Banner Section */}
                    <div className="form-section">
                        <h2>Homepage Banners (Max 5)</h2>
                        <div id="banner-uploads-container">
                            {(settings.banners || []).map((banner, index) => {
                                const imgSrc = renderBannerImage(banner);
                                return (
                                    <div className="banner-item" key={index}>
                                        {!!imgSrc && <img src={imgSrc} alt={`Banner ${index + 1}`} style={{ width: '100px', height: '50px', objectFit: 'cover' }} />}
                                        <input type="file" accept="image/*" onChange={e => handleBannerFileChange(index, e.target.files[0])} />
                                        <button type="button" className="delete-btn" onClick={() => deleteBanner(index)}>Delete</button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="form-actions">
                            <button type="button" onClick={addBannerInput}>Add More Banners</button>
                        </div>
                    </div>
                </div>

                {/* --- 2. Precious Metal Items (Mobiles) --- */}
                <div id="admin-forms-container" className="form-section">
                    <h2>Precious Metal Items</h2>
                    {preciousItems.map((item, index) => (
                        <div className="form-section" key={item.id || index}>
                            <div className="form-actions" style={{ position: 'absolute', top: '10px', right: '10px' }}>
                                <button className="delete-btn" onClick={() => deleteProduct(item.id, index, 'precious')}>Delete</button>
                            </div>
                            <h3>Precious Metal Item Details {index + 1}</h3>
                            <div className="form-group"><label>Item Name:</label><input type="text" value={item.model || ''} onChange={e => handleProductChange(index, 'model', e.target.value, 'precious')} /></div>

                            <div className="form-group"><label>Image (1MB - 100MB):</label>{(item.image || item.imageFile) && <img src={renderFilePreview(item.imageFile, item.image)} alt="Preview" style={{ maxWidth: '100px', display: 'block', marginBottom: '10px' }} />}{item.imageFile ? <span style={{ color: 'blue' }}>New file selected.</span> : null}<input type="file" accept="image/*" onChange={e => handleProductChange(index, 'imageFile', e.target.files[0], 'precious')} /></div>

                            <div className="form-group"><label>NetPay QR Code (1MB - 50MB):</label>{(item.netpayQrCode || item.netpayQrCodeFile) && <img src={renderFilePreview(item.netpayQrCodeFile, item.netpayQrCode)} alt="QR Preview" style={{ maxWidth: '100px', display: 'block', marginBottom: '10px' }} />}{item.netpayQrCodeFile ? <span style={{ color: 'blue' }}>New file selected.</span> : null}<input type="file" accept="image/*" onChange={e => handleProductChange(index, 'netpayQrCodeFile', e.target.files[0], 'precious')} /></div>

                            <div className="form-group"><label>Original Price (INR):</label><input type="number" value={item.price || ''} onChange={e => handleProductChange(index, 'price', e.target.value, 'precious')} /></div>
                            <div className="form-group"><label>Market Price (INR):</label><input type="number" value={item.bookingAmount || ''} onChange={e => handleProductChange(index, 'bookingAmount', e.target.value, 'precious')} /></div>
                            <div className="form-group"><label>Netpay Amount (INR):</label><input type="number" value={item.netpayPrice || ''} onChange={e => handleProductChange(index, 'netpayPrice', e.target.value, 'precious')} /></div>
                            <div className="form-group"><label>Offer Percentage (%):</label><input type="number" min="0" max="100" value={item.offer || ''} onChange={e => handleProductChange(index, 'offer', e.target.value, 'precious')} /></div>
                            <div className="form-group"><label>Offer End Time (HH:MM):</label><input type="time" value={item.offerTime || ''} onChange={e => handleProductChange(index, 'offerTime', e.target.value, 'precious')} /></div>
                            <div className="form-group"><label>Item Full Details:</label><textarea rows="5" value={item.fullSpecs || ''} onChange={e => handleProductChange(index, 'fullSpecs', e.target.value, 'precious')}></textarea></div>
                        </div>
                    ))}
                    <div className="form-actions">
                        <button onClick={() => addMoreProduct('precious')}>Add More Precious Metal Items</button>
                    </div>
                </div>

                {/* --- 3. Other Items (Home Appliances) --- */}
                <div id="home-appliances-forms-container" className="form-section">
                    <h2>Other Items Details</h2>
                    {otherItems.map((item, index) => (
                        <div className="form-section" key={item.id || index}>
                            <div className="form-actions" style={{ position: 'absolute', top: '10px', right: '10px' }}>
                                <button className="delete-btn" onClick={() => deleteProduct(item.id, index, 'other')}>Delete</button>
                            </div>
                            <h3>Other Item Details {index + 1}</h3>
                            <div className="form-group"><label>Item Name:</label><input type="text" value={item.model || ''} onChange={e => handleProductChange(index, 'model', e.target.value, 'other')} /></div>

                            <div className="form-group"><label>Image (1MB - 100MB):</label>{(item.image || item.imageFile) && <img src={renderFilePreview(item.imageFile, item.image)} alt="Preview" style={{ maxWidth: '100px', display: 'block', marginBottom: '10px' }} />}{item.imageFile ? <span style={{ color: 'blue' }}>New file selected.</span> : null}<input type="file" accept="image/*" onChange={e => handleProductChange(index, 'imageFile', e.target.files[0], 'other')} /></div>

                            <div className="form-group"><label>NetPay QR Code (1MB - 50MB):</label>{(item.netpayQrCode || item.netpayQrCodeFile) && <img src={renderFilePreview(item.netpayQrCodeFile, item.netpayQrCode)} alt="QR Preview" style={{ maxWidth: '100px', display: 'block', marginBottom: '10px' }} />}{item.netpayQrCodeFile ? <span style={{ color: 'blue' }}>New file selected.</span> : null}<input type="file" accept="image/*" onChange={e => handleProductChange(index, 'netpayQrCodeFile', e.target.files[0], 'other')} /></div>

                            <div className="form-group"><label>Original Price (INR):</label><input type="number" value={item.price || ''} onChange={e => handleProductChange(index, 'price', e.target.value, 'other')} /></div>
                            <div className="form-group"><label>Market Price (INR):</label><input type="number" value={item.bookingAmount || ''} onChange={e => handleProductChange(index, 'bookingAmount', e.target.value, 'other')} /></div>
                            <div className="form-group"><label>Netpay Amount (INR):</label><input type="number" value={item.netpayPrice || ''} onChange={e => handleProductChange(index, 'netpayPrice', e.target.value, 'other')} /></div>
                            <div className="form-group"><label>Offer Percentage (%):</label><input type="number" min="0" max="100" value={item.offer || ''} onChange={e => handleProductChange(index, 'offer', e.target.value, 'other')} /></div>
                            <div className="form-group"><label>Offer End Time (HH:MM):</label><input type="time" value={item.offerTime || ''} onChange={e => handleProductChange(index, 'offerTime', e.target.value, 'other')} /></div>
                            <div className="form-group"><label>Item Full Details:</label><textarea rows="5" value={item.fullSpecs || ''} onChange={e => handleProductChange(index, 'fullSpecs', e.target.value, 'other')}></textarea></div>
                        </div>
                    ))}
                    <div className="form-actions">
                        <button onClick={() => addMoreProduct('other')}>Add More Other Items</button>
                    </div>
                </div>

                {/* --- 4. User Sales Data --- */}
                <div className="data-display form-section">
                    <h2>Netpay Sales / Orders</h2>
                    {netpaySales.length === 0 ? (
                        <p>No netpay sales or no pending/confirmed orders.</p>
                    ) : (
                        <ul>
                            {netpaySales.map((sale) => (
                                <li key={sale.id}>
                                    <strong>Item:</strong> {sale.model}<br />
                                    <strong>User:</strong> {sale.userName}<br />
                                    <strong>Mobile:</strong>{sale.mobile}<br />
                                    <strong>Address:</strong>{sale.address}<br />
                                    <strong>Amount:</strong> INR {sale.amount}<br />
                                    {sale.screenshot && (
                                        <>
                                            <strong>Payment Screenshot:</strong>
                                            <img src={sale.screenshot} alt="Payment Proof" className="user-screenshot" />
                                        </>
                                    )}
                                    {sale.deliveryStatus === 'Confirmed' && sale.deliveryDate ? (
                                        <div className="confirmation-status">
                                            <span>✅ Confirmed. Est. Delivery: {new Date(sale.deliveryDate).toDateString()}</span>
                                        </div>
                                    ) : (
                                        <button className="confirm-btn" onClick={() => confirmNetpayDelivery(sale.id)}>Confirm Delivery</button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* --- 5. User SMS and Reply --- */}
                <div className="data-display form-section">
                    <h2>User Communication</h2>

                    <div className="form-group">
                        <label>Latest User SMS:</label>
                        <textarea
                            rows="3"
                            readOnly
                            value={latestUserMessage?.content || 'No messages from users.'}
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Admin Reply SMS:</label>
                        <textarea
                            rows="3"
                            value={adminReplyContent}
                            onChange={e => setAdminReplyContent(e.target.value)}
                            placeholder="Type your reply here..."
                        ></textarea>
                    </div>

                    <div className="form-actions">
                        <button onClick={sendSmsToUser}>Send Reply to User</button>
                    </div>
                </div>


                {/* --- Main Save Button --- */}
                <div className="main-buttons">
                    <button onClick={saveAllChanges}>SAVE ALL CHANGES TO WEBSITE</button>
                </div>
            </div>
        </>
    );
};

// --- AUTH GATE COMPONENT ---
// This component checks the auth state and renders either the login form or the admin panel.
const AuthGate = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '100px', fontSize: '1.5em' }}>Checking Authentication Status...</div>;
    }

    if (!isAuthenticated) {
        return <AdminLoginForm />;
    }

    // If authenticated, wrap the content in the AdminDataProvider
    return (
        <AdminDataProvider>
            <AdminContent />
        </AdminDataProvider>
    );
}

// --- WRAPPER COMPONENT (Entry Point) ---
const Admin = () => {
    return (
        <AuthProvider>
            <AuthGate />
        </AuthProvider>
    );
};

export default Admin;