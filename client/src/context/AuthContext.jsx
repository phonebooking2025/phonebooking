import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

// Using a standard URL as environment variable imports may not be stable in this environment
const API_URL = "http://localhost:3000/api";

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("adminToken")
  );
  const [token, setToken] = useState(() => localStorage.getItem("adminToken"));
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("adminUser");
      // Ensure the user object is valid and is_admin is present
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      return parsedUser && parsedUser.is_admin !== undefined
        ? parsedUser
        : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- 1. Authentication Handlers ---

  const login = async (phone, password) => {
    setLoading(true);
    setError(null);
    try {
      // Call admin login API
      const response = await axios.post(`${API_URL}/admin/login`, {
        phone,
        password,
      });

      // Destructure token and user from API response
      const { token, user } = response.data;

      // Persist to localStorage using the 'admin' prefix as defined
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminUser", JSON.stringify(user));

      // Update context state
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);

      console.log("Admin login successful:", user);
      return true;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Login failed. Check server status or credentials.";
      setError(message);
      console.error("Login Error:", message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
    console.log("User logged out");
  }, []);

  // --- 2. Context Value ---

  const contextValue = {
    isAuthenticated,
    token,
    user,
    loading,
    error,
    login,
    logout,
    isAdmin: user?.is_admin || false, // Ensure isAdmin is derived
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
