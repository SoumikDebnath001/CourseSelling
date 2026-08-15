import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FiGrid,
  FiHome,
  FiUser,
  FiShield,
  FiBriefcase,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiPlus,
  FiTrendingUp,
  FiRefreshCw,
  FiLogOut,
  FiArrowRight,
} from "react-icons/fi";
import toast from "react-hot-toast";

import GlassCard from "../Features/Auth/Components/GlassCard";
import {
  fetchAdminDashboard,
  fetchUserBookings,
  fetchUserPayments,
  fetchUserProfile,
} from "../Services/dashboard.service";
import { logout } from "../Store/Slices/AuthSlice";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectAttemptedRef = useRef(false);
  const dispatch = useDispatch();
  const { isAuthenticated, userType, user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Admin stats
  const [adminStats, setAdminStats] = useState({
    totalHotels: 0,
    pendingHotels: 0,
    totalRooms: 0,
    totalCustomers: 0,
    totalBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    availableRooms: 0,
    occupiedRooms: 0,
  });

  // User stats
  const [userBookings, setUserBookings] = useState([]);
  const [userPayments, setUserPayments] = useState([]);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (redirectAttemptedRef.current) return;

    if (!isAuthenticated) {
      redirectAttemptedRef.current = true;
      toast.error("Please sign in to access your dashboard.");
      if (location.pathname !== "/user/auth/login") {
        navigate("/user/auth/login", { replace: true });
      }
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, location.pathname, navigate, userType]);

  const loadDashboardData = async () => {
    setLoading(true);

    if (userType === "SuperAdmin" || userType === "Admin") {
      const res = await fetchAdminDashboard();
      if (res?.data?.status && res?.data?.data) {
        setAdminStats(res.data.data);
      }
    } else if (userType === "User") {
      const profileRes = await fetchUserProfile();
      if (profileRes?.data?.status && profileRes?.data?.data) {
        setProfileData(profileRes.data.data);
      }

      const bookingsRes = await fetchUserBookings();
      if (bookingsRes?.data?.status && bookingsRes?.data?.data) {
        setUserBookings(bookingsRes.data.data || []);
      }

      const paymentsRes = await fetchUserPayments();
      if (paymentsRes?.data?.status && paymentsRes?.data?.data) {
        setUserPayments(paymentsRes.data.data || []);
      }
    }

    setLoading(false);
  };

  const roleLabel =
    userType === "SuperAdmin"
      ? "Super Administrator"
      : userType === "Admin"
      ? "Hotel Administrator"
      : userType === "Employee"
      ? "Hotel Manager"
      : "Guest User";

  const RoleIcon =
    userType === "SuperAdmin" || userType === "Admin"
      ? FiShield
      : userType === "Employee"
      ? FiBriefcase
      : FiUser;

  return (
    <div className="min-h-screen bg-stone-950 text-white selection:bg-amber-500 selection:text-white">


      <main className="relative px-6 py-10 sm:px-10 lg:px-16">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute top-20 left-10 h-96 w-96 rounded-full bg-amber-500/10 blur-[150px]" />
        <div className="pointer-events-none absolute top-96 right-10 h-96 w-96 rounded-full bg-purple-600/10 blur-[150px]" />

        <div className="mx-auto max-w-7xl">
          {/* HEADER BANNER */}
          <GlassCard className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-stone-900/80 to-purple-600/10 p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-inner">
                  <RoleIcon className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    {roleLabel} Dashboard
                  </div>
                  <h1 className="mt-1 font-serif text-3xl font-bold text-white sm:text-4xl">
                    Welcome back, {user?.firstMiddleName || user?.name || user?.email || "User"}
                  </h1>
                  <p className="mt-1 text-xs text-stone-300">
                    Logged in as <span className="font-semibold text-amber-300">{user?.email}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={loadDashboardData}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/20"
                >
                  <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/rooms")}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-2.5 text-xs font-semibold text-white shadow-lg hover:from-amber-500 hover:to-amber-600"
                >
                  <FiPlus className="h-4 w-4" /> Book New Room
                </button>
              </div>
            </div>
          </GlassCard>

          {/* DASHBOARD TAB NAVIGATION */}
          <div className="mt-8 flex rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-md max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                activeTab === "overview"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Overview & Analytics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bookings")}
              className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                activeTab === "bookings"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              {userType === "User" ? "My Bookings" : "Recent Bookings"}
            </button>
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="mt-8 space-y-8">
              {/* ADMIN STAT CARDS GRID */}
              {(userType === "SuperAdmin" || userType === "Admin") && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <GlassCard className="border-amber-500/20">
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">Total Hotels</span>
                      <FiHome className="h-5 w-5 text-amber-400" />
                    </div>
                    <p className="mt-3 font-serif text-3xl font-bold text-white">
                      {adminStats.totalHotels}
                    </p>
                    <p className="mt-1 text-[11px] text-amber-400">
                      {adminStats.pendingHotels} Pending Approval
                    </p>
                  </GlassCard>

                  <GlassCard className="border-amber-500/20">
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">Total Rooms</span>
                      <FiGrid className="h-5 w-5 text-amber-400" />
                    </div>
                    <p className="mt-3 font-serif text-3xl font-bold text-white">
                      {adminStats.totalRooms}
                    </p>
                    <p className="mt-1 text-[11px] text-emerald-400">
                      {adminStats.availableRooms} Available / {adminStats.occupiedRooms} Booked
                    </p>
                  </GlassCard>

                  <GlassCard className="border-amber-500/20">
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
                      <FiCalendar className="h-5 w-5 text-amber-400" />
                    </div>
                    <p className="mt-3 font-serif text-3xl font-bold text-white">
                      {adminStats.totalBookings}
                    </p>
                    <p className="mt-1 text-[11px] text-red-400">
                      {adminStats.cancelledBookings} Cancelled
                    </p>
                  </GlassCard>

                  <GlassCard className="border-amber-500/20">
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                      <FiDollarSign className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="mt-3 font-serif text-3xl font-bold text-emerald-400">
                      ${adminStats.totalRevenue.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-stone-400">Paid Transactions</p>
                  </GlassCard>
                </div>
              )}

              {/* USER STAT CARDS GRID */}
              {userType === "User" && (
                <div className="grid gap-6 sm:grid-cols-3">
                  <GlassCard className="border-amber-500/20">
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">My Reservations</span>
                      <FiCalendar className="h-5 w-5 text-amber-400" />
                    </div>
                    <p className="mt-3 font-serif text-3xl font-bold text-white">
                      {userBookings.length}
                    </p>
                    <p className="mt-1 text-[11px] text-stone-400">Active & Past Stays</p>
                  </GlassCard>

                  <GlassCard className="border-amber-500/20">
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">Total Spent</span>
                      <FiDollarSign className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="mt-3 font-serif text-3xl font-bold text-emerald-400">
                      ${userPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-stone-400">Across all completed payments</p>
                  </GlassCard>

                  <GlassCard className="border-amber-500/20">
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">Account Status</span>
                      <FiCheckCircle className="h-5 w-5 text-amber-400" />
                    </div>
                    <p className="mt-3 font-serif text-2xl font-bold text-white">Verified Guest</p>
                    <p className="mt-1 text-[11px] text-stone-400">{user?.email}</p>
                  </GlassCard>
                </div>
              )}

              {/* RECENT ACTIVITY & QUICK ACTIONS */}
              <div className="grid gap-6 lg:grid-cols-12">
                <GlassCard className="lg:col-span-8 border-white/15">
                  <h3 className="font-serif text-xl font-semibold text-white">System Activity Overview</h3>
                  <p className="mt-1 text-xs text-stone-400">
                    Real-time operational summary from the backend database.
                  </p>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-4">
                      <div>
                        <p className="text-sm font-semibold text-white">Database Synchronization</p>
                        <p className="text-xs text-stone-400">All MongoDB collections connected</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Operational
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-4">
                      <div>
                        <p className="text-sm font-semibold text-white">Security & Auth Protocols</p>
                        <p className="text-xs text-stone-400">2FA OTP & Role Middleware Active</p>
                      </div>
                      <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
                        Secured
                      </span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="lg:col-span-4 border-white/15">
                  <h3 className="font-serif text-xl font-semibold text-white">Quick Shortcuts</h3>
                  <p className="mt-1 text-xs text-stone-400">Navigate to key actions</p>

                  <div className="mt-6 space-y-3">
                    <button
                      type="button"
                      onClick={() => navigate("/rooms")}
                      className="w-full flex items-center justify-between rounded-xl border border-white/15 bg-white/5 p-3.5 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      <span>Explore Luxury Rooms</span>
                      <FiArrowRight className="h-4 w-4 text-amber-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/about")}
                      className="w-full flex items-center justify-between rounded-xl border border-white/15 bg-white/5 p-3.5 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      <span>About ComfyStay Hospitality</span>
                      <FiArrowRight className="h-4 w-4 text-amber-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch(logout())}
                      className="w-full flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                    >
                      <span>Logout Account</span>
                      <FiLogOut className="h-4 w-4" />
                    </button>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {/* BOOKINGS TAB */}
          {activeTab === "bookings" && (
            <GlassCard className="mt-8 border-white/15">
              <h3 className="font-serif text-xl font-semibold text-white">
                {userType === "User" ? "My Room Reservations" : "Property Bookings List"}
              </h3>
              <p className="mt-1 text-xs text-stone-400">
                Managed directly via backend booking endpoints.
              </p>

              {userBookings.length === 0 ? (
                <div className="my-12 text-center">
                  <FiCalendar className="mx-auto h-12 w-12 text-stone-600" />
                  <p className="mt-3 text-sm text-stone-300">No active bookings found.</p>
                  <button
                    type="button"
                    onClick={() => navigate("/rooms")}
                    className="mt-4 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-amber-500"
                  >
                    Browse Available Rooms
                  </button>
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 text-amber-300 uppercase">
                      <tr>
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">Hotel</th>
                        <th className="py-3 px-4">Dates</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-stone-300">
                      {userBookings.map((b) => (
                        <tr key={b._id} className="hover:bg-white/5">
                          <td className="py-3.5 px-4 font-mono text-amber-400">{b._id}</td>
                          <td className="py-3.5 px-4 font-semibold text-white">{b.hotelName || "Hotel Suite"}</td>
                          <td className="py-3.5 px-4">{b.checkInDate} - {b.checkOutDate}</td>
                          <td className="py-3.5 px-4">
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                              {b.bookingStatus || "Confirmed"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">${b.totalAmount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
