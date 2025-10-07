import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
    // State to toggle between 'login' and 'register' views
    const [isLoginView, setIsLoginView] = useState(true);

    // State to hold form data for both pages
    const [formData, setFormData] = useState({
        mobile: "",
        password: "",
        confirmPassword: "", // Only used for registration
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogin = (e) => {
        e.preventDefault();

        // Simple validation check
        if (!formData.mobile || !formData.password) {
            alert("Please enter both mobile number and password.");
            return;
        }

        // --- Mock Login Logic ---
        console.log("Attempting Login:", formData.mobile);

        // In a real app, you would send this to a server (e.g., fetch('/api/login', ...))
        alert(`Login attempted for Mobile: ${formData.mobile}`);

        // Reset form (optional)
        setFormData({ mobile: "", password: "", confirmPassword: "" });
    };

    const handleRegister = (e) => {
        e.preventDefault();

        // Validation check
        if (!formData.mobile || !formData.password || !formData.confirmPassword) {
            alert("Please fill out all fields.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        // --- Mock Register Logic ---
        console.log("Attempting Registration:", formData.mobile);

        // In a real app, you would send this to a server (e.g., fetch('/api/register', ...))
        alert(
            `Registration successful for Mobile: ${formData.mobile}. Please login.`
        );

        // Automatically switch to login view after successful registration
        setIsLoginView(true);
        setFormData({ mobile: "", password: "", confirmPassword: "" });
    };

    const navigate = useNavigate();

    // Helper to render the currently active form
    const renderForm = () => {
        if (isLoginView) {
            return (
                <form onSubmit={handleLogin} className="auth-form">
                    <button
                        onClick={() => navigate("/")}
                        style={{
                            background: "#89CFF0",
                            color: "black",
                            border: "none",
                            width: "100px",
                            padding: "5px 10px",
                            borderRadius: "5px",
                            fontSize: "0.9em",
                            cursor: "pointer",
                        }}
                    >
                        Home Page
                    </button>
                    <h2>Login</h2>

                    <div className="form-group">
                        <label htmlFor="mobile">Mobile Number</label>
                        <input
                            type="text"
                            id="mobile"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter mobile number"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter password"
                        />
                    </div>

                    <button type="submit">Log In</button>

                    <p className="swap-text">
                        Don't have an account?
                        <span onClick={() => setIsLoginView(false)}>Sign Up</span>
                    </p>
                </form>
            );
        } else {
            return (
                <form onSubmit={handleRegister} className="auth-form">
                    <h2>Register</h2>

                    <div className="form-group">
                        <label htmlFor="mobile">Mobile Number</label>
                        <input
                            type="text"
                            id="mobile"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter mobile number"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            placeholder="Create password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                            placeholder="Confirm password"
                        />
                    </div>

                    <button type="submit">Register</button>

                    <p className="swap-text">
                        Already have an account?
                        <span onClick={() => setIsLoginView(true)}>Log In</span>
                    </p>
                </form>
            );
        }
    };

    return (
        <div className="auth-container">
            <style>{`
                /* Simple CSS for Centered Box */
                .auth-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #f0f2f5;
                    font-family: Arial, sans-serif;
                }
                .auth-form {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    max-width: 350px;
                    text-align: center;
                }
                .auth-form h2 {
                    margin-bottom: 25px;
                    color: #333;
                }
                .form-group {
                    text-align: left;
                    margin-bottom: 15px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    font-size: 0.9em;
                }
                .form-group input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    box-sizing: border-box;
                    font-size: 1em;
                }
                .auth-form button {
                    width: 100%;
                    padding: 10px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1.1em;
                    margin-top: 10px;
                    transition: background-color 0.3s;
                }
                .auth-form button:hover {
                    background-color: #0056b3;
                }
                .swap-text {
                    margin-top: 20px;
                    font-size: 0.9em;
                    color: #555;
                }
                .swap-text span {
                    color: #007bff;
                    font-weight: bold;
                    cursor: pointer;
                    margin-left: 5px;
                }
                .swap-text span:hover {
                    text-decoration: underline;
                }
            `}</style>
            {renderForm()}
        </div>
    );
};

export default AuthPage;
