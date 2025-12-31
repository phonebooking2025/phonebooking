import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Import routes
import authRoutes from "./routes/auth.js";
import productsRoutes from "./routes/products.js";
import ordersRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import messagesRoutes from "./routes/messages.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = express();

// ============ MIDDLEWARE ============
const allowedOrigins = ["http://localhost:5173", "https://phonebooking.in", "https://phonebooking-client.vercel.app", "https://phonebooking.vercel.app"];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "50mb" }));

// ============ HEALTH CHECK ============
app.get("/", (req, res) => res.send({ status: "ok", message: "API running" }));

// ============ PUBLIC SETTINGS ============
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


// ============ ROUTE IMPORTS ============
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api", ordersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/admin/messages", messagesRoutes);



app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await supabase.from("users").select("id").limit(1);
    console.log("Supabase connection OK");
  } catch {
    console.error("Supabase connection failed");
  }
});
