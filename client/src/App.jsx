import React, { useState, useEffect } from 'react';
import { Plane, Calendar, Search, Trash2, Plus, User, Mail, DollarSign, MapPin, CheckCircle, AlertCircle, ArrowRight, Ticket } from 'lucide-react';

const USE_MOCK_DATA = false; 
const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'admin' | 'booking' | 'my-bookings'
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState({ origin: '', destination: '' });
  
  // Booking State
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [bookingForm, setBookingForm] = useState({ name: '', email: '' });

  // My Bookings State
  const [myBookingsEmail, setMyBookingsEmail] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  const [hasSearchedBookings, setHasSearchedBookings] = useState(false);

  // Admin State
  const [newFlight, setNewFlight] = useState({
    origin: '', destination: '', date: '', price: '', seats: ''
  });

  // --- API HANDLERS ---

  const fetchFlights = async () => {
    setLoading(true);
    if (USE_MOCK_DATA) {
        setFlights([{ id: 1, origin: 'New York', destination: 'London', date: '2023-12-25', price: 450, seats: 12 }]);
        setLoading(false);
        return;
    }
    try {
      const res = await fetch(`${API_URL}/flights`);
      const data = await res.json();
      setFlights(data);
    } catch (error) {
      showNotification('Could not connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async (e) => {
    e.preventDefault();
    if (!myBookingsEmail) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/bookings/${myBookingsEmail}`);
      const data = await res.json();
      setMyBookings(data);
      setHasSearchedBookings(true);
    } catch (error) {
      showNotification('Could not fetch bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlight = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/flights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFlight)
      });
      if (res.ok) {
        showNotification('Flight added successfully', 'success');
        fetchFlights();
        setNewFlight({ origin: '', destination: '', date: '', price: '', seats: '' });
      }
    } catch (error) {
      showNotification('Failed to add flight', 'error');
    }
  };

  const handleDeleteFlight = async (id) => {
    try {
      await fetch(`${API_URL}/flights/${id}`, { method: 'DELETE' });
      fetchFlights();
      showNotification('Flight deleted', 'success');
    } catch (error) {
      showNotification('Failed to delete flight', 'error');
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedFlight) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flight_id: selectedFlight.id,
          passenger_name: bookingForm.name,
          email: bookingForm.email,
          flight_details: selectedFlight
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message, 'success');
        setView('my-bookings'); // Redirect to my bookings page
        setMyBookingsEmail(bookingForm.email); // Auto-fill email
        setHasSearchedBookings(false); // Reset search to force user to click or we could auto-fetch
        setBookingForm({ name: '', email: '' });
        fetchFlights(); 
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      showNotification('Booking failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- UTILS ---
  const showNotification = (msg, type) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  // Safe search — never crashes even with bad/missing data
const searchOrigin = (searchTerm.origin || '').toLowerCase();
const searchDest = (searchTerm.destination || '').toLowerCase();

const filteredFlights = flights.filter(flight =>
  (flight.origin || '').toLowerCase().includes(searchOrigin) &&
  (flight.destination || '').toLowerCase().includes(searchDest)
);

  // --- COMPONENTS ---

  const Navbar = () => (
    <nav className="bg-slate-900 text-white shadow-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setView('home')}>
          <div className="bg-emerald-500 p-2 rounded-lg group-hover:bg-emerald-400 transition">
            <Plane className="h-6 w-6 text-slate-900 transform -rotate-45" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Aero<span className="text-emerald-400">Swift</span></span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setView('home')} 
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${view === 'home' ? 'bg-slate-800 text-emerald-400' : 'hover:bg-slate-800 text-gray-300'}`}
          >
            Find Flights
          </button>
          <button 
            onClick={() => setView('my-bookings')} 
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${view === 'my-bookings' ? 'bg-slate-800 text-emerald-400' : 'hover:bg-slate-800 text-gray-300'}`}
          >
            My Bookings
          </button>
          <button 
            onClick={() => setView('admin')} 
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${view === 'admin' ? 'bg-slate-800 text-emerald-400' : 'hover:bg-slate-800 text-gray-300'}`}
          >
            Admin
          </button>
        </div>
      </div>
    </nav>
  );

  const Notification = () => {
    if (!notification) return null;
    return (
      <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl text-white flex items-center space-x-3 animate-fade-in-up z-50 ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
        {notification.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
        <span className="font-medium">{notification.msg}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Navbar />
      <Notification />

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* --- HOME VIEW --- */}
        {view === 'home' && (
          <div className="space-y-10">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-emerald-500 opacity-10 blur-3xl"></div>
               <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>
               
               <h1 className="text-4xl md:text-5xl font-extrabold mb-4 relative z-10">
                 Where will you go <span className="text-emerald-400">next?</span>
               </h1>
               <p className="text-slate-300 mb-8 max-w-2xl mx-auto relative z-10 text-lg">
                 Discover exclusive deals on flights worldwide. Fast booking, secure payments, and instant confirmation.
               </p>

               {/* Search Bar */}
               <div className="bg-white p-4 rounded-2xl shadow-lg max-w-3xl mx-auto flex flex-col md:flex-row gap-4 relative z-10">
                  <div className="flex-1 relative group">
                    <MapPin className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition" size={20} />
                    <input 
                      type="text" 
                      placeholder="Origin City" 
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-medium text-slate-700"
                      value={searchTerm.origin}
                      onChange={(e) => setSearchTerm({...searchTerm, origin: e.target.value})}
                    />
                  </div>
                  <div className="hidden md:flex items-center justify-center text-slate-300">
                    <ArrowRight size={20} />
                  </div>
                  <div className="flex-1 relative group">
                    <MapPin className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition" size={20} />
                    <input 
                      type="text" 
                      placeholder="Destination City" 
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-medium text-slate-700"
                      value={searchTerm.destination}
                      onChange={(e) => setSearchTerm({...searchTerm, destination: e.target.value})}
                    />
                  </div>
               </div>
            </div>

            {/* Flights Grid */}
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <Plane className="mr-2 text-emerald-600" /> Available Flights
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                  <div className="col-span-full py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading...</p>
                  </div>
                ) : filteredFlights.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
                    <p className="text-slate-400 text-lg">No flights found matching your criteria.</p>
                  </div>
                ) : (
                  filteredFlights.map(flight => (
                    <div key={flight.id} className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col">
                      <div className="p-6 pb-4 border-b border-slate-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="flex justify-between items-start relative z-10">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Origin</p>
                            <h4 className="text-xl font-bold text-slate-800">{flight.origin}</h4>
                          </div>
                          <Plane className="text-emerald-400 transform rotate-90 mt-2" />
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Destination</p>
                            <h4 className="text-xl font-bold text-slate-800">{flight.destination}</h4>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 pt-4 flex-grow space-y-4">
                        <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                          <div className="flex items-center">
                             <Calendar className="w-4 h-4 mr-2 text-emerald-500" />
                             {new Date(flight.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center font-semibold">
                             <DollarSign className="w-4 h-4 text-emerald-500" />
                             {flight.price}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm font-medium px-3 py-1 rounded-full ${flight.seats > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                             {flight.seats > 0 ? `${flight.seats} seats left` : 'Sold Out'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 pt-0">
                        <button 
                          disabled={flight.seats <= 0}
                          onClick={() => { setSelectedFlight(flight); setView('booking'); }}
                          className={`w-full py-3 rounded-xl font-bold transition flex justify-center items-center space-x-2 ${
                            flight.seats > 0 ? 'bg-slate-900 text-white hover:bg-emerald-600 shadow-lg hover:shadow-emerald-500/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span>{flight.seats > 0 ? 'Book Ticket' : 'Unavailable'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- BOOKING VIEW --- */}
        {view === 'booking' && selectedFlight && (
          <div className="max-w-4xl mx-auto">
             <button onClick={() => setView('home')} className="mb-6 flex items-center text-slate-500 hover:text-emerald-600 transition font-medium">
               <ArrowRight className="transform rotate-180 mr-2 h-4 w-4" /> Back to Search
             </button>
             <div className="grid md:grid-cols-3 gap-8">
               <div className="md:col-span-1 space-y-6">
                 <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
                   <h3 className="text-lg font-bold text-slate-800 mb-4">Flight Summary</h3>
                   <div className="space-y-4">
                     <div>
                       <p className="text-xs text-slate-400 font-bold uppercase">From</p>
                       <p className="text-lg font-semibold text-slate-700">{selectedFlight.origin}</p>
                     </div>
                     <div className="w-px h-8 bg-slate-200 ml-2"></div>
                     <div>
                       <p className="text-xs text-slate-400 font-bold uppercase">To</p>
                       <p className="text-lg font-semibold text-slate-700">{selectedFlight.destination}</p>
                     </div>
                   </div>
                   <div className="mt-6 pt-6 border-t border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-500">Date</span>
                        <span className="font-medium text-slate-800">{new Date(selectedFlight.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Total Price</span>
                        <span className="font-bold text-xl text-emerald-600">${selectedFlight.price}</span>
                      </div>
                   </div>
                 </div>
               </div>
               <div className="md:col-span-2">
                 <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                   <div className="bg-slate-900 p-8 text-white">
                     <h2 className="text-3xl font-bold">Passenger Details</h2>
                     <p className="text-slate-400 mt-2">Where should we send your ticket?</p>
                   </div>
                   <form onSubmit={handleBooking} className="p-8 space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                          <input required type="text" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                            placeholder="e.g. John Doe" value={bookingForm.name} onChange={e => setBookingForm({...bookingForm, name: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                          <input required type="email" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                            placeholder="e.g. john@example.com" value={bookingForm.email} onChange={e => setBookingForm({...bookingForm, email: e.target.value})}
                          />
                        </div>
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition shadow-lg hover:shadow-emerald-500/30 flex justify-center items-center space-x-2 mt-4">
                        {loading ? 'Processing...' : <span>Confirm Booking</span>}
                      </button>
                   </form>
                 </div>
               </div>
             </div>
          </div>
        )}

        {/* --- MY BOOKINGS VIEW --- */}
        {view === 'my-bookings' && (
          <div className="max-w-4xl mx-auto space-y-8">
             <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
               <h2 className="text-3xl font-bold mb-4">My Bookings</h2>
               <p className="text-slate-400 mb-6">Enter your email address to view your flight history and upcoming trips.</p>
               <form onSubmit={fetchMyBookings} className="flex flex-col md:flex-row gap-4">
                 <div className="flex-1 relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input 
                      type="email" required placeholder="Enter your email" 
                      className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder-slate-500"
                      value={myBookingsEmail} onChange={e => setMyBookingsEmail(e.target.value)}
                    />
                 </div>
                 <button type="submit" className="bg-emerald-500 text-slate-900 font-bold py-3 px-8 rounded-xl hover:bg-emerald-400 transition">
                   Find Tickets
                 </button>
               </form>
             </div>

             {/* Results */}
             {hasSearchedBookings && (
                <div className="space-y-4">
                  {myBookings.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-300">
                      <Ticket className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                      <p className="text-slate-500">No bookings found for this email.</p>
                    </div>
                  ) : (
                    myBookings.map(booking => (
                      <div key={booking.booking_id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
                        {/* Ticket Stub Left */}
                        <div className="bg-emerald-600 p-6 flex flex-col justify-between text-white md:w-48 relative overflow-hidden">
                           <div className="relative z-10">
                             <p className="text-emerald-200 text-xs font-bold uppercase mb-1">Flight</p>
                             <p className="text-2xl font-bold">AS-{booking.booking_id}</p>
                           </div>
                           <div className="relative z-10">
                              <Plane className="h-8 w-8 text-emerald-900 opacity-50 mb-2" />
                              <span className="px-2 py-1 bg-white/20 rounded text-xs backdrop-blur-sm">Confirmed</span>
                           </div>
                           {/* Decorative Circles */}
                           <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white opacity-10"></div>
                           <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-slate-50"></div>
                        </div>

                        {/* Ticket Details Right */}
                        <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative">
                           <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-slate-50 hidden md:block"></div>
                           
                           <div>
                             <p className="text-xs text-slate-400 font-bold uppercase mb-1">Passenger</p>
                             <p className="text-lg font-bold text-slate-800">{booking.passenger_name}</p>
                             <p className="text-sm text-slate-500">{new Date(booking.booking_date).toLocaleDateString()}</p>
                           </div>

                           <div className="space-y-2">
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                                <div>
                                  <span className="text-xs text-slate-400 font-bold uppercase">From </span>
                                  <span className="font-semibold text-slate-700">{booking.origin}</span>
                                </div>
                              </div>
                              <div className="h-4 border-l border-dashed border-slate-300 ml-1"></div>
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                <div>
                                  <span className="text-xs text-slate-400 font-bold uppercase">To </span>
                                  <span className="font-semibold text-slate-700">{booking.destination}</span>
                                </div>
                              </div>
                           </div>

                           <div className="text-right">
                              <p className="text-xs text-slate-400 font-bold uppercase mb-1">Flight Date</p>
                              <p className="text-lg font-bold text-slate-800">{new Date(booking.flight_date).toLocaleDateString()}</p>
                              <p className="text-emerald-600 font-bold mt-1">${booking.price}</p>
                           </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
             )}
          </div>
        )}

        {/* --- ADMIN VIEW --- */}
        {view === 'admin' && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="bg-slate-900 p-6 flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-white flex items-center">
                   <div className="bg-emerald-500 p-1.5 rounded-lg mr-3">
                     <Plus className="h-5 w-5 text-slate-900" />
                   </div>
                   Flight Management
                 </h2>
              </div>
              <div className="p-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-10">
                   <h3 className="font-bold text-slate-700 mb-4">Add New Flight Route</h3>
                   <form onSubmit={handleAddFlight} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                     <input required placeholder="Origin" className="p-3 rounded-xl border border-slate-200" value={newFlight.origin} onChange={e => setNewFlight({...newFlight, origin: e.target.value})} />
                     <input required placeholder="Destination" className="p-3 rounded-xl border border-slate-200" value={newFlight.destination} onChange={e => setNewFlight({...newFlight, destination: e.target.value})} />
                     <input required type="date" className="p-3 rounded-xl border border-slate-200" value={newFlight.date} onChange={e => setNewFlight({...newFlight, date: e.target.value})} />
                     <input required type="number" placeholder="Price" className="p-3 rounded-xl border border-slate-200" value={newFlight.price} onChange={e => setNewFlight({...newFlight, price: e.target.value})} />
                     <input required type="number" placeholder="Seats" className="p-3 rounded-xl border border-slate-200" value={newFlight.seats} onChange={e => setNewFlight({...newFlight, seats: e.target.value})} />
                     <button type="submit" className="lg:col-span-1 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition">Add</button>
                   </form>
                </div>
                <h3 className="font-bold text-slate-700 mb-4">Current Flight Schedule</h3>
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-4">Origin</th>
                        <th className="p-4">Destination</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Seats</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {flights.map(flight => (
                        <tr key={flight.id} className="hover:bg-slate-50 transition">
                          <td className="p-4 font-medium text-slate-800">{flight.origin}</td>
                          <td className="p-4 font-medium text-slate-800">{flight.destination}</td>
                          <td className="p-4 text-slate-500">{new Date(flight.date).toLocaleDateString()}</td>
                          <td className="p-4 font-bold text-emerald-600">${flight.price}</td>
                          <td className="p-4 text-slate-500">{flight.seats}</td>
                          <td className="p-4 text-center">
                            <button onClick={() => handleDeleteFlight(flight.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}