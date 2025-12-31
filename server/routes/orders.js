import express from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { uploadToCloudinary, verifyToken, requireAdmin, sendAdminNotificationEmail } from "../utils/helpers.js";

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ============ PLACE ORDER ============
router.post(
    "/place",
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

// ============ NETPAY ORDER ============
router.post("/netpay", verifyToken, async (req, res) => {
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

// ============ GET ALL ORDERS (ADMIN) ============
router.get(
    "/admin",
    verifyToken,
    requireAdmin,
    async (req, res) => {
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
    }
);

// ============ GET ALL ORDERS (PUBLIC) ============
router.get("/public", async (req, res) => {
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

// ============ CONFIRM ORDER ============
router.put(
    "/admin/:id/confirm",
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

// ============ GET USER SALES COUNT ============
router.get("/user/sales/count", verifyToken, async (req, res) => {
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

// ============ GET PUBLIC SALES COUNT ============
router.get("/count", async (req, res) => {
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

export default router;
