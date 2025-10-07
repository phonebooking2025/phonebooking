import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Client from "./components/Client";
import Admin from "./components/Admin";
import AuthPage from "./components/AuthPage";
import { Toaster } from "react-hot-toast";
const App = () => {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: '8px', } }} />
      <Router>
        <Routes>
          <Route path="/" element={<Client />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
