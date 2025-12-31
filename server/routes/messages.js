import express from "express";
import { createClient } from "@supabase/supabase-js";
import { verifyToken, requireAdmin } from "../utils/helpers.js";

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============ SEND MESSAGE ============
router.post("/send", verifyToken, async (req, res) => {
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

// ============ GET LATEST MESSAGE (ADMIN) ============
router.get(
    "/admin/latest",
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

// ============ ADMIN REPLY ============
router.post(
    "/admin/reply/:user_id",
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

// ============ SEND SMS ============
router.post("/send-sms", verifyToken, async (req, res) => {
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

// ============ GET USER MESSAGES ============
router.get("/user", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: allMessages, error: messagesError } = await supabase
            .from("messages")
            .select("id, content, sender_type, created_at, is_read")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });

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
        res.status(500).json({
            message: "Failed to fetch messages for user.",
            details: err.message,
        });
    }
});

export default router;
