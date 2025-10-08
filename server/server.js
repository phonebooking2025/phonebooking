import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import cloudinary from "./config/cloudinary.js";
import nodemailer from 'nodemailer';

dotenv.config();



const ADMIN_EMAIL = 'phonebooking2025@gmail.com';
const SENDER_EMAIL = process.env.GMAIL_APP_USER;
const SENDER_PASS = process.env.GMAIL_APP_PASS;
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECURE_JWT_SECRET";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = express();


// Allowed Multiple Origins 
const allowedOrigins = ["http://localhost:5173", "https://phonebooking.in", "https://phonebooking-client.vercel.app"];
app.use(cors({ origin: allowedOrigins, credentials: true }))

app.use(express.json({ limit: "50mb" }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const dataUri = `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;
    cloudinary.uploader.upload(dataUri, { folder }, (err, result) => {
      if (err) return reject(err);
      resolve(result.secure_url);
    });
  });
};

const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user?.is_admin)
    return res.status(403).json({ message: "Admin access required" });
  next();
};

app.get("/", (req, res) => res.send({ status: "ok", message: "API running" }));

// EMail Function 
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SENDER_EMAIL,
    pass: SENDER_PASS,
  },
});


const sendAdminNotificationEmail = async (orderData, model) => {
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


app.post(
  "/api/admin/products",
  verifyToken,
  requireAdmin,
  upload.fields([
    { name: "imageFile", maxCount: 1 },
    { name: "netpayQrCodeFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        id,
        category,
        model,
        price,
        bookingAmount,
        netpayPrice,
        offer,
        offerTime,
        fullSpecs,
        image,
        netpayQrCode,
      } = req.body;

      if (!category || !model)
        return res.status(400).json({ message: "Category & model required" });

      let existing = null;
      if (id) {
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        existing = data || null;
      }

      let image_url = image || existing?.image_url || null;
      let netpay_qr_url = netpayQrCode || existing?.netpay_qr_url || null;

      if (req.files?.imageFile?.[0]) {
        try {
          image_url = await uploadToCloudinary(
            req.files.imageFile[0].buffer,
            "products"
          );
        } catch (err) { }
      }

      if (req.files?.netpayQrCodeFile?.[0]) {
        try {
          netpay_qr_url = await uploadToCloudinary(
            req.files.netpayQrCodeFile[0].buffer,
            "qr_codes"
          );
        } catch (err) { }
      }

      const productObj = {
        category,
        model,
        price: price ? parseFloat(price) : existing?.price || null,
        booking_amount: bookingAmount
          ? parseFloat(bookingAmount)
          : existing?.booking_amount || null,
        netpay_price: netpayPrice
          ? parseFloat(netpayPrice)
          : existing?.netpay_price || null,
        offer: offer ? parseInt(offer) : existing?.offer || null,
        offer_time: offerTime || existing?.offer_time || null,
        full_specs: fullSpecs || existing?.full_specs || null,
        image_url,
        netpay_qr_url,
      };

      if (id) productObj.id = id;

      const { data, error } = await supabase
        .from("products")
        .upsert(productObj, { onConflict: ["id"] })
        .select();
      if (error) throw error;

      res.json({ product: data[0] });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Product save failed", details: err.message });
    }
  }
);

app.get("/api/products/:category", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", req.params.category)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const mapped = data.map((p) => ({
      id: p.id,
      category: p.category,
      model: p.model,
      price: p.price,
      bookingAmount: p.booking_amount,
      netpayPrice: p.netpay_price,
      offer: p.offer,
      offerTime: p.offer_time,
      fullSpecs: p.full_specs,
      image: p.image_url,
      netpayQrCode: p.netpay_qr_url,
      createdAt: p.created_at,
    }));

    res.json(mapped);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Fetch products failed", details: err.message });
  }
});

app.delete(
  "/api/admin/products/:id",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", req.params.id);
      if (error) throw error;
      res.json({ message: "Product deleted" });
    } catch (err) {
      res.status(500).json({ message: "Delete failed", details: err.message });
    }
  }
);

app.post(
  "/api/orders/place",
  verifyToken,
  upload.single("screenshot"),
  async (req, res) => {
    try {
      const { product_name, product_id, amount, user_name, mobile, address } = req.body;
      const screenshotFile = req.file;
      if (!product_id || !amount || !screenshotFile) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const screenshot_url = await uploadToCloudinary(
        screenshotFile.buffer,
        "orders/screenshots"
      );

      const orderPayload = {
        user_id: req.user.id,
        product_id,
        amount: parseFloat(amount),
        user_name: user_name || null,
        mobile: mobile || null,
        address: address || null,
        screenshot_url,
        delivery_status: "Pending",
      };

      const { data, error } = await supabase
        .from("orders")
        .insert([orderPayload])
        .select();

      if (error) throw error;
      await sendAdminNotificationEmail(orderPayload, product_name);

      return res.status(201).json({ order: data[0] });
    } catch (err) {
      return res.status(500).json({
        message: "Place order failed",
        details: err.message,
      });
    }
  }
);

app.get("/api/admin/orders", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, address, product:product_id(model)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Fetch orders failed", details: err.message });
  }
});

app.get("/api/public/orders", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, address, product:product_id(model)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Fetch orders failed", details: err.message });
  }
});

app.put(
  "/api/admin/orders/:id/confirm",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 15);

      const { data, error } = await supabase
        .from("orders")
        .update({
          delivery_status: "Confirmed",
          delivery_date: deliveryDate.toISOString().split("T")[0],
        })
        .eq("id", req.params.id)
        .select();
      if (error) throw error;
      res.json({ order: data[0] });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Confirm order failed", details: err.message });
    }
  }
);

app.get("/api/user/sales/count", verifyToken, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from("orders")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", req.user.id)
      .eq("delivery_status", "Confirmed");
    if (error) throw error;
    res.json({ total_sales_count: count || 0 });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Fetch sales count failed", details: err.message });
  }
});

// Public API 
app.get("/api/count", async (req, res) => {
  try {
    const { count, error } = await supabase
      .from("orders")
      .select("id", { head: true, count: "exact" });
    if (error) throw error;
    res.json({ total_sales_count: count || 0 });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Fetch sales count failed", details: err.message });
  }
});

app.post(
  "/api/admin/settings",
  verifyToken,
  requireAdmin,
  upload.fields([
    { name: "companyLogoFile", maxCount: 1 },
    { name: "deliveryImageFile", maxCount: 1 },
    { name: "bannerFiles", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const companyLogoFile = req.files?.companyLogoFile?.[0];
      const deliveryImageFile = req.files?.deliveryImageFile?.[0];
      const bannerFiles = req.files?.bannerFiles || [];

      let { header_title, company_logo_url, delivery_image_url, banners } =
        req.body;

      const { data: existingSettings } = await supabase
        .from("settings")
        .select("*")
        .maybeSingle();

      company_logo_url = companyLogoFile
        ? await uploadToCloudinary(companyLogoFile.buffer, "settings/logo")
        : existingSettings?.company_logo_url || company_logo_url || null;

      delivery_image_url = deliveryImageFile
        ? await uploadToCloudinary(
          deliveryImageFile.buffer,
          "settings/delivery"
        )
        : existingSettings?.delivery_image_url || delivery_image_url || null;

      let bannerArray = existingSettings?.banners || [];

      for (const bf of bannerFiles) {
        const url = await uploadToCloudinary(bf.buffer, "settings/banners");
        bannerArray.push(url);
      }

      if (banners) {
        try {
          const oldBannersFromClient = JSON.parse(banners);
          const newBanners = bannerArray.filter(
            (url) => !oldBannersFromClient.includes(url)
          );
          bannerArray = [...oldBannersFromClient, ...newBanners];
        } catch { }
      }

      const settingsObj = {
        id: "00000000-0000-0000-0000-000000000001",
        header_title: header_title || existingSettings?.header_title || null,
        company_logo_url,
        delivery_image_url,
        banners: bannerArray,
      };

      const { data, error } = await supabase
        .from("settings")
        .upsert(settingsObj)
        .select();
      if (error) throw error;

      res.json({ settings: data[0] });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Save settings failed", details: err.message });
    }
  }
);

app.get("/api/settings", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .maybeSingle();
    if (error) throw error;
    res.json(
      data || {
        id: null,
        headerTitle: "",
        companyLogo: "",
        deliveryImage: "",
        banners: [],
      }
    );
  } catch (err) {
    res
      .status(500)
      .json({ message: "Fetch settings failed", details: err.message });
  }
});



app.post("/api/messages/send", verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "content required" });
    const { data, error } = await supabase
      .from("messages")
      .insert([{ user_id: req.user.id, content, sender_type: "user" }])
      .select();
    if (error) throw error;
    res.status(201).json({ message: data[0] });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Send message failed", details: err.message });
  }
});

app.get(
  "/api/admin/messages/latest",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_type", "user")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      res.json(data || { content: "No messages", user_id: null });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Fetch latest message failed", details: err.message });
    }
  }
);

app.post(
  "/api/admin/messages/reply/:user_id",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { content } = req.body;
      const user_id = req.params.user_id;

      if (!content || !user_id) {
        return res.status(400).json({ message: "content & user_id required" });
      }

      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            user_id,
            content,
            sender_type: "admin",
            is_read: false,
          },
        ])
        .select();

      if (error) throw error;

      console.log("Admin reply inserted:", data[0]);
      res.status(201).json({ reply: data[0] });
    } catch (err) {
      console.error("Reply failed:", err.message);
      res.status(500).json({ message: "Reply failed", details: err.message });
    }
  }
);

app.post("/api/send-sms", verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message content is required." });
    }
    const userId = req.user.id;

    const { error: insertError } = await supabase.from("messages").insert([
      {
        user_id: userId,
        content: message,
        sender_type: "user",
      },
    ]);

    if (insertError) {
      return res.status(500).json({
        message: "Failed to send message",
        details: insertError.message,
      });
    }

    const { data: adminMessages, error: fetchError } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .eq("sender_type", "admin")
      .order("created_at", { ascending: false })
      .limit(1);
    if (fetchError) {
      return res.status(500).json({
        message: "Failed to fetch admin message",
        details: fetchError.message,
      });
    }
    const latestAdminMessage = adminMessages?.[0] || null;
    res.status(200).json({
      message: "Your message was sent successfully.",
      latestAdminMessage,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal server error", details: err.message });
  }
});

app.post("/api/netpay", verifyToken, async (req, res) => {
  try {
    const { id, name, mobile, address, model, price, screenshot, timestamp } =
      req.body;
    if (
      !id ||
      !name ||
      !mobile ||
      !address ||
      !model ||
      !price ||
      !screenshot
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 15);

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          user_id: req.user.id,
          product_id: model,
          user_name: name,
          amount: parseFloat(price),
          screenshot_url: screenshot,
          delivery_status: "Confirmed",
          delivery_date: deliveryDate.toISOString().split("T")[0],
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ order: data[0] });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to save Netpay order", details: err.message });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, password, phone, is_admin = false } = req.body;
    if (!username || !password || !phone) {
      return res
        .status(400)
        .json({ message: "Username, password, and phone are required." });
    }

    const { data: existingUserByUsername } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existingUserByUsername) {
      return res.status(409).json({ message: "Username already taken." });
    }

    const { data: existingUserByPhone } = await supabase
      .from("users")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (existingUserByPhone) {
      return res.status(409).json({
        message: "Phone number is already associated with an account.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: userData, error } = await supabase
      .from("users")
      .insert([
        {
          username,
          password_hash: hashedPassword,
          phone,
          is_admin,
        },
      ])
      .select();

    if (error) throw error;

    const user = userData[0];
    const token = signToken({
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
    });

    res.status(201).json({
      message: "User registered successfully.",
      token,
      user: {
        id: user.id,
        username: user.username,
        is_admin: user.is_admin,
        phone: user.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", details: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { loginMobile, password } = req.body;
    if (!loginMobile || !password) {
      return res
        .status(400)
        .json({ message: "Mobile and password are required." });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("phone", loginMobile)
      .maybeSingle();
    const user = userData;

    if (!user)
      return res.status(401).json({ message: "Invalid username or password." });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid username or password." });

    const token = signToken({
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
    });

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        username: user.username,
        is_admin: user.is_admin,
        phone: user.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", details: err.message });
  }
});

app.post("/api/admin/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Phone and password are required." });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (error) {
      return res
        .status(500)
        .json({ message: "Database error", details: error.message });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid phone or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid phone or password." });
    }

    if (!user.is_admin) {
      return res.status(403).json({ message: "Access denied. Not an admin." });
    }

    const token = signToken({
      id: user.id,
      name: user.name,
      is_admin: user.is_admin,
      phone: user.phone,
    });

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        is_admin: user.is_admin,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", details: err.message });
  }
});

app.get(
  "/api/admin/messages/latest-per-user",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const latestMessagesMap = {};
      for (const msg of data) {
        if (!latestMessagesMap[msg.user_id]) {
          latestMessagesMap[msg.user_id] = msg;
        }
      }

      const latestMessages = Object.values(latestMessagesMap);

      res.json({ latestMessages });
    } catch (err) {
      res.status(500).json({
        message: "Failed to fetch latest messages per user",
        details: err.message,
      });
    }
  }
);

app.post(
  "/api/admin/messages/reply/:user_id",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { content } = req.body;
      const user_id = req.params.user_id;

      if (!content || !user_id)
        return res.status(400).json({ message: "content & user_id required" });

      const { data, error } = await supabase
        .from("messages")
        .insert([{ user_id, content, sender_type: "admin", is_read: false }])
        .select();

      if (error) throw error;

      res.status(201).json({ reply: data[0] });
    } catch (err) {
      res.status(500).json({ message: "Reply failed", details: err.message });
    }
  }
);

app.get("/api/messages/user", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: allMessages, error: messagesError } = await supabase
      .from("messages")
      .select("id, content, sender_type, created_at, is_read")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }); // Ascending order for chat history display

    if (messagesError) throw messagesError;
    const { data: latestAdminMsg } = await supabase
      .from("messages")
      .select("id, content, created_at, is_read")
      .eq("user_id", userId)
      .eq("sender_type", "admin")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    res.json({
      messages: allMessages || [],
      latestAdminMessage: latestAdminMsg || null,
    });
  } catch (err) {
    // Use 500 status code for internal server errors
    res.status(500).json({
      message: "Failed to fetch messages for user.",
      details: err.message,
    });
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await supabase.from("users").select("id").limit(1);
    console.log("Supabase connection OK");
  } catch {
    console.error("Supabase connection failed");
  }
});
