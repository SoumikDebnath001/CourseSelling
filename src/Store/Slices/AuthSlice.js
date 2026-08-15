import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  loginSuperAdmin,
  verifySuperAdminOtp,
  loginHotelAdmin,
  loginUser,
  registerUser,
  forgotUserPassword,
  verifyUserOtp,
  loginEmployee,
  forgotEmployeePassword,
  verifyEmployeeOtp,
  changeAdminPassword,
  changeEmployeePassword,
} from "../../Services/auth.service";

// ============================================================================
//                              ASYNC THUNKS
// ============================================================================

// --- SUPER ADMIN ---
export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async (userData, { rejectWithValue }) => {
    const { data, error } = await loginSuperAdmin(userData);
    if (error) return rejectWithValue(error);
    return data;
  }
);

export const verifyAdminOtp = createAsyncThunk(
  "auth/verifyAdminOtp",
  async (otpData, { rejectWithValue }) => {
    const { data, error } = await verifySuperAdminOtp(otpData);
    if (error) return rejectWithValue(error);
    return data;
  }
);

// --- HOTEL ADMIN ---
export const loginHotelAdminThunk = createAsyncThunk(
  "auth/loginHotelAdmin",
  async (adminData, { rejectWithValue }) => {
    const { data, error } = await loginHotelAdmin(adminData);
    if (error) return rejectWithValue(error);
    return data;
  }
);

export const changeAdminPasswordThunk = createAsyncThunk(
  "auth/changeAdminPassword",
  async (passwordData, { rejectWithValue }) => {
    const { data, error } = await changeAdminPassword(passwordData);
    if (error) return rejectWithValue(error);
    return data;
  }
);

// --- USER (CUSTOMER) ---
export const loginRegularUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    const { data, error } = await loginUser(userData);
    if (error) return rejectWithValue(error);
    return data;
  }
);

export const registerRegularUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    const { data, error } = await registerUser(userData);
    if (error) return rejectWithValue(error);
    return data;
  }
);

export const forgotPasswordUserThunk = createAsyncThunk(
  "auth/forgotPasswordUser",
  async (emailData, { rejectWithValue }) => {
    const { data, error } = await forgotUserPassword(emailData);
    if (error) return rejectWithValue(error);
    return data;
  }
);

export const verifyUserOtpThunk = createAsyncThunk(
  "auth/verifyUserOtp",
  async (otpData, { rejectWithValue }) => {
    const { data, error } = await verifyUserOtp(otpData);
    if (error) return rejectWithValue(error);
    return data;
  }
);

// --- MANAGER / EMPLOYEE ---
export const loginHotelEmployee = createAsyncThunk(
  "auth/loginEmployee",
  async (userData, { rejectWithValue }) => {
    const { data, error } = await loginEmployee(userData);
    if (error) return rejectWithValue(error);
    return data;
  }
);

export const forgotPasswordEmployeeThunk = createAsyncThunk(
  "auth/forgotPasswordEmployee",
  async (emailData, { rejectWithValue }) => {
    const { data, error } = await forgotEmployeePassword(emailData);
    if (error) return rejectWithValue(error);
    return data;
  }
);

export const verifyEmployeeOtpThunk = createAsyncThunk(
  "auth/verifyEmployeeOtp",
  async (otpData, { rejectWithValue }) => {
    const { data, error } = await verifyEmployeeOtp(otpData);
    if (error) return rejectWithValue(error);
    return data;
  }
);

export const changeEmployeePasswordThunk = createAsyncThunk(
  "auth/changeEmployeePassword",
  async (passwordData, { rejectWithValue }) => {
    const { data, error } = await changeEmployeePassword(passwordData);
    if (error) return rejectWithValue(error);
    return data;
  }
);

// ============================================================================
//                              AUTH SLICE
// ============================================================================

const authSlice = createSlice({
  name: "auth",

  initialState: {
    user: null,
    token: null,
    userType: null, // "User" | "SuperAdmin" | "Admin" | "Employee"
    loading: false,
    loginLoading: false,
    otpLoading: false,
    error: null,
    isAuthenticated: false,
    mustChangePassword: false,
  },

  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.userType = null;
      state.loading = false;
      state.loginLoading = false;
      state.otpLoading = false;
      state.error = null;
      state.isAuthenticated = false;
      state.mustChangePassword = false;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userType");
    },

    clearError: (state) => {
      state.error = null;
    },

    persistData: (state) => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      const userType = localStorage.getItem("userType");

      if (token && user && userType) {
        state.isAuthenticated = true;
        state.token = token;
        state.user = JSON.parse(user);
        state.userType = userType;
      } else {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.userType = null;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // Super Admin Login (Step 1)
      .addCase(loginAdmin.pending, (state) => {
        state.loginLoading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state) => {
        state.loginLoading = false;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loginLoading = false;
        state.error = action.payload || "Super Admin login failed";
      })

      // Super Admin OTP Verification (Step 2)
      .addCase(verifyAdminOtp.pending, (state) => {
        state.otpLoading = true;
        state.error = null;
      })
      .addCase(verifyAdminOtp.fulfilled, (state, action) => {
        state.otpLoading = false;
        state.error = null;

        const token = action.payload?.token || action.payload?.data?.token;
        if (token) {
          const userData = action.payload?.user || action.payload?.data || { userType: "SuperAdmin" };
          state.isAuthenticated = true;
          state.token = token;
          state.userType = "SuperAdmin";
          state.user = userData;

          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("userType", "SuperAdmin");
        }
      })
      .addCase(verifyAdminOtp.rejected, (state, action) => {
        state.otpLoading = false;
        state.error = action.payload || "OTP verification failed";
      })

      // Hotel Admin Login
      .addCase(loginHotelAdminThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginHotelAdminThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const adminData = action.payload?.data;
        if (adminData && adminData.token) {
          state.isAuthenticated = true;
          state.user = adminData;
          state.token = adminData.token;
          state.userType = "Admin";
          state.mustChangePassword = !!action.payload?.mustChangePassword;

          localStorage.setItem("token", adminData.token);
          localStorage.setItem("user", JSON.stringify(adminData));
          localStorage.setItem("userType", "Admin");
        }
      })
      .addCase(loginHotelAdminThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Hotel Admin login failed";
      })

      // Regular User Login
      .addCase(loginRegularUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginRegularUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const userData = action.payload?.data;
        if (userData && userData.token) {
          state.isAuthenticated = true;
          state.user = userData;
          state.token = userData.token;
          state.userType = "User";

          localStorage.setItem("token", userData.token);
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("userType", "User");
        }
      })
      .addCase(loginRegularUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "User login failed";
      })

      // Regular User Registration
      .addCase(registerRegularUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerRegularUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerRegularUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "User registration failed";
      })

      // Employee / Manager Login
      .addCase(loginHotelEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginHotelEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const empData = action.payload?.data;
        if (empData && empData.token) {
          state.isAuthenticated = true;
          state.user = empData;
          state.token = empData.token;
          state.userType = "Employee";
          state.mustChangePassword = !!action.payload?.mustChangePassword;

          localStorage.setItem("token", empData.token);
          localStorage.setItem("user", JSON.stringify(empData));
          localStorage.setItem("userType", "Employee");
        }
      })
      .addCase(loginHotelEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Employee login failed";
      });
  },
});

export const { persistData, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
