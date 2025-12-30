import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Client from "./components/Client";
import Admin from "./components/Admin";
import AuthPage from "./components/AuthPage";
import AdminDashboard from "./components/AdminDashboard";
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <>
      <Toaster position="top-center" />
      <Router>
        <Routes>
          <Route path="/" element={<Client />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
