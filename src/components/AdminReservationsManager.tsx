import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  Phone,
  History,
  Check,
  X,
  Plus,
  RefreshCw,
  Utensils,
  ChevronRight,
  UserCheck,
  UserX,
  Edit3,
} from 'lucide-react';
import {
  Reservation,
  ReservationStatus,
  RestaurantTable,
  ReservationEvent,
} from '../types/restaurant';
import {
  updateReservation,
  subscribeTables,
  saveTable,
  deleteTable,
  checkTableConflict,
  logReservationEvent,
  getReservationEvents,
  logNotification,
} from '../services/dbService';
import {
  formatTime12h,
  cleanIndianMobile,
  DEFAULT_TABLES,
  generateReservationConfirmedWhatsAppMessage,
  generateReservationRejectedWhatsAppMessage,
  generateTableChangedWhatsAppMessage,
  createCustomerWhatsAppNotificationUrl,
} from '../config/restaurantConfig';

interface AdminReservationsManagerProps {
  reservations: Reservation[];
}

export const AdminReservationsManager: React.FC<AdminReservationsManagerProps> = ({
  reservations,
}) => {
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  // Tables subscription
  const [tables, setTables] = useState<RestaurantTable[]>(DEFAULT_TABLES);
  useEffect(() => {
    const unsub = subscribeTables((data) => setTables(data));
    return () => unsub();
  }, []);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilterMode, setDateFilterMode] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState(getTodayString());

  // Confirm / Assign Table Modal State
  const [confirmModalRes, setConfirmModalRes] = useState<Reservation | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [confirmNotes, setConfirmNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  // Reject Modal State
  const [rejectModalRes, setRejectModalRes] = useState<Reservation | null>(null);
  const [rejectReason, setRejectReason] = useState('Tables fully committed for this dining slot');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Timeline / Details Modal State
  const [detailModalRes, setDetailModalRes] = useState<Reservation | null>(null);
  const [events, setEvents] = useState<ReservationEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Manage Tables Drawer / Modal State
  const [isTablesModalOpen, setIsTablesModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableLocation, setNewTableLocation] = useState('Indoor AC Main Hall');
  const [isAddingTable, setIsAddingTable] = useState(false);

  // Load events when detail modal opens
  useEffect(() => {
    if (!detailModalRes) {
      setEvents([]);
      return;
    }
    setLoadingEvents(true);
    getReservationEvents(detailModalRes.id)
      .then((evts) => setEvents(evts))
      .catch((err) => console.error('Failed to load events:', err))
      .finally(() => setLoadingEvents(false));
  }, [detailModalRes]);

  // Preselect best-fit table when confirm modal opens
  useEffect(() => {
    if (!confirmModalRes) return;
    setConfirmNotes(confirmModalRes.specialRequest || '');
    if (confirmModalRes.assignedTableId) {
      setSelectedTableId(confirmModalRes.assignedTableId);
    } else {
      const neededGuests = confirmModalRes.guests || confirmModalRes.guestCount || 2;
      const sortedByCap = [...tables]
        .filter((t) => t.isActive !== false)
        .sort((a, b) => a.capacity - b.capacity);
      const best = sortedByCap.find((t) => t.capacity >= neededGuests) || sortedByCap[0];
      setSelectedTableId(best ? best.tableId : '');
    }
  }, [confirmModalRes, tables]);

  // Statistics
  const stats = useMemo(() => {
    const total = reservations.length;
    const pending = reservations.filter((r) => r.status === 'PENDING').length;
    const confirmed = reservations.filter((r) => r.status === 'CONFIRMED').length;
    const seated = reservations.filter((r) => r.status === 'SEATED').length;
    const completed = reservations.filter((r) => r.status === 'COMPLETED').length;
    const cancelled = reservations.filter((r) => r.status === 'CANCELLED' || r.status === 'REJECTED').length;
    const noShow = reservations.filter((r) => r.status === 'NO_SHOW').length;
    return { total, pending, confirmed, seated, completed, cancelled, noShow };
  }, [reservations]);

  // Filtered list
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && res.status !== statusFilter) return false;

      // 2. Date Filter
      const resDate = res.bookingDate || res.date;
      if (dateFilterMode === 'TODAY' && resDate !== getTodayString()) return false;
      if (dateFilterMode === 'TOMORROW' && resDate !== getTomorrowString()) return false;
      if (dateFilterMode === 'CUSTOM' && resDate !== customDate) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (res.reservationNumber || res.reservationId || '').toLowerCase();
        const name = (res.customerName || res.name || '').toLowerCase();
        const phone = (res.customerPhone || res.phone || '');
        const email = (res.customerEmail || res.email || '').toLowerCase();
        const matchNum = num.includes(q);
        const matchName = name.includes(q);
        const matchPhone = phone.includes(q);
        const matchEmail = email.includes(q);
        return matchNum || matchName || matchPhone || matchEmail;
      }

      return true;
    });
  }, [reservations, statusFilter, dateFilterMode, customDate, searchQuery]);

  // Table conflict check for selected table in modal
  const conflictInfo = useMemo(() => {
    if (!confirmModalRes || !selectedTableId) return { hasConflict: false };
    const date = confirmModalRes.bookingDate || confirmModalRes.date;
    const time = confirmModalRes.bookingTime || confirmModalRes.time;
    return checkTableConflict(selectedTableId, date, time, reservations, 90, confirmModalRes.id);
  }, [confirmModalRes, selectedTableId, reservations]);

  // Confirm / Accept Action
  const handleExecuteConfirm = async () => {
    if (!confirmModalRes) return;
    setIsConfirming(true);

    try {
      const chosenTable = tables.find((t) => t.tableId === selectedTableId);
      const updates: Partial<Reservation> = {
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString(),
        assignedTableId: chosenTable?.tableId,
        assignedTableNumber: chosenTable?.tableNumber,
        assignedTableLocation: chosenTable?.location,
        specialRequest: confirmNotes.trim() || confirmModalRes.specialRequest,
      };

      await updateReservation(confirmModalRes.id, updates);

      await logReservationEvent({
        reservationId: confirmModalRes.id,
        eventType: 'CONFIRMED',
        actor: 'MANAGER',
        description: `Reservation confirmed by restaurant manager. Table assigned: ${chosenTable?.tableNumber || 'Pending'} (${chosenTable?.location || ''}).`,
        metadata: {
          tableNumber: chosenTable?.tableNumber,
          tableId: chosenTable?.tableId,
        },
      });

      // Prepare WhatsApp notification message URL
      const phone = cleanIndianMobile(confirmModalRes.customerPhone || confirmModalRes.phone);
      if (phone) {
        const msg = generateReservationConfirmedWhatsAppMessage({
          reservationNumber: confirmModalRes.reservationNumber || confirmModalRes.reservationId,
          customerName: confirmModalRes.customerName || confirmModalRes.name,
          bookingDate: confirmModalRes.bookingDate || confirmModalRes.date,
          bookingTime: confirmModalRes.bookingTime || confirmModalRes.time,
          guestCount: confirmModalRes.guestCount || confirmModalRes.guests,
          assignedTableNumber: chosenTable?.tableNumber,
        });

        await logNotification({
          reservationId: confirmModalRes.id,
          customerPhone: phone,
          channel: 'WHATSAPP',
          templateType: 'CONFIRMATION',
          status: 'SENT',
          messagePayload: msg,
        });

        const notifyUrl = createCustomerWhatsAppNotificationUrl(phone, msg);
        window.open(notifyUrl, '_blank', 'noopener,noreferrer');
      }

      setConfirmModalRes(null);
    } catch (err: any) {
      console.error('Error confirming reservation:', err);
      alert('Failed to confirm reservation: ' + (err.message || err));
    } finally {
      setIsConfirming(false);
    }
  };

  // Reject Action
  const handleExecuteReject = async () => {
    if (!rejectModalRes) return;
    setIsRejecting(true);

    try {
      const finalReason =
        rejectReason === 'Other' ? customRejectReason.trim() || 'Unable to accommodate at this time' : rejectReason;

      const updates: Partial<Reservation> = {
        status: 'REJECTED',
        rejectionReason: finalReason,
        cancelledAt: new Date().toISOString(),
      };

      await updateReservation(rejectModalRes.id, updates);

      await logReservationEvent({
        reservationId: rejectModalRes.id,
        eventType: 'REJECTED',
        actor: 'MANAGER',
        description: `Booking enquiry rejected by manager. Reason: ${finalReason}`,
        metadata: { reason: finalReason },
      });

      const phone = cleanIndianMobile(rejectModalRes.customerPhone || rejectModalRes.phone);
      if (phone) {
        const msg = generateReservationRejectedWhatsAppMessage({
          reservationNumber: rejectModalRes.reservationNumber || rejectModalRes.reservationId,
          customerName: rejectModalRes.customerName || rejectModalRes.name,
          bookingDate: rejectModalRes.bookingDate || rejectModalRes.date,
          bookingTime: rejectModalRes.bookingTime || rejectModalRes.time,
          rejectionReason: finalReason,
        });

        await logNotification({
          reservationId: rejectModalRes.id,
          customerPhone: phone,
          channel: 'WHATSAPP',
          templateType: 'REJECTION',
          status: 'SENT',
          messagePayload: msg,
        });

        const notifyUrl = createCustomerWhatsAppNotificationUrl(phone, msg);
        window.open(notifyUrl, '_blank', 'noopener,noreferrer');
      }

      setRejectModalRes(null);
    } catch (err: any) {
      console.error('Error rejecting reservation:', err);
      alert('Failed to update reservation: ' + (err.message || err));
    } finally {
      setIsRejecting(false);
    }
  };

  // Quick Status Transition Handler
  const handleStatusTransition = async (res: Reservation, newStatus: ReservationStatus) => {
    try {
      const updates: Partial<Reservation> = { status: newStatus };
      if (newStatus === 'SEATED') updates.seatedAt = new Date().toISOString();
      if (newStatus === 'COMPLETED') updates.completedAt = new Date().toISOString();
      if (newStatus === 'CANCELLED') updates.cancelledAt = new Date().toISOString();

      await updateReservation(res.id, updates);

      await logReservationEvent({
        reservationId: res.id,
        eventType: newStatus === 'SEATED' ? 'SEATED' : newStatus === 'COMPLETED' ? 'COMPLETED' : 'STATUS_CHANGE',
        actor: 'MANAGER',
        description: `Reservation status changed to ${newStatus} by manager.`,
      });
    } catch (err: any) {
      console.error('Failed to change status:', err);
      alert('Failed to update status: ' + (err.message || err));
    }
  };

  // Add Dining Table
  const handleAddNewTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;
    setIsAddingTable(true);
    try {
      const tableId = `tbl_${Date.now()}`;
      await saveTable({
        tableId,
        tableNumber: newTableNumber.trim().toUpperCase(),
        capacity: Number(newTableCapacity),
        location: newTableLocation.trim() || 'Indoor AC Main Hall',
        status: 'AVAILABLE',
        isActive: true,
      });
      setNewTableNumber('');
      setNewTableCapacity(4);
    } catch (err: any) {
      console.error('Failed to add table:', err);
    } finally {
      setIsAddingTable(false);
    }
  };

  // Status badge style helper
  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70';
      case 'SEATED':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/70';
      case 'COMPLETED':
        return 'bg-teal-950/80 text-teal-300 border-teal-500/70';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/70';
      case 'NO_SHOW':
        return 'bg-zinc-800 text-zinc-400 border-zinc-600';
      default:
        return 'bg-amber-950/80 text-amber-300 border-amber-500/70 animate-pulse';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#224d3b] pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#f6f3ed]">
              Reservation & Table Management
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#15382a] border border-[#d4af37] text-[10px] sm:text-[11px] font-bold text-[#d4af37] whitespace-nowrap">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-[#8ea098] mt-1 break-words">
            Accept or reject booking enquiries, assign tables, detect seat conflicts, and trigger customer WhatsApp notifications.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsTablesModalOpen(true)}
            className="w-full sm:w-auto px-3 py-2 rounded-lg bg-[#15382a] hover:bg-[#1d4b38] border border-[#224d3b] hover:border-[#d4af37] text-xs font-semibold text-[#f6f3ed] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Utensils className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Manage Dining Tables ({tables.length})</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'ALL'
              ? 'bg-[#15382a] border-[#d4af37]'
              : 'bg-[#091711] border-[#224d3b] hover:border-[#8ea098]'
          }`}
        >
          <span className="text-[10px] text-[#8ea098] block uppercase font-bold tracking-wider truncate">All Bookings</span>
          <span className="text-lg sm:text-xl font-bold font-serif text-[#f6f3ed]">{stats.total}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('PENDING')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'PENDING'
              ? 'bg-amber-950/40 border-amber-400'
              : 'bg-[#091711] border-[#224d3b] hover:border-amber-500/50'
          }`}
        >
          <span className="text-[10px] text-amber-400 block uppercase font-bold tracking-wider truncate">Pending</span>
          <span className="text-lg sm:text-xl font-bold font-serif text-amber-400">{stats.pending}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('CONFIRMED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'CONFIRMED'
              ? 'bg-emerald-950/40 border-emerald-400'
              : 'bg-[#091711] border-[#224d3b] hover:border-emerald-500/50'
          }`}
        >
          <span className="text-[10px] text-emerald-400 block uppercase font-bold tracking-wider truncate">Confirmed</span>
          <span className="text-lg sm:text-xl font-bold font-serif text-emerald-400">{stats.confirmed}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('SEATED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'SEATED'
              ? 'bg-blue-950/40 border-blue-400'
              : 'bg-[#091711] border-[#224d3b] hover:border-blue-500/50'
          }`}
        >
          <span className="text-[10px] text-blue-400 block uppercase font-bold tracking-wider truncate">Seated</span>
          <span className="text-lg sm:text-xl font-bold font-serif text-blue-400">{stats.seated}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'COMPLETED'
              ? 'bg-teal-950/40 border-teal-400'
              : 'bg-[#091711] border-[#224d3b] hover:border-teal-500/50'
          }`}
        >
          <span className="text-[10px] text-teal-400 block uppercase font-bold tracking-wider truncate">Completed</span>
          <span className="text-lg sm:text-xl font-bold font-serif text-teal-400">{stats.completed}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-950/40 border-rose-400'
              : 'bg-[#091711] border-[#224d3b] hover:border-rose-500/50'
          }`}
        >
          <span className="text-[10px] text-rose-400 block uppercase font-bold tracking-wider truncate">Rejected</span>
          <span className="text-lg sm:text-xl font-bold font-serif text-rose-400">{stats.cancelled}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#091711] border border-[#224d3b] rounded-xl p-3 sm:p-4 space-y-3 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-5 relative min-w-0">
            <Search className="w-3.5 h-3.5 text-[#d4af37] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, mobile, reservation #..."
              className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-lg pl-9 pr-8 py-2 text-xs text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8ea098] hover:text-[#f6f3ed]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="md:col-span-3 flex items-center space-x-1.5 min-w-0">
            <Filter className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg px-2.5 py-2 text-xs text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
            >
              <option value="ALL">All Statuses ({reservations.length})</option>
              <option value="PENDING">PENDING (Enquiries)</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="SEATED">SEATED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="NO_SHOW">NO SHOW</option>
            </select>
          </div>

          {/* Date Filter Buttons */}
          <div className="md:col-span-4 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDateFilterMode('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                dateFilterMode === 'ALL'
                  ? 'bg-[#d4af37] text-[#091711]'
                  : 'bg-[#15382a] text-[#c8c0b2] hover:text-[#f6f3ed]'
              }`}
            >
              All Dates
            </button>
            <button
              type="button"
              onClick={() => setDateFilterMode('TODAY')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                dateFilterMode === 'TODAY'
                  ? 'bg-[#d4af37] text-[#091711]'
                  : 'bg-[#15382a] text-[#c8c0b2] hover:text-[#f6f3ed]'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilterMode('TOMORROW')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                dateFilterMode === 'TOMORROW'
                  ? 'bg-[#d4af37] text-[#091711]'
                  : 'bg-[#15382a] text-[#c8c0b2] hover:text-[#f6f3ed]'
              }`}
            >
              Tomorrow
            </button>
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDateFilterMode('CUSTOM');
              }}
              className={`px-2 py-1 bg-[#15382a] border rounded-lg text-xs text-[#f6f3ed] focus:outline-none ${
                dateFilterMode === 'CUSTOM' ? 'border-[#d4af37]' : 'border-[#224d3b]'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <div className="p-12 text-center bg-[#091711] border border-[#224d3b] rounded-2xl space-y-3">
          <Calendar className="w-10 h-10 text-[#8ea098] mx-auto opacity-50" />
          <h4 className="font-serif text-base font-bold text-[#f6f3ed]">No Reservations Found</h4>
          <p className="text-xs text-[#8ea098] max-w-sm mx-auto">
            No booking requests match your active search and filter criteria. Try adjusting the status or date selector.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReservations.map((res) => {
            const dateStr = res.bookingDate || res.date;
            const timeStr = res.bookingTime || res.time;
            const guestCount = res.guestCount || res.guests;
            const customerName = res.customerName || res.name;
            const customerPhone = res.customerPhone || res.phone;
            const customerEmail = res.customerEmail || res.email;
            const refNumber = res.reservationNumber || res.reservationId;

            // Generate WhatsApp notification link
            const cleanPhone = cleanIndianMobile(customerPhone);
            const waMsg =
              res.status === 'CONFIRMED'
                ? generateReservationConfirmedWhatsAppMessage({
                    reservationNumber: refNumber,
                    customerName,
                    bookingDate: dateStr,
                    bookingTime: timeStr,
                    guestCount,
                    assignedTableNumber: res.assignedTableNumber,
                  })
                : res.status === 'REJECTED'
                ? generateReservationRejectedWhatsAppMessage({
                    reservationNumber: refNumber,
                    customerName,
                    bookingDate: dateStr,
                    bookingTime: timeStr,
                    rejectionReason: res.rejectionReason,
                  })
                : '';
            const waUrl = cleanPhone && waMsg ? createCustomerWhatsAppNotificationUrl(cleanPhone, waMsg) : null;

            return (
              <div
                key={res.id}
                className="bg-[#091711] border border-[#224d3b] hover:border-[#d4af37]/60 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md transition-all flex flex-col justify-between min-w-0"
              >
                {/* Header: ID, Name, Status */}
                <div className="flex flex-wrap items-start justify-between gap-2.5 border-b border-[#224d3b] pb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-mono text-xs font-bold text-[#d4af37] bg-[#15382a] px-2 py-0.5 rounded border border-[#224d3b] whitespace-nowrap">
                        {refNumber}
                      </span>
                      {res.occasion && (
                        <span className="text-[10px] sm:text-[11px] font-semibold text-amber-200 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-600/40 whitespace-nowrap">
                          🎉 {res.occasion}
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif font-bold text-sm sm:text-base text-[#f6f3ed] mt-1 break-words">
                      {customerName}
                    </h4>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 whitespace-nowrap ${getStatusBadge(
                      res.status
                    )}`}
                  >
                    {res.status}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] text-[#8ea098] flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-[#d4af37] shrink-0" />
                      <span>Date & Time</span>
                    </span>
                    <p className="font-semibold text-[#f6f3ed] break-words">
                      {dateStr} • {formatTime12h(timeStr)}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] text-[#8ea098] flex items-center space-x-1">
                      <Users className="w-3 h-3 text-[#d4af37] shrink-0" />
                      <span>Party Size</span>
                    </span>
                    <p className="font-semibold text-[#f6f3ed]">
                      {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] text-[#8ea098] flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-[#d4af37] shrink-0" />
                      <span>Mobile</span>
                    </span>
                    <a
                      href={`tel:+91${cleanPhone}`}
                      className="font-semibold text-[#d4af37] hover:underline block truncate"
                    >
                      +91 {customerPhone}
                    </a>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] text-[#8ea098] flex items-center space-x-1">
                      <Utensils className="w-3 h-3 text-[#d4af37] shrink-0" />
                      <span>Assigned Table</span>
                    </span>
                    {res.assignedTableNumber ? (
                      <span className="font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40 inline-block">
                        Table #{res.assignedTableNumber}
                      </span>
                    ) : (
                      <span className="text-amber-400 italic text-[11px]">
                        Not Assigned Yet
                      </span>
                    )}
                  </div>

                  {customerEmail && (
                    <div className="col-span-1 sm:col-span-2 text-[11px] text-[#8ea098] break-all">
                      <span>Email: </span>
                      <span className="text-[#f6f3ed]">{customerEmail}</span>
                    </div>
                  )}

                  {res.specialRequest && (
                    <div className="col-span-1 sm:col-span-2 p-2.5 rounded-lg bg-[#15382a]/40 border border-[#224d3b] text-xs">
                      <span className="text-[#d4af37] font-semibold block text-[10px] uppercase">
                        Guest Request:
                      </span>
                      <p className="text-[#f6f3ed] italic mt-0.5 break-words">"{res.specialRequest}"</p>
                    </div>
                  )}

                  {res.rejectionReason && (
                    <div className="col-span-1 sm:col-span-2 p-2.5 rounded-lg bg-rose-950/50 border border-rose-600/50 text-xs">
                      <span className="text-rose-400 font-semibold block text-[10px] uppercase">
                        Rejection Reason:
                      </span>
                      <p className="text-rose-200 mt-0.5 break-words">{res.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-[#224d3b] space-y-2">
                  {/* Primary Workflow Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* If PENDING: Confirm Table or Reject */}
                    {res.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirmModalRes(res)}
                          className="flex-1 min-w-[140px] py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow transition-all cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Accept & Assign Table</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectModalRes(res)}
                          className="py-2 px-3 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-200 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {/* If CONFIRMED: Table Change & Lifecycle status */}
                    {res.status === 'CONFIRMED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirmModalRes(res)}
                          className="py-1.5 px-2.5 rounded-lg bg-[#15382a] hover:bg-[#1f4e3b] border border-[#224d3b] hover:border-[#d4af37] text-xs font-semibold text-[#f6f3ed] flex items-center space-x-1 cursor-pointer"
                          title="Change Table Allocation"
                        >
                          <Edit3 className="w-3 h-3 text-[#d4af37] shrink-0" />
                          <span>Change Table</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusTransition(res, 'SEATED')}
                          className="py-1.5 px-2.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-500/50 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3 shrink-0" />
                          <span>Guest Arrived / Seated</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusTransition(res, 'COMPLETED')}
                          className="py-1.5 px-2.5 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-500/50 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3 shrink-0" />
                          <span>Completed</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusTransition(res, 'NO_SHOW')}
                          className="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                          title="Mark Customer as No-Show"
                        >
                          <UserX className="w-3 h-3 shrink-0" />
                          <span>No-Show</span>
                        </button>
                      </>
                    )}

                    {/* If SEATED: Complete */}
                    {res.status === 'SEATED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusTransition(res, 'COMPLETED')}
                        className="flex-1 py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow"
                      >
                        <Check className="w-4 h-4 shrink-0" />
                        <span>Mark Dining Completed</span>
                      </button>
                    )}
                  </div>

                  {/* Secondary Actions: WhatsApp notify, Call, View Audit Timeline */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {/* WhatsApp Notification Link */}
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 text-xs font-medium flex items-center space-x-1.5 transition-colors"
                          title="Send Official Status Update via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>WhatsApp Guest</span>
                        </a>
                      )}

                      {/* Direct Phone Call */}
                      <a
                        href={`tel:+91${cleanPhone}`}
                        className="py-1.5 px-2.5 rounded-lg bg-[#15382a] hover:bg-[#1d4b38] text-[#c8c0b2] hover:text-[#f6f3ed] border border-[#224d3b] text-xs font-medium flex items-center space-x-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                        <span>Call</span>
                      </a>
                    </div>

                    {/* Activity Timeline Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => setDetailModalRes(res)}
                      className="py-1.5 px-2.5 rounded-lg bg-[#15382a] hover:bg-[#1f4e3b] text-[#8ea098] hover:text-[#d4af37] border border-[#224d3b] text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 shrink-0" />
                      <span>History</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: ACCEPT & ASSIGN TABLE MODAL                         */}
      {/* ============================================================ */}
      {confirmModalRes && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-[#0f271d] border border-[#224d3b] rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setConfirmModalRes(null)}
              className="absolute top-4 right-4 text-[#8ea098] hover:text-[#f6f3ed]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider">
                Table Allocation & Confirmation
              </span>
              <h3 className="font-serif text-xl font-bold text-[#f6f3ed]">
                Confirm Reservation: {confirmModalRes.customerName || confirmModalRes.name}
              </h3>
              <p className="text-xs text-[#8ea098]">
                {confirmModalRes.bookingDate || confirmModalRes.date} at{' '}
                {formatTime12h(confirmModalRes.bookingTime || confirmModalRes.time)} •{' '}
                {confirmModalRes.guestCount || confirmModalRes.guests} Guests
              </p>
            </div>

            {/* Table Selection Dropdown */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#c8c0b2]">
                Select Dining Table <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full bg-[#15382a] border border-[#224d3b] focus:border-[#d4af37] rounded-xl px-3.5 py-3 text-sm text-[#f6f3ed] focus:outline-none"
              >
                {tables
                  .filter((t) => t.isActive !== false)
                  .map((tbl) => {
                    const partySize = confirmModalRes.guestCount || confirmModalRes.guests || 2;
                    const isTooSmall = tbl.capacity < partySize;
                    return (
                      <option key={tbl.tableId} value={tbl.tableId}>
                        Table #{tbl.tableNumber} — Capacity: {tbl.capacity} Seats ({tbl.location})
                        {isTooSmall ? ' [⚠️ Under Party Size]' : ''}
                      </option>
                    );
                  })}
              </select>

              {/* Conflict Warning */}
              {conflictInfo.hasConflict && (
                <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/80 text-red-200 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Double-Booking Conflict Detected!</span>
                    <span>
                      Table is already confirmed for{' '}
                      <strong>{conflictInfo.conflictingReservation?.customerName || conflictInfo.conflictingReservation?.name}</strong> at{' '}
                      {conflictInfo.conflictingReservation?.bookingTime || conflictInfo.conflictingReservation?.time}.
                      Please assign a different table to prevent customer overlap.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation Notes / Special Arrangements */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#c8c0b2]">
                Manager Notes / Seating Instructions
              </label>
              <textarea
                rows={2}
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                placeholder="e.g. Set up high chair, birthday candle prepared, AC bay reserved..."
                className="w-full bg-[#15382a] border border-[#224d3b] focus:border-[#d4af37] rounded-xl p-3 text-xs text-[#f6f3ed] focus:outline-none placeholder-[#8ea098]"
              />
            </div>

            {/* Automatic WhatsApp Trigger Notice */}
            <div className="p-3 rounded-xl bg-[#091711] border border-[#224d3b] text-xs text-[#8ea098] flex items-start space-x-2">
              <MessageCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                Saving confirmation automatically logs the audit event and opens WhatsApp pre-filled with the official confirmation details for <strong>+91 {confirmModalRes.customerPhone || confirmModalRes.phone}</strong>.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalRes(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#15382a] hover:bg-[#1d4b38] text-xs font-semibold text-[#c8c0b2]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isConfirming || !selectedTableId}
                onClick={handleExecuteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {isConfirming ? (
                  <span>Saving & Notifying...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm & Notify Guest</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: REJECT RESERVATION MODAL (MANDATORY REASON)         */}
      {/* ============================================================ */}
      {rejectModalRes && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-[#0f271d] border border-[#224d3b] rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setRejectModalRes(null)}
              className="absolute top-4 right-4 text-[#8ea098] hover:text-[#f6f3ed]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                Decline Booking Request
              </span>
              <h3 className="font-serif text-lg font-bold text-[#f6f3ed] break-words">
                Reject Enquiry: {rejectModalRes.customerName || rejectModalRes.name}
              </h3>
              <p className="text-xs text-[#8ea098]">
                A mandatory explanation is recorded in the audit trail and sent to the customer via WhatsApp.
              </p>
            </div>

            {/* Predefined Reasons */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#c8c0b2]">
                Reason for Rejection <span className="text-red-400">*</span>
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-[#15382a] border border-[#224d3b] focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-[#f6f3ed] focus:outline-none"
              >
                <option value="Tables fully committed for this dining slot">
                  Tables fully committed for this dining slot
                </option>
                <option value="Restaurant closed for private banquet celebration">
                  Restaurant closed for private banquet celebration
                </option>
                <option value="Requested time is outside dine-in kitchen hours">
                  Requested time is outside dine-in kitchen hours
                </option>
                <option value="Kitchen maintenance & sanitation in progress">
                  Kitchen maintenance & sanitation in progress
                </option>
                <option value="Duplicate booking enquiry entry">
                  Duplicate booking enquiry entry
                </option>
                <option value="Other">Other Custom Reason</option>
              </select>
            </div>

            {/* Custom Reason Field */}
            {rejectReason === 'Other' && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#c8c0b2]">
                  Specific Reason Detail
                </label>
                <input
                  type="text"
                  required
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  placeholder="Type specific explanation..."
                  className="w-full bg-[#15382a] border border-[#224d3b] focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-[#f6f3ed] focus:outline-none"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalRes(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#15382a] hover:bg-[#1d4b38] text-xs font-semibold text-[#c8c0b2]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRejecting || (rejectReason === 'Other' && !customRejectReason.trim())}
                onClick={handleExecuteReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {isRejecting ? <span>Rejecting...</span> : <span>Confirm Rejection</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: TIMELINE & AUDIT HISTORY MODAL                      */}
      {/* ============================================================ */}
      {detailModalRes && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-[#0f271d] border border-[#224d3b] rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
            <button
              onClick={() => setDetailModalRes(null)}
              className="absolute top-4 right-4 text-[#8ea098] hover:text-[#f6f3ed]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-[#d4af37] font-bold">
                {detailModalRes.reservationNumber || detailModalRes.reservationId}
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#f6f3ed]">
                Reservation Activity Timeline
              </h3>
              <p className="text-xs text-[#8ea098] break-words">
                {detailModalRes.customerName || detailModalRes.name} • +91{' '}
                {detailModalRes.customerPhone || detailModalRes.phone}
              </p>
            </div>

            {/* Timeline Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[180px]">
              {loadingEvents ? (
                <div className="p-8 text-center text-xs text-[#8ea098]">
                  Loading audit log history...
                </div>
              ) : events.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8ea098] bg-[#091711] rounded-xl border border-[#224d3b]">
                  No recorded timeline events for this booking yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((evt) => (
                    <div
                      key={evt.eventId}
                      className="p-3 bg-[#091711] rounded-xl border border-[#224d3b] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#d4af37]">{evt.eventType}</span>
                        <span className="text-[10px] text-[#8ea098] whitespace-nowrap">
                          {new Date(evt.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[#f6f3ed] break-words">{evt.description}</p>
                      <div className="text-[10px] text-[#8ea098] pt-1">
                        Actor: <span className="font-semibold text-amber-200">{evt.actor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setDetailModalRes(null)}
              className="w-full py-2.5 rounded-xl bg-[#15382a] hover:bg-[#1d4b38] text-xs font-semibold text-[#f6f3ed]"
            >
              Close History
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: MANAGE RESTAURANT TABLES DRAWER/MODAL               */}
      {/* ============================================================ */}
      {isTablesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-[#0f271d] border border-[#224d3b] rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
            <button
              onClick={() => setIsTablesModalOpen(false)}
              className="absolute top-4 right-4 text-[#8ea098] hover:text-[#f6f3ed]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider">
                Restaurant Seating Configuration
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#f6f3ed]">
                Manage Dining Tables
              </h3>
              <p className="text-xs text-[#8ea098]">
                Configure restaurant floor plan, table capacities, and sections at Hot Wok Asian Cuisine.
              </p>
            </div>

            {/* Add Table Form */}
            <form
              onSubmit={handleAddNewTable}
              className="p-3 sm:p-4 bg-[#091711] border border-[#224d3b] rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2.5 sm:gap-3 items-end"
            >
              <div>
                <label className="block text-[10px] font-bold text-[#8ea098] mb-1">
                  Table No. (e.g. T11)
                </label>
                <input
                  type="text"
                  required
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="T11"
                  className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg px-2.5 py-1.5 text-xs text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8ea098] mb-1">
                  Capacity (Seats)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                  className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg px-2.5 py-1.5 text-xs text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8ea098] mb-1">
                  Zone / Section
                </label>
                <input
                  type="text"
                  value={newTableLocation}
                  onChange={(e) => setNewTableLocation(e.target.value)}
                  placeholder="Indoor AC / Booth"
                  className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg px-2.5 py-1.5 text-xs text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isAddingTable}
                  className="w-full py-2 px-3 rounded-lg bg-[#d4af37] hover:bg-[#c49f2e] text-[#091711] font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer transition-colors shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Table</span>
                </button>
              </div>
            </form>

            {/* Tables Grid */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tables.map((tbl) => (
                  <div
                    key={tbl.tableId}
                    className="p-3 bg-[#091711] border border-[#224d3b] rounded-xl flex items-center justify-between text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-[#d4af37] whitespace-nowrap">
                          Table #{tbl.tableNumber}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#15382a] text-[#8ea098] border border-[#224d3b] whitespace-nowrap">
                          {tbl.capacity} Seats
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8ea098] block mt-0.5 truncate">
                        {tbl.location}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          saveTable({ ...tbl, isActive: tbl.isActive === false ? true : false })
                        }
                        className={`text-[10px] font-bold px-2 py-1 rounded border cursor-pointer ${
                          tbl.isActive !== false
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-600'
                        }`}
                      >
                        {tbl.isActive !== false ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTablesModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#15382a] hover:bg-[#1d4b38] text-xs font-semibold text-[#f6f3ed]"
            >
              Done Managing Tables
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
