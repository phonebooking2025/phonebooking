import express from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { uploadToCloudinary, verifyToken, requireAdmin } from "../utils/helpers.js";

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ============ CREATE/UPDATE PRODUCT ============
router.post(
    "/admin",
    verifyToken,
    requireAdmin,
    upload.fields([
        { name: "imageFile", maxCount: 1 },
        { name: "netpayQrCodeFile", maxCount: 1 },
        { name: "productVideoFile", maxCount: 1 },
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
                productVideo,
                buyOneGetOne,
                offerEndDateTime,
                emiMonths,
                downPaymentAmount,
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

            let product_video_url = productVideo || existing?.product_video || null;
            if (req.files?.productVideoFile?.[0]) {
                try {
                    product_video_url = await uploadToCloudinary(
                        req.files.productVideoFile[0].buffer,
                        "product_videos"
                    );
                } catch (err) { }
            }

            // Convert offer end datetime
            let offer_end_datetime = null;
            if (offerEndDateTime) {
                const dt = new Date(offerEndDateTime);
                if (!isNaN(dt.getTime())) {
                    offer_end_datetime = dt.toISOString();
                }
            } else {
                offer_end_datetime = existing?.offer_end_date_time || null;
            }

            // Convert datetime-local format (YYYY-MM-DDTHH:MM) to ISO timestamp
            let offer_time_value = null;
            if (offerTime) {
                // offerTime format from datetime-local input: "2026-01-15T14:30"
                // Convert to ISO format with timezone
                const dt = new Date(offerTime);
                if (!isNaN(dt.getTime())) {
                    offer_time_value = dt.toISOString();
                }
            } else {
                offer_time_value = existing?.offer_time || null;
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
                offer_time: offer_time_value,
                full_specs: fullSpecs || existing?.full_specs || null,
                image_url,
                netpay_qr_url,
                product_video: product_video_url,
                buy_one_get_one: buyOneGetOne || existing?.buy_one_get_one || 'No',
                offer_end_date_time: offer_end_datetime,
                emi_months: emiMonths || existing?.emi_months || null,
                down_payment_amount: downPaymentAmount ? parseFloat(downPaymentAmount) : (existing?.down_payment_amount || null),
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

// ============ GET PRODUCTS BY CATEGORY ============
router.get("/:category", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("category", req.params.category)
            .order("created_at", { ascending: false });
        if (error) throw error;

        const mapped = data.map((p) => {
            // Convert stored timestamp back to datetime-local format (YYYY-MM-DDTHH:MM)
            let offerTimeValue = null;
            if (p.offer_time) {
                const dt = new Date(p.offer_time);
                if (!isNaN(dt.getTime())) {
                    const year = dt.getFullYear();
                    const month = String(dt.getMonth() + 1).padStart(2, '0');
                    const day = String(dt.getDate()).padStart(2, '0');
                    const hours = String(dt.getHours()).padStart(2, '0');
                    const minutes = String(dt.getMinutes()).padStart(2, '0');
                    offerTimeValue = `${year}-${month}-${day}T${hours}:${minutes}`;
                }
            }

            return {
                id: p.id,
                category: p.category,
                model: p.model,
                price: p.price,
                bookingAmount: p.booking_amount,
                netpayPrice: p.netpay_price,
                offer: p.offer,
                offerTime: offerTimeValue,
                fullSpecs: p.full_specs,
                image: p.image_url,
                netpayQrCode: p.netpay_qr_url,
                emiMonths: p.emi_months || '',
                downPaymentAmount: p.down_payment_amount || null,
                productVideo: p.product_video || null,
                buyOneGetOne: p.buy_one_get_one || 'No',
                offerEndDateTime: p.offer_end_date_time || null,
                createdAt: p.created_at,
            };
        });

        res.json(mapped);
    } catch (err) {
        res
            .status(500)
            .json({ message: "Fetch products failed", details: err.message });
    }
});

// ============ DELETE PRODUCT ============
router.delete(
    "/admin/:id",
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

export default router;
