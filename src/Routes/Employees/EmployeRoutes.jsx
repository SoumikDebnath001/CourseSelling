import React from "react";
import { Route, Routes } from "react-router-dom";
import ManagerAuthPage from "../../Features/Auth/Pages/ManagerAuthPage";
import ForgotPasswordPage from "../../Features/Auth/Pages/ForgotPasswordPage";

const EmployeRoutes = () => {
  return (
    <Routes>
      <Route path="auth/login" element={<ManagerAuthPage />} />
      <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
    </Routes>
  );
};

export default EmployeRoutes;
