import { axiosInstance } from "./axios";
import { handleApiRequest } from "./apiHandler";

// Super Admin / Admin Dashboard Stats
export const fetchAdminDashboard = async () => {
  return handleApiRequest(() => axiosInstance("SuperAdmin").get("superadmin/getDashboard"));
};

// Booking Reports
export const fetchBookingReport = async () => {
  return handleApiRequest(() => axiosInstance("SuperAdmin").get("superadmin/bookingReport"));
};

// Revenue Reports
export const fetchRevenueReport = async () => {
  return handleApiRequest(() => axiosInstance("SuperAdmin").get("superadmin/revenueReport"));
};

// User Bookings
export const fetchUserBookings = async () => {
  return handleApiRequest(() => axiosInstance("User").get("user/getMyBookings"));
};

// User Payments
export const fetchUserPayments = async () => {
  return handleApiRequest(() => axiosInstance("User").get("user/getMyPayments"));
};

// User Profile
export const fetchUserProfile = async () => {
  return handleApiRequest(() => axiosInstance("User").get("user/getMyProfile"));
};
