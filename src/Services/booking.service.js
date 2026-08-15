import { axiosInstance } from "./axios";
import { handleApiRequest } from "./apiHandler";
import { MOCK_BOOKINGS, MOCK_OFFERS } from "./mockData";

let localBookings = [...MOCK_BOOKINGS];

export const bookRoom = async (data) => {
  const res = await handleApiRequest(() => axiosInstance("User").post("user/bookRoom", data));
  if (res.error || !res.data) {
    const bookingId = `BK-${Math.floor(10000 + Math.random() * 90000)}`;
    const newBooking = {
      id: bookingId,
      userId: 'u-1',
      userName: data.guestName || 'Sophia Montgomery',
      userEmail: data.guestEmail || 'sophia.m@example.com',
      hotelId: data.hotelId || 'h-101',
      hotelName: data.hotelName || 'The Grand Zenith Riviera',
      hotelImage: data.hotelImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
      roomId: data.roomId,
      roomNumber: data.roomNumber || '101',
      roomType: data.roomType || 'Deluxe Ocean Suite',
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      nights: data.nights || 1,
      adults: data.adults || 1,
      children: data.children || 0,
      totalAmount: data.totalAmount || 320,
      discountAmount: data.discountAmount || 0,
      payableAmount: data.payableAmount || 320,
      appliedOffer: data.offerCode || null,
      paymentStatus: 'Pending',
      bookingStatus: 'Booked',
      createdDate: new Date().toISOString().split('T')[0]
    };
    localBookings.unshift(newBooking);
    return { data: { status: true, message: "Room reserved! Proceed to checkout.", data: newBooking }, error: null };
  }
  return res;
};

export const getMyBookings = async () => {
  const res = await handleApiRequest(() => axiosInstance("User").get("user/getMyBookings"));
  if (res.error || !res.data) {
    return { data: { status: true, data: localBookings }, error: null };
  }
  return res;
};

export const getBookingById = async (id) => {
  const res = await handleApiRequest(() => axiosInstance("User").get(`user/getBookingById`, { params: { bookingId: id } }));
  if (res.error || !res.data) {
    const found = localBookings.find(b => b.id === id) || localBookings[0];
    return { data: { status: true, data: found }, error: null };
  }
  return res;
};

export const cancelBooking = async (data) => {
  const res = await handleApiRequest(() => axiosInstance("User").post("user/cancelBooking", data));
  if (res.error || !res.data) {
    localBookings = localBookings.map(b => b.id === data.bookingId ? { ...b, bookingStatus: 'Cancelled', cancelReason: data.cancelReason } : b);
    return { data: { status: true, message: "Booking cancelled successfully." }, error: null };
  }
  return res;
};

export const getHotelBookings = async (hotelId) => {
  const res = await handleApiRequest(() => axiosInstance("Employee").get("manager/getHotelBookings", { params: { hotelId } }));
  if (res.error || !res.data) {
    return { data: { status: true, data: localBookings }, error: null };
  }
  return res;
};

export const checkInBooking = async (bookingId) => {
  const res = await handleApiRequest(() => axiosInstance("Employee").post("manager/checkInBooking", { bookingId }));
  if (res.error || !res.data) {
    localBookings = localBookings.map(b => b.id === bookingId ? { ...b, bookingStatus: 'Checked In', paymentStatus: 'Paid' } : b);
    return { data: { status: true, message: "Guest Checked-In successfully!" }, error: null };
  }
  return res;
};

export const checkOutBooking = async (bookingId) => {
  const res = await handleApiRequest(() => axiosInstance("Employee").post("manager/checkOutBooking", { bookingId }));
  if (res.error || !res.data) {
    localBookings = localBookings.map(b => b.id === bookingId ? { ...b, bookingStatus: 'Completed' } : b);
    return { data: { status: true, message: "Guest Checked-Out successfully!" }, error: null };
  }
  return res;
};

export const validateOfferCode = (code, amount) => {
  const offer = MOCK_OFFERS.find(o => o.offerCode.toUpperCase() === code.toUpperCase() && o.isActive);
  if (!offer) {
    return { valid: false, message: "Invalid or expired promo code" };
  }
  if (amount < offer.minBookingAmount) {
    return { valid: false, message: `Minimum booking amount of $${offer.minBookingAmount} required for this coupon` };
  }
  let discount = 0;
  if (offer.discountType === 'percentage') {
    discount = (amount * offer.discountValue) / 100;
    if (offer.maxDiscountCap) discount = Math.min(discount, offer.maxDiscountCap);
  } else {
    discount = offer.discountValue;
  }
  return { valid: true, discount: Math.round(discount), offer };
};
