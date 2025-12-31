import React, { useState } from "react";
import { useAdminData, AdminDataProvider } from "../context/AdminContext";
import { useAuth, AuthProvider } from "../context/AuthContext";
import Loading from "./Loading"; // <- new Loading component
import { useNavigate } from "react-router-dom";
import "./Admin.css";
import { FiGrid, FiHome, FiLogOut, FiSave, FiSend, FiSettings } from 'react-icons/fi'

// --- ADMIN LOGIN FORM COMPONENT ---
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
        <div
            style={{
                maxWidth: "400px",
                margin: "100px auto",
                padding: "40px",
                backgroundColor: "#fff",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
        >
            <p
                className="home"
                style={{
                    fontSize: "12px",
                    padding: "4px 6px",
                    width: "80px",
                    textAlign: "center",
                    backgroundColor: "#28a745",
                    color: "white",
                    borderRadius: "5px",
                    cursor: "pointer",
                }}
                onClick={() => navigate("/")}
            >
                Home Page
            </p>
            <h2 style={{ textAlign: "center", color: "#264D59" }}>Admin Login</h2>
            <form onSubmit={handleSubmit}>
                {loginError && (
                    <p style={{ color: "red", textAlign: "center" }}>{loginError}</p>
                )}

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>
                        Mobile:
                    </label>
                    <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ccc",
                            borderRadius: "5px",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>
                        Password:
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ccc",
                            borderRadius: "5px",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#264D59",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                    }}
                >
                    {loading ? "Logging In..." : "Login"}
                </button>
            </form>
        </div>
    );
};

