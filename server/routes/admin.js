import express from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { uploadToCloudinary, verifyToken, requireAdmin } from "../utils/helpers.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/helpers.js";

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ============ ADMIN LOGIN ============
router.post("/login", async (req, res) => {
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

// ============ SETTINGS ============
router.post(
    "/settings",
    verifyToken,
    requireAdmin,
    upload.fields([
        { name: "companyLogoFile", maxCount: 1 },
        { name: "deliveryImageFile", maxCount: 1 },
        { name: "bannerFiles", maxCount: 20 },
        { name: "advertisementVideoFile", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const companyLogoFile = req.files?.companyLogoFile?.[0];
            const deliveryImageFile = req.files?.deliveryImageFile?.[0];
            const bannerFiles = req.files?.bannerFiles || [];
            const advertisementVideoFile = req.files?.advertisementVideoFile?.[0];

            let { header_title, company_logo_url, delivery_image_url, banners, whatsapp_number, header_bg_color } =
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

            let advertisement_video_url = advertisementVideoFile
                ? await uploadToCloudinary(
                    advertisementVideoFile.buffer,
                    "settings/advertisement",
                    "video"
                )
                : existingSettings?.advertisement_video_url || null;

            let bannerArray = existingSettings?.banners || [];

            for (const bf of bannerFiles) {
                const url = await uploadToCloudinary(bf.buffer, "settings/banners");
                bannerArray.push(url);
            }

            if (banners) {
                try {
                    const oldBannersFromClient = JSON.parse(banners); // Paths to keep from client
                    const newBanners = bannerArray.filter(
                        (url) => !oldBannersFromClient.includes(url) // New uploads only
                    );
                    // Keep old banners that client still has + add new uploads
                    bannerArray = oldBannersFromClient.filter(
                        (url) => bannerArray.includes(url) || oldBannersFromClient.includes(url)
                    ).concat(newBanners);
                } catch (e) {
                    console.error("Error processing banners:", e);
                }
            }

            const settingsObj = {
                id: "00000000-0000-0000-0000-000000000001",
                header_title: header_title || existingSettings?.header_title || null,
                company_logo_url,
                delivery_image_url,
                banners: bannerArray,
                advertisement_video_url,
                whatsapp_number: whatsapp_number || existingSettings?.whatsapp_number || null,
                header_bg_color: header_bg_color || existingSettings?.header_bg_color || '#1D4ED8',
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

// ============ DELETE SPECIFIC BANNER ============
router.delete(
    "/settings/banners/:bannerUrl",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const bannerUrlToDelete = decodeURIComponent(req.params.bannerUrl);

            // Get current settings
            const { data: currentSettings, error: fetchError } = await supabase
                .from("settings")
                .select("banners")
                .eq("id", "00000000-0000-0000-0000-000000000001")
                .maybeSingle();

            if (fetchError) throw fetchError;

            // Filter out the banner to delete
            const updatedBanners = (currentSettings?.banners || []).filter(
                (banner) => banner !== bannerUrlToDelete
            );

            // Update settings with new banner array
            const { data, error } = await supabase
                .from("settings")
                .update({ banners: updatedBanners })
                .eq("id", "00000000-0000-0000-0000-000000000001")
                .select();

            if (error) throw error;

            res.json({
                message: "Banner deleted successfully",
                settings: data[0]
            });
        } catch (err) {
            res.status(500).json({
                message: "Delete banner failed",
                details: err.message,
            });
        }
    }
);

// ============ GET SETTINGS ============
router.get("/settings", async (req, res) => {
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

// ============ GET LATEST MESSAGE PER USER ============
router.get(
    "/messages/latest-per-user",
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

// ============ GET USERS LIST ============
router.get(
    "/users",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("id, name, phone, is_admin, created_at")
                .order("created_at", { ascending: false });

            if (error) throw error;

            res.json({ users: data });
        } catch (err) {
            res.status(500).json({ message: "Failed to fetch users", details: err.message });
        }
    }
);

// ============ DELETE USER ============
router.delete(
    "/users/:id",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const userId = req.params.id;

            const { data: existingUser, error: fetchError } = await supabase
                .from("users")
                .select("id, is_admin")
                .eq("id", userId)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (!existingUser) return res.status(404).json({ message: "User not found" });

            if (existingUser.is_admin) return res.status(403).json({ message: "Cannot delete an admin user" });

            const { error } = await supabase.from("users").delete().eq("id", userId);
            if (error) throw error;

            res.json({ message: "User deleted successfully" });
        } catch (err) {
            res.status(500).json({ message: "Delete user failed", details: err.message });
        }
    }
);

export default router;
