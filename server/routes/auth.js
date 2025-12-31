import express from "express";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { signToken } from "../utils/helpers.js";

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============ SIGNUP ============
router.post("/signup", async (req, res) => {
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

// ============ CLIENT LOGIN ============
router.post("/login", async (req, res) => {
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

export default router;
