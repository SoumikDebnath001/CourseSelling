import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getHotelById } from '../Services/hotel.service';
import { getRoomsByHotelId } from '../Services/room.service';
import { getReviewsByHotelId } from '../Services/user.service';
import { MOCK_AMENITIES } from '../Services/mockData';

import BookingModal from '../Features/Booking/Components/BookingModal';
import StatusBadge from '../Components/UI/StatusBadge';
import toast from 'react-hot-toast';
import { 
  FiStar, FiMapPin, FiWifi, FiCheck, FiUser, 
  FiCalendar, FiMessageSquare, FiShield, FiHeart 
} from 'react-icons/fi';

const HotelDetailsPage = () => {
  const [searchParams] = useSearchParams();
  const hotelId = searchParams.get('id') || 'h-101';
  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking Modal State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    fetchHotelDetails();
  }, [hotelId]);

  const fetchHotelDetails = async () => {
    setLoading(true);
    const { data: hRes } = await getHotelById(hotelId);
    const { data: rRes } = await getRoomsByHotelId(hotelId);
    const { data: revRes } = await getReviewsByHotelId(hotelId);

    if (hRes?.data) setHotel(hRes.data);
    if (rRes?.data) setRooms(rRes.data);
    if (revRes?.data) setReviews(revRes.data);
    setLoading(false);
  };

  const handleOpenBooking = (room) => {
    setSelectedRoom(room);
    setIsBookingOpen(true);
  };

  if (loading || !hotel) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="h-96 glass-panel rounded-3xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10 flex-1">
        
        {/* Header Title & Rating */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                5-Star Verified Property
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <FiMapPin className="text-emerald-400" /> {hotel.address}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif tracking-tight">{hotel.hotelName}</h1>
          </div>

          <div className="flex items-center gap-4 glass-panel p-4 rounded-2xl border-white/10">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 font-extrabold text-2xl">
              {hotel.rating}
            </div>
            <div>
              <div className="flex items-center text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => <FiStar key={i} className="fill-amber-400 w-4 h-4" />)}
              </div>
              <span className="text-xs text-slate-400">{hotel.reviewCount} Verified Guest Reviews</span>
            </div>
          </div>
        </div>

        {/* Photo Gallery Lightbox */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-96 rounded-3xl overflow-hidden glass-panel border border-white/10 relative">
            <img 
              src={hotel.gallery[activeImageIndex] || hotel.coverImage} 
              alt={hotel.hotelName} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {hotel.gallery.slice(0, 4).map((img, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveImageIndex(idx)}
                className={`h-44 rounded-2xl overflow-hidden glass-panel border cursor-pointer transition-all ${
                  activeImageIndex === idx ? 'border-emerald-400 ring-2 ring-emerald-500/40' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Property Overview & Amenities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
              <h3 className="text-xl font-bold text-white font-serif">Property Description</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{hotel.description}</p>
            </div>

            {/* Amenities Grid */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-white font-serif">Full Hotel Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {hotel.amenities.map((aId) => {
                  const item = MOCK_AMENITIES.find(a => a.id === aId);
                  return (
                    <div key={aId} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <FiCheck className="text-emerald-400 w-4 h-4" />
                      <span>{item?.name || 'Amenity'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contact & Owner Information */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 h-fit">
            <h3 className="text-lg font-bold text-white">Managed Property Info</h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">Hotel ID</span>
                <span className="font-mono text-emerald-400 font-bold">{hotel.id}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">Owner Admin</span>
                <span>{hotel.ownerName || 'Alexander Vance'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approval Status</span>
                <StatusBadge status={hotel.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Available Rooms Grid Section */}
        <section className="space-y-6 pt-6 border-t border-white/10">
          <div>
            <h2 className="text-3xl font-extrabold text-white font-serif">Available Suites & Rooms</h2>
            <p className="text-xs text-slate-400 mt-1">Select your preferred suite and reserve instantly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="glass-panel glass-panel-hover p-6 rounded-3xl border border-white/10 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                      {room.roomType}
                    </span>
                    <StatusBadge status={room.status} />
                  </div>
                  <h4 className="text-xl font-extrabold text-white">Room #{room.roomNumber}</h4>
                  <p className="text-xs text-slate-400">{room.description}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    <span>👥 Max: {room.maxAdults} Adults, {room.maxChildren} Kids</span>
                    <span>🛏️ Beds: {room.beds || 1}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {room.amenities.map((a, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <span className="text-2xl font-extrabold text-white">${room.pricePerNight}</span>
                    <span className="text-xs text-slate-400"> / night</span>
                  </div>
                  <button
                    disabled={room.status !== 'Available'}
                    onClick={() => handleOpenBooking(room)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-40 text-slate-950 text-xs font-bold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-md shadow-emerald-500/20"
                  >
                    {room.status === 'Available' ? 'Reserve & Book' : 'Booked'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section className="space-y-6 pt-6 border-t border-white/10">
          <h2 className="text-2xl font-extrabold text-white font-serif">Verified Guest Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-5 glass-panel rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                      {rev.userName[0]}
                    </div>
                    <span className="text-xs font-bold text-white">{rev.userName}</span>
                  </div>
                  <div className="flex items-center text-amber-400 text-xs font-bold gap-1">
                    <FiStar className="fill-amber-400" /> {rev.rating} / 5
                  </div>
                </div>
                <p className="text-xs text-slate-300 italic">"{rev.reviewText}"</p>
                <p className="text-[10px] text-slate-500 text-right">{rev.date}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Booking Drawer Modal */}
      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        room={selectedRoom}
        hotel={hotel}
      />
    </div>
  );
};

export default HotelDetailsPage;
