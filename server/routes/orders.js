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
    "/orders/place",
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
router.post("/orders/netpay", verifyToken, async (req, res) => {
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

// ============ EMI ORDER ============
router.post(
    "/orders/emi",
    verifyToken,
    upload.fields([{ name: "screenshot", maxCount: 1 }, { name: "user_photo", maxCount: 1 }]),
    async (req, res) => {
        // Add diagnostics to help trace 500 errors
        console.log('[EMI] incoming request body keys:', Object.keys(req.body || {}));
        console.log('[EMI] files present:', Object.keys(req.files || {}));

        try {
            const { product_id, product_name, user_name, mobile, address, aadhar, bank_details, amount, emi_months, down_payment } = req.body;

            if (!product_id || !user_name || !mobile || !address || !amount || !emi_months) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            let screenshot_url = null;
            let user_photo_url = null;

            try {
                if (req.files?.screenshot?.[0]) {
                    screenshot_url = await uploadToCloudinary(
                        req.files.screenshot[0].buffer,
                        "orders/emi/screenshots"
                    );
                }
            } catch (upErr) {
                console.error('[EMI] screenshot upload failed:', upErr);
                return res.status(500).json({ message: 'Screenshot upload failed', details: String(upErr.message || upErr) });
            }

            try {
                if (req.files?.user_photo?.[0]) {
                    user_photo_url = await uploadToCloudinary(
                        req.files.user_photo[0].buffer,
                        "orders/emi/photos"
                    );
                }
            } catch (upErr) {
                console.error('[EMI] user photo upload failed:', upErr);
                return res.status(500).json({ message: 'User photo upload failed', details: String(upErr.message || upErr) });
            }

            // Create a base order record first
            const orderPayload = {
                user_id: req.user.id,
                product_id,
                amount: parseFloat(amount),
                user_name: user_name || null,
                screenshot_url,
                delivery_status: "EMI Pending",
                mobile: mobile || null,
                address: address || null,
                emi_type: "EMI",
                payment_method: "QR",
            };

            let createdOrder;
            try {
                const { data: orderData, error: orderError } = await supabase
                    .from("orders")
                    .insert([orderPayload])
                    .select();

                if (orderError) throw orderError;
                createdOrder = orderData[0];
            } catch (dbErr) {
                console.error('[EMI] orders insert failed:', dbErr);
                return res.status(500).json({ message: 'Failed to create order', details: String(dbErr.message || dbErr) });
            }

            // Insert EMI specific details into emi_applications table
            const emiAppPayload = {
                order_id: createdOrder.id,
                user_id: req.user.id,
                aadhar_number: aadhar || null,
                bank_details: bank_details || null,
                user_photo_url: user_photo_url || null,
                emi_months: emi_months ? parseInt(emi_months) : null,
                down_payment: down_payment ? parseFloat(down_payment) : 0,
                monthly_emi: null,
                application_status: 'Pending'
            };

            let emiApplication;
            try {
                const { data: emiData, error: emiError } = await supabase
                    .from("emi_applications")
                    .insert([emiAppPayload])
                    .select();

                if (emiError) throw emiError;
                emiApplication = emiData[0];
            } catch (dbErr) {
                console.error('[EMI] emi_applications insert failed:', dbErr);
                // Attempt to rollback order? For now, return an error and leave order record (could implement rollback later)
                return res.status(500).json({ message: 'Failed to create EMI application', details: String(dbErr.message || dbErr) });
            }

            // Notify admin but don't fail the request if notification errors
            try {
                await sendAdminNotificationEmail({ ...emiAppPayload, order_id: createdOrder.id }, product_name);
            } catch (notifyErr) {
                console.error('[EMI] notification failed:', notifyErr);
            }

            return res.status(201).json({ order: createdOrder, emi_application: emiApplication });
        } catch (err) {
            console.error('[EMI] unhandled error:', err);
            return res.status(500).json({
                message: "Place EMI order failed",
                details: String(err.message || err),
            });
        }
    }
);

// ============ GET ALL ORDERS (ADMIN) ============
router.get(
    "/admin/orders",
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
router.get("/public/orders", async (req, res) => {
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
    "/admin/orders/:id/confirm",
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
