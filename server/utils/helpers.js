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
    const mailOptions = {
        from: SENDER_EMAIL,
        to: ADMIN_EMAIL,
        subject: `🛒 New Order Received from ${orderData.user_name || "Unknown User"}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
        <h2 style="color: #007BFF; border-bottom: 2px solid #eee; padding-bottom: 8px;">
          🧾 New Order Notification
        </h2>  
        <p style="font-size: 15px;">A new customer has placed an order through your website.</p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr style="background-color: #f8f8f8;">
            <td style="padding: 8px; border: 1px solid #ddd; width: 35%; font-weight: bold;">User ID:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${orderData.user_id}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Product Name:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${model}</td>
          </tr>
          <tr style="background-color: #f8f8f8;">
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Amount:</td>
            <td style="padding: 8px; border: 1px solid #ddd; color: #28a745;">₹${orderData.amount?.toFixed(2) || "0.00"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Delivery Status:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${orderData.delivery_status || "Pending"}</td>
          </tr>
        </table>

        <h3 style="margin-top: 25px; color: #333;">Customer Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f8f8f8;">
            <td style="padding: 8px; border: 1px solid #ddd; width: 35%;">Customer Name:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${orderData.user_name || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Mobile:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${orderData.mobile || "N/A"}</td>
          </tr>
          <tr style="background-color: #f8f8f8;">
            <td style="padding: 8px; border: 1px solid #ddd;">Delivery Address:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${orderData.address || "N/A"}</td>
          </tr>
        </table>

        ${orderData.screenshot_url
                ? `
              <p style="margin-top: 25px; text-align: center;">
                <a href="${orderData.screenshot_url}" 
                   style="background-color: #FFC107; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  VIEW PAYMENT SCREENSHOT 📸
                </a>
              </p>`
                : ""
            }

        <p style="margin-top: 25px; text-align: center; font-size: 12px; color: #777;">
          This is an automated message from your order system. Please check your admin panel for more details.
        </p>
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
