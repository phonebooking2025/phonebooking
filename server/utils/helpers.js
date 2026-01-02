import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import cloudinary from "../config/cloudinary.js";

const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECURE_JWT_SECRET";
const ADMIN_EMAIL = "phonebooking2025@gmail.com";
const SENDER_EMAIL = process.env.GMAIL_APP_USER;
const SENDER_PASS = process.env.GMAIL_APP_PASS;

// ============ TOKEN FUNCTIONS ============
export const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user?.is_admin)
    return res.status(403).json({ message: "Admin access required" });
  next();
};

// ============ CLOUDINARY UPLOAD ============
export const uploadToCloudinary = (fileBuffer, folder, resourceType = "image") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    ).end(fileBuffer);
  });
};

// ============ EMAIL FUNCTIONS ============
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SENDER_EMAIL,
    pass: SENDER_PASS,
  },
});

export const sendAdminNotificationEmail = async (orderData, model) => {
  // helper to mask aadhar (show last 4 digits only)
  const maskAadhar = (a) => {
    if (!a) return 'N/A';
    const s = `${a}`.trim();
    if (s.length <= 4) return '****';
    return '****' + s.slice(-4);
  };

  const mailOptions = {
    from: SENDER_EMAIL,
    to: ADMIN_EMAIL,
    subject: `🚚 New Order Received — ${orderData.user_name || 'Unknown'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width:700px; margin:auto; border-radius:10px; overflow:hidden; box-shadow:0 6px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(90deg,#0ea5e9,#7c3aed); padding:20px; color:#fff;">
          <h2 style="margin:0; font-size:20px;">New Order Notification</h2>
          <div style="opacity:0.9; font-size:13px; margin-top:6px;">Order for <strong>${model || 'N/A'}</strong> by <strong>${orderData.user_name || 'Unknown'}</strong></div>
        </div>

        <div style="background:#fff; padding:18px 20px;">
          <h3 style="margin:0 0 10px 0; font-size:16px; color:#111">Order Summary</h3>
          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr>
              <td style="padding:8px; width:40%; color:#555; font-weight:600;">Order ID</td>
              <td style="padding:8px; color:#222">${orderData.id || orderData.order_id || 'N/A'}</td>
            </tr>
            <tr style="background:#f7f7fb;">
              <td style="padding:8px; color:#555; font-weight:600">Product</td>
              <td style="padding:8px; color:#222">${model || orderData.product_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:8px; color:#555; font-weight:600">Amount</td>
              <td style="padding:8px; color:#0a7a3b; font-weight:700">₹${(Number(orderData.amount) || 0).toFixed(2)}</td>
            </tr>
            <tr style="background:#f7f7fb;">
              <td style="padding:8px; color:#555; font-weight:600">Payment Method</td>
              <td style="padding:8px; color:#222">${orderData.payment_method || orderData.emi_type || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:8px; color:#555; font-weight:600">EMI Plan</td>
              <td style="padding:8px; color:#222">${orderData.emi_months ? orderData.emi_months + ' months' : 'N/A'}${orderData.down_payment ? ' • Down: ₹' + Number(orderData.down_payment).toFixed(2) : ''}</td>
            </tr>
            <tr style="background:#f7f7fb;">
              <td style="padding:8px; color:#555; font-weight:600">Delivery Status</td>
              <td style="padding:8px; color:#222">${orderData.delivery_status || 'Pending'}</td>
            </tr>
          </table>

          <h3 style="margin:8px 0 10px 0; font-size:16px; color:#111">Customer Details</h3>
          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr style="background:#f7f7fb;">
              <td style="padding:8px; color:#555; font-weight:600; width:40%">Name</td>
              <td style="padding:8px; color:#222">${orderData.user_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:8px; color:#555; font-weight:600">Phone</td>
              <td style="padding:8px; color:#222">${orderData.mobile || 'N/A'}</td>
            </tr>
            <tr style="background:#f7f7fb;">
              <td style="padding:8px; color:#555; font-weight:600">Address</td>
              <td style="padding:8px; color:#222">${orderData.address || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:8px; color:#555; font-weight:600">Aadhar (masked)</td>
              <td style="padding:8px; color:#222">${maskAadhar(orderData.aadhar || orderData.aadhar_number)}</td>
            </tr>
            <tr style="background:#f7f7fb;">
              <td style="padding:8px; color:#555; font-weight:600">Bank Details</td>
              <td style="padding:8px; color:#222">${orderData.bank_details || 'N/A'}</td>
            </tr>
          </table>

          ${orderData.user_photo_url || orderData.user_photo ? `
            <div style="text-align:center; margin:8px 0 0 0;">
              <img src="${orderData.user_photo_url || orderData.user_photo}" alt="User Photo" style="max-width:140px; border-radius:8px; border:1px solid #eee;" />
            </div>
          ` : ''}

          ${orderData.screenshot_url ? `
            <div style="text-align:center; margin-top:14px;">
              <a href="${orderData.screenshot_url}" style="display:inline-block; padding:10px 18px; background:#f59e0b; color:#111; border-radius:8px; text-decoration:none; font-weight:700;">View Payment Screenshot</a>
            </div>
          ` : ''}

          <p style="margin-top:18px; font-size:12px; color:#666; text-align:center;">This is an automated order notification. Review orders in the admin panel for full details and follow up.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Admin notification email sent successfully");
  } catch (error) {
    console.error("❌ Failed to send admin notification email:", error.message);
  }
};