// --- ADMIN CONTENT COMPONENT ---
const AdminContent = () => {
    const { logout } = useAuth();

    const navigate = useNavigate();


    const [showFloatingSave, setShowFloatingSave] = useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 1500) {
                setShowFloatingSave(true);
            } else {
                setShowFloatingSave(false);
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Consume state and actions from the context
    const {
        preciousItems,
        otherItems,
        netpaySales,
        settings,
        loading,
        error,
        setAdminSmsReply,
        handleProductChange,
        addMoreProduct,
        deleteProduct,
        handleSettingsChange,
        handleBannerFileChange,
        addBannerInput,
        deleteBanner,
        updateWhatsAppNumber,
        confirmNetpayDelivery,
        sendSmsToUser,
        saveAllChanges,
        latestUserMessage,
        adminReplyContent,
        setAdminReplyContent,
        handleAdVideoFileChange
    } = useAdminData();

    const renderBannerImage = (banner) => {
        if (!banner) return null;
        if (banner.newFile) return URL.createObjectURL(banner.newFile);
        if (banner.path) return banner.path;
        return null;
    };

    const renderFilePreview = (file, url) =>
        file ? URL.createObjectURL(file) : url;

    if (loading) return <Loading />; // <- animated loading for 2s

    if (error)
        return (
            <div style={{ textAlign: "center", padding: "50px", color: "red" }}>
                ⚠️ Data Error: {error}
            </div>
        );

    return (
        <>
            <div className="container">
                <div className="header-actions">
                    <button className="btn btn-home" onClick={() => navigate("/dashboard")}>
                        <FiGrid className="icon-left" />
                        <span>Dashboard</span>
                    </button>

                    <button className="btn btn-logout" onClick={logout}>
                        <span>Logout</span>
                        <FiLogOut className="icon-right" />
                    </button>
                </div>

                <h1 style={{ color: "#2D9966", fontSize: "22px", fontWeight: "700" }}>Admin Panel</h1>

                {/* --- 1. Website Customization --- */}
                <div className="form-section">
                    <h2 className="section-title">
                        <FiSettings size={22} />
                        <span> Website Customization</span>
                    </h2>

                    <div className="form-container grid grid-cols-3 max-sm:grid-cols-1">
                        <div className="form-group">
                            <label htmlFor="header-title">User Panel Header Title:</label>
                            <input
                                type="text"
                                id="header-title"
                                placeholder="Enter title (any language)"
                                value={settings.headerTitle || ""}
                                onChange={(e) =>
                                    handleSettingsChange("headerTitle", e.target.value)
                                }
                            />
                        </div>

                        {/* Company Logo */}
                        <div className="form-group">
                            <label htmlFor="company-logo-upload">Company Logo:</label>
                            {(settings.companyLogo || settings.companyLogoFile) && (
                                <img
                                    src={renderFilePreview(
                                        settings.companyLogoFile,
                                        settings.companyLogo
                                    )}
                                    alt="Logo Preview"
                                    style={{
                                        maxWidth: "100px",
                                        display: "block",
                                        marginBottom: "10px",
                                    }}
                                />
                            )}
                            <input
                                type="file"
                                id="company-logo-upload"
                                accept="image/*"
                                onChange={(e) =>
                                    handleSettingsChange("companyLogoFile", e.target.files[0])
                                }
                            />
                        </div>

                        {/* Delivery Vehicle Image */}
                        <div className="form-group">
                            <label htmlFor="delivery-image-upload">
                                Delivery Vehicle Image:
                            </label>
                            {(settings.deliveryImage || settings.deliveryImageFile) && (
                                <img
                                    src={renderFilePreview(
                                        settings.deliveryImageFile,
                                        settings.deliveryImage
                                    )}
                                    alt="Delivery Preview"
                                    style={{
                                        maxWidth: "150px",
                                        display: "block",
                                        marginBottom: "10px",
                                    }}
                                />
                            )}
                            <input
                                type="file"
                                id="delivery-image-upload"
                                accept="image/*"
                                onChange={(e) =>
                                    handleSettingsChange("deliveryImageFile", e.target.files[0])
                                }
                            />
                        </div>

                        {/* WhatsApp Number (Admin editable) */}
                        <div className="form-group">
                            <label htmlFor="whatsapp-number">WhatsApp Number (for client chat):</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="whatsapp-contain">
                                <input
                                    type="text"
                                    id="whatsapp-number"
                                    placeholder="e.g. 919876543210"
                                    value={settings.whatsappNumber || ""}
                                    onChange={(e) => handleSettingsChange('whatsappNumber', e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="btn-save-whatsapp"
                                    onClick={() => updateWhatsAppNumber(settings.whatsappNumber)}
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Banner Section */}
                    <div className="form-section">
                        <h2 className="section-title">Homepage Banners (Max 5)</h2>

                        <div id="banner-uploads-container">
                            {(settings.banners || []).map((banner, index) => {
                                const imgSrc = renderBannerImage(banner);

                                return (
                                    <div className="banner-item" key={index}>
                                        {/* Preview */}
                                        <div className="banner-preview">
                                            {imgSrc ? (
                                                <img
                                                    src={imgSrc}
                                                    alt={`Banner ${index + 1}`}
                                                />
                                            ) : (
                                                <span>No Image</span>
                                            )}
                                        </div>

                                        {/* Upload */}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                handleBannerFileChange(index, e.target.files[0])
                                            }
                                        />

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            className="delete-btn"
                                            onClick={() => deleteBanner(index)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="banner-button"
                                onClick={addBannerInput}
                                disabled={settings.banners.length >= 20}
                                title={settings.banners.length >= 20 ? "Maximum 20 banners allowed" : "Add a new banner"}
                            >
                                Add More Banners {settings.banners.length >= 20 && "(Max reached)"}
                            </button>
                        </div>
                    </div>

                </div>



                {/* --- Advertisement Video Upload --- */}
                <div className="form-section ad-video-admin-section">
                    <h2 className="section-title"> 🎬 Advertisement Video </h2>
                    <div className="ad-video-upload-row">
                        <label className="ad-video-label">
                            Upload Advertisement Video (MP4):
                        </label>
                        <input
                            type="file"
                            accept="video/*"
                            className="ad-video-input"
                            onChange={(e) => handleAdVideoFileChange(e.target.files[0])}
                        />

                        <span className="ad-video-note">
                            (Video upload less than 1 or 2 minute)
                        </span>
                    </div>

                    {/* --- Advertisement Video Display --- */}
                    {(settings.advertisementVideoUrl || settings.advertisementVideoFile) && (
                        <div className="ad-video-display-section">
                            <h3 className="ad-video-display-title">📹 Current Advertisement Video</h3>

                            {settings.advertisementVideoFile && (
                                <video
                                    controls
                                    className="ad-video-preview"
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "400px",
                                        borderRadius: "8px",
                                        marginBottom: "15px",
                                        border: "2px solid #1D4ED8"
                                    }}
                                >
                                    <source src={URL.createObjectURL(settings.advertisementVideoFile)} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            )}

                            {settings.advertisementVideoUrl && !settings.advertisementVideoFile && (
                                <video
                                    controls
                                    className="ad-video-preview"
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "400px",
                                        borderRadius: "8px",
                                        marginBottom: "15px",
                                        border: "2px solid #1D4ED8"
                                    }}
                                >
                                    <source src={settings.advertisementVideoUrl} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            )}

                            <div className="ad-video-info">
                                <p className="ad-video-url-label"><strong>Video URL/Name:</strong></p>
                                <p className="ad-video-url-display">
                                    {settings.advertisementVideoFile
                                        ? `📄 ${settings.advertisementVideoFile.name}`
                                        : settings.advertisementVideoUrl
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>


                {/* --- Precious Metal Items --- */}
                <div id="admin-forms-container" className="form-section precious-section">
                    <h2>Precious Metal Items</h2>

                    {preciousItems.map((item, index) => (
                        <div className="form-section precious-card" key={item.id || index}>
                            <div className="form-actions top-actions">
                                <button
                                    className="delete-btn"
                                    onClick={() => deleteProduct(item.id, index, "precious")}
                                >
                                    Delete
                                </button>
                            </div>

                            <h3>Precious Metal Item {index + 1}</h3>

                            <div className="form-container">
                                <div className="form-group">
                                    <label>Item Name</label>
                                    <input
                                        type="text"
                                        value={item.model || ""}
                                        onChange={(e) =>
                                            handleProductChange(index, "model", e.target.value, "precious")
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Original Price (INR)</label>
                                    <input
                                        type="number"
                                        value={item.price || ""}
                                        onChange={(e) =>
                                            handleProductChange(index, "price", e.target.value, "precious")
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Market Price (INR)</label>
                                    <input
                                        type="number"
                                        value={item.bookingAmount || ""}
                                        onChange={(e) =>
                                            handleProductChange(index, "bookingAmount", e.target.value, "precious")
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Netpay Amount (INR)</label>
                                    <input
                                        type="number"
                                        value={item.netpayPrice || ""}
                                        onChange={(e) =>
                                            handleProductChange(index, "netpayPrice", e.target.value, "precious")
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>EMI Plans (months, comma separated)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 3,6,9"
                                        value={item.emiMonths || ""}
                                        onChange={(e) => handleProductChange(index, "emiMonths", e.target.value, "precious")}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Down Payment Amount (INR)</label>
                                    <input
                                        type="number"
                                        value={item.downPaymentAmount || ""}
                                        onChange={(e) => handleProductChange(index, "downPaymentAmount", e.target.value, "precious")}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Offer (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={item.offer || ""}
                                        onChange={(e) =>
                                            handleProductChange(index, "offer", e.target.value, "precious")
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Offer End Time</label>
                                    <input
                                        type="time"
                                        value={item.offerTime || ""}
                                        onChange={(e) =>
                                            handleProductChange(index, "offerTime", e.target.value, "precious")
                                        }
                                    />
                                </div>
                            </div>

                            {/* Images */}
                            <div className="form-container">
                                <div className="form-group">
                                    <label>Item Image</label>
                                    {(item.image || item.imageFile) && (
                                        <img
                                            className="thumb"
                                            src={renderFilePreview(item.imageFile, item.image)}
                                            alt="Preview"
                                        />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleProductChange(index, "imageFile", e.target.files[0], "precious")
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>NetPay QR Code</label>
                                    {(item.netpayQrCode || item.netpayQrCodeFile) && (
                                        <img
                                            className="thumb"
                                            src={renderFilePreview(item.netpayQrCodeFile, item.netpayQrCode)}
                                            alt="QR"
                                        />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleProductChange(
                                                index,
                                                "netpayQrCodeFile",
                                                e.target.files[0],
                                                "precious"
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-group fullwidth">
                                <label>Item Full Details</label>
                                <textarea
                                    rows="4"
                                    value={item.fullSpecs || ""}
                                    onChange={(e) =>
                                        handleProductChange(index, "fullSpecs", e.target.value, "precious")
                                    }
                                />
                            </div>
                        </div>
                    ))}

                    <div className="form-actions">
                        <button className="btn-add-precious" onClick={() => addMoreProduct("precious")}>
                            + Add More Precious Metal Items
                        </button>
                    </div>

                </div>

                {/* --- Other Items (Home Appliances) --- */}
                <div
                    id="home-appliances-forms-container"
                    className="form-section other-section"
                >
                    <h2>Other Items Details</h2>

                    {otherItems.map((item, index) => (
                        <div className="form-section other-card" key={item.id || index}>
                            <div className="form-actions top-actions">
                                <button
                                    className="delete-btn"
                                    onClick={() => deleteProduct(item.id, index, "other")}
                                >
                                    Delete
                                </button>
                            </div>

                            <h3>Other Item {index + 1}</h3>

                            {/* Grid Fields */}
                            <div className="form-container">
                                <div className="form-group">
                                    <label>Item Name</label>
                                    <input
                                        type="text"
                                        value={item.model || ""}
                                        onChange={(e) =>
                                            handleProductChange(index, "model", e.target.value, "other")
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Original Price (INR)</label>
                                    <input
                                        type="number"
                                        value={item.price || ""}
                                        onChange={(e) =>
                                            handleProductChange(index, "price", e.target.value, "other")
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Market Price (INR)</label>
                                    <input
                                        type="number"
                                        value={item.bookingAmount || ""}
                                        onChange={(e) =>
                                            handleProductChange(
                                                index,
                                                "bookingAmount",
                                                e.target.value,
                                                "other"
                                            )
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Netpay Amount (INR)</label>
                                    <input
                                        type="number"
                                        value={item.netpayPrice || ""}
                                        onChange={(e) =>
                                            handleProductChange(
                                                index,
                                                "netpayPrice",
                                                e.target.value,
                                                "other"
                                            )
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>EMI Plans (months, comma separated)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 3,6,9"
                                        value={item.emiMonths || ""}
                                        onChange={(e) => handleProductChange(index, "emiMonths", e.target.value, "other")}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Down Payment Amount (INR)</label>
                                    <input
                                        type="number"
                                        value={item.downPaymentAmount || ""}
                                        onChange={(e) => handleProductChange(index, "downPaymentAmount", e.target.value, "other")}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Offer (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={item.offer || ""}
                                        onChange={(e) =>
                                            handleProductChange(index, "offer", e.target.value, "other")
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Offer End Time</label>
                                    <input
                                        type="time"
                                        value={item.offerTime || ""}
                                        onChange={(e) =>
                                            handleProductChange(
                                                index,
                                                "offerTime",
                                                e.target.value,
                                                "other"
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            {/* Images */}
                            <div className="form-container">
                                <div className="form-group">
                                    <label>Item Image</label>
                                    {(item.image || item.imageFile) && (
                                        <img
                                            className="thumb"
                                            src={renderFilePreview(item.imageFile, item.image)}
                                            alt="Preview"
                                        />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleProductChange(
                                                index,
                                                "imageFile",
                                                e.target.files[0],
                                                "other"
                                            )
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>NetPay QR Code</label>
                                    {(item.netpayQrCode || item.netpayQrCodeFile) && (
                                        <img
                                            className="thumb"
                                            src={renderFilePreview(
                                                item.netpayQrCodeFile,
                                                item.netpayQrCode
                                            )}
                                            alt="QR"
                                        />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleProductChange(
                                                index,
                                                "netpayQrCodeFile",
                                                e.target.files[0],
                                                "other"
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-group fullwidth">
                                <label>Item Full Details</label>
                                <textarea
                                    rows="4"
                                    value={item.fullSpecs || ""}
                                    onChange={(e) =>
                                        handleProductChange(
                                            index,
                                            "fullSpecs",
                                            e.target.value,
                                            "other"
                                        )
                                    }
                                />
                            </div>
                        </div>
                    ))}

                    <div className="form-actions">
                        <button
                            className="btn-add-other"
                            onClick={() => addMoreProduct("other")}
                        >
                            + Add More Other Items
                        </button>
                    </div>
                </div>


                {/* --- User Sales Data --- */}
                <div className="form-section sales-section">
                    <h2>Netpay Sales / Orders</h2>

                    {netpaySales.length === 0 ? (
                        <p className="muted">No netpay sales or pending / confirmed orders.</p>
                    ) : (
                        <div className="sales-grid">
                            {netpaySales.map((sale) => (
                                <div className="sales-card" key={sale.id}>
                                    <div className="sales-header">
                                        <h3>{sale.model}</h3>
                                        <span className="amount-badge">₹ {sale.amount}</span>
                                    </div>

                                    <div className="sales-info">
                                        <p><strong>User:</strong> {sale.userName}</p>
                                        <p><strong>Mobile:</strong> {sale.mobile}</p>
                                        <p><strong>Address:</strong> {sale.address}</p>
                                    </div>

                                    {sale.screenshot && (
                                        <div className="sales-image">
                                            <strong>Payment Screenshot</strong>
                                            <img
                                                src={sale.screenshot}
                                                alt="Payment Proof"
                                                className="user-screenshot"
                                            />
                                        </div>
                                    )}

                                    <div className="sales-actions">
                                        {sale.deliveryStatus === "Confirmed" && sale.deliveryDate ? (
                                            <div className="confirmation-status">
                                                ✅ Confirmed <br />
                                                <span className="muted">
                                                    Est. Delivery:{" "}
                                                    {new Date(sale.deliveryDate).toDateString()}
                                                </span>
                                            </div>
                                        ) : (
                                            <button
                                                className="confirm-btn"
                                                onClick={() => confirmNetpayDelivery(sale.id)}
                                            >
                                                Confirm Delivery
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
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
                            value={latestUserMessage?.content || "No messages from users."}
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Admin Reply SMS:</label>
                        <textarea
                            rows="3"
                            value={adminReplyContent}
                            onChange={(e) => setAdminReplyContent(e.target.value)}
                            placeholder="Type your reply here..."
                        ></textarea>
                    </div>

                    <div className="form-actions">
                        <button className="btn-reply-user" onClick={sendSmsToUser} >
                            <FiSend className="btn-icon" />
                            Send Reply to User
                        </button>
                    </div>
                </div>

                <div className="main-buttons">
                    <button className="btn-save-all" onClick={saveAllChanges} >
                        <FiSave className="btn-icon" />
                        Save All Changes
                    </button>
                </div>
            </div>

            {showFloatingSave && (
                <button
                    className="floating-save-btn"
                    onClick={saveAllChanges}
                    title="Save All Changes"
                >
                    <FiSave size={20} />
                    Save
                </button>
            )}

        </>
    );
};

// --- AUTH GATE COMPONENT ---
// This component checks the auth state and renders either the login form or the admin panel.
const AuthGate = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "100px", fontSize: "1.5em" }}>
                Checking Authentication Status...
            </div>
        );
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
};

// --- WRAPPER COMPONENT (Entry Point) ---
const Admin = () => {
    return (
        <AuthProvider>
            <AuthGate />
        </AuthProvider>
    );
};

export default Admin;
