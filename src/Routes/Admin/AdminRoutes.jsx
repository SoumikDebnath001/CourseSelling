import React from "react";
import { Route, Routes } from "react-router-dom";
import AdminLogin from "../../Features/Auth/Pages/AdminLogin";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="auth" element={<AdminLogin />} />
      <Route path="superadmin/login" element={<AdminLogin />} />
    </Routes>
  );
};

export default AdminRoutes;
