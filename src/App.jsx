import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { persistData } from './Store/Slices/AuthSlice'
import AdminRoutes from './Routes/Admin/AdminRoutes'
import UserRoutes from './Routes/User/UserRoutes'
import PublicRoutes from './Routes/PublicRoutes/PublicRoutes'
import EmployeRoutes from './Routes/Employees/EmployeRoutes'


function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(persistData());
  }, []);
  return (
    <>
      <BrowserRouter>
        {/* ==================================Routes======================== */}
        <Routes>
          {/* ===========AdminRoutes=========== */}
          <Route path="/admin/*" element={<AdminRoutes />} />
          {/* ===========PublicRoutes========== */}
          <Route path="/*" element={<PublicRoutes />} />
          {/* ===========UserRoutes============ */}
          <Route path="/user/*" element={<UserRoutes />} />
          {/* ===========EmployeeRoutes======== */}
          <Route path="/employee/*" element={<EmployeRoutes/>} />
        </Routes>
        {/* ================================Toaster Design================*/}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1f2933",
              color: "#ffffff",
              fontSize: "14px",
              borderRadius: "8px",
              zIndex: "999999999",
            },
            success: {
              style: {
                background: "#39aa1f",
                color: "white",
              },
            },
            error: {
              style: {
                background: "#ef4444",
                color: "white",
              },
            },
          }}
        />
      </BrowserRouter>
    </>

  )
}

export default App
