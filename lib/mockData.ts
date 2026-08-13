/**
 * Hotel Kaoba Command Center — local mock data.
 * Everything here is fabricated for demo purposes. No live PMS, OTA, or
 * payment connection exists. Dates are stored as day-offsets from "today"
 * so the calendar and dashboards always look current whenever the demo runs.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoomType = "Bungalow" | "Standard Room" | "Poolside Room" | "Suite";

export type RoomStatus = "Available" | "Occupied" | "Dirty" | "Maintenance" | "Reserved";

export type CleaningStatus = "Clean" | "Dirty" | "In Progress" | "Inspected";

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  status: RoomStatus;
  currentGuest?: string;
  nextArrivalOffset?: number;
  cleaningStatus: CleaningStatus;
  rateTonight: number;
  floorNote?: string;
}

export type ReservationStatus =
  | "Confirmed"
  | "Checked In"
  | "Pending"
  | "Maintenance Block"
  | "Courtesy Hold";

export type BookingSource = "Direct" | "Airbnb" | "Booking.com" | "Walk-in" | "WhatsApp";

export type PaymentStatus = "Paid" | "Partial" | "Unpaid";

export interface Reservation {
  id: string;
  guestName: string;
  guestId?: string;
  roomId: string;
  roomNumber: string;
  roomType: RoomType;
  startOffset: number;
  endOffset: number;
  status: ReservationStatus;
  guestsCount: number;
  source: BookingSource;
  paymentStatus: PaymentStatus;
  notes: string;
  /** Set once a front-desk checkout has been processed. Kept separate from
   *  `status` so the calendar legend stays limited to the 5 core statuses. */
  checkedOut?: boolean;
}

export type FollowUpStatus = "None" | "Due" | "Scheduled" | "Completed";

export interface StayRecord {
  dateOffset: number;
  room: string;
  nights: number;
}

export interface Guest {
  id: string;
  name: string;
  country: string;
  phone: string;
  email: string;
  lastStayOffset: number;
  totalStays: number;
  source: BookingSource;
  tags: string[];
  followUpStatus: FollowUpStatus;
  notes: string;
  preferences: string;
  stayHistory: StayRecord[];
}

export interface ActivityLogItem {
  id: string;
  icon: string;
  minutesAgo: number;
  staff: string;
  description: string;
}

export interface Competitor {
  id: string;
  name: string;
  roomType: string;
  publicRate: number;
  availability: string;
  source: string;
  lastCheckedHoursAgo: number;
}

export type ChannelStatus = "Planned" | "Connected Mock" | "Future Integration" | "Manual Import";

export interface Channel {
  id: string;
  name: string;
  status: ChannelStatus;
  description: string;
}

export type HousekeepingStatus = "Dirty" | "Cleaning" | "Inspection" | "Ready" | "Maintenance";

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  roomType: RoomType;
  status: HousekeepingStatus;
  lastCheckoutOffset: number;
  nextArrivalOffset: number | null;
  notes: string;
}

// ---------------------------------------------------------------------------
// Rooms (30)
// ---------------------------------------------------------------------------

export const rooms: Room[] = [
  // Bungalows (8)
  { id: "b1", number: "Bungalow 1", type: "Bungalow", status: "Occupied", currentGuest: "Marisol Peña", cleaningStatus: "Clean", rateTonight: 152 },
  { id: "b2", number: "Bungalow 2", type: "Bungalow", status: "Available", nextArrivalOffset: 1, cleaningStatus: "Clean", rateTonight: 152 },
  { id: "b3", number: "Bungalow 3", type: "Bungalow", status: "Occupied", currentGuest: "Fabiana Duarte", cleaningStatus: "Clean", rateTonight: 158, floorNote: "Long-term stay guest, 21 nights" },
  { id: "b4", number: "Bungalow 4", type: "Bungalow", status: "Dirty", cleaningStatus: "Dirty", rateTonight: 149, nextArrivalOffset: 0 },
  { id: "b5", number: "Bungalow 5", type: "Bungalow", status: "Reserved", nextArrivalOffset: 0, cleaningStatus: "Inspected", rateTonight: 155 },
  { id: "b6", number: "Bungalow 6", type: "Bungalow", status: "Maintenance", cleaningStatus: "In Progress", rateTonight: 152, floorNote: "AC unit replacement" },
  { id: "b7", number: "Bungalow 7", type: "Bungalow", status: "Available", cleaningStatus: "Clean", rateTonight: 149 },
  { id: "b8", number: "Bungalow 8", type: "Bungalow", status: "Occupied", currentGuest: "Erik Solheim", cleaningStatus: "Clean", rateTonight: 162 },

  // Standard Rooms (12)
  { id: "r101", number: "101", type: "Standard Room", status: "Occupied", currentGuest: "James Whitfield", cleaningStatus: "Clean", rateTonight: 98 },
  { id: "r102", number: "102", type: "Standard Room", status: "Available", cleaningStatus: "Clean", rateTonight: 96 },
  { id: "r103", number: "103", type: "Standard Room", status: "Dirty", cleaningStatus: "Dirty", rateTonight: 96, nextArrivalOffset: 0 },
  { id: "r104", number: "104", type: "Standard Room", status: "Occupied", currentGuest: "Sarah Kowalski", cleaningStatus: "Clean", rateTonight: 99 },
  { id: "r105", number: "105", type: "Standard Room", status: "Available", cleaningStatus: "Clean", rateTonight: 95 },
  { id: "r106", number: "106", type: "Standard Room", status: "Reserved", nextArrivalOffset: 0, cleaningStatus: "Inspected", rateTonight: 98 },
  { id: "r107", number: "107", type: "Standard Room", status: "Occupied", currentGuest: "Tom Bradshaw", cleaningStatus: "Clean", rateTonight: 99 },
  { id: "r108", number: "108", type: "Standard Room", status: "Available", cleaningStatus: "Clean", rateTonight: 95 },
  { id: "r109", number: "109", type: "Standard Room", status: "Maintenance", cleaningStatus: "In Progress", rateTonight: 96, floorNote: "Plumbing repair" },
  { id: "r110", number: "110", type: "Standard Room", status: "Dirty", cleaningStatus: "Dirty", rateTonight: 97 },
  { id: "r111", number: "111", type: "Standard Room", status: "Available", cleaningStatus: "Clean", rateTonight: 95 },
  { id: "r112", number: "112", type: "Standard Room", status: "Occupied", currentGuest: "Diego Fernández", cleaningStatus: "Clean", rateTonight: 99 },

  // Poolside Rooms (6)
  { id: "pl1", number: "Poolside 1", type: "Poolside Room", status: "Occupied", currentGuest: "Camille Laurent", cleaningStatus: "Clean", rateTonight: 135 },
  { id: "pl2", number: "Poolside 2", type: "Poolside Room", status: "Available", cleaningStatus: "Clean", rateTonight: 132 },
  { id: "pl3", number: "Poolside 3", type: "Poolside Room", status: "Reserved", nextArrivalOffset: 1, cleaningStatus: "Inspected", rateTonight: 138 },
  { id: "pl4", number: "Poolside 4", type: "Poolside Room", status: "Occupied", currentGuest: "Priya Nandakumar", cleaningStatus: "Clean", rateTonight: 136 },
  { id: "pl5", number: "Poolside 5", type: "Poolside Room", status: "Dirty", cleaningStatus: "Dirty", rateTonight: 132, nextArrivalOffset: 0 },
  { id: "pl6", number: "Poolside 6", type: "Poolside Room", status: "Available", cleaningStatus: "Clean", rateTonight: 132 },

  // Suites (4)
  { id: "s1", number: "Suite 1", type: "Suite", status: "Occupied", currentGuest: "Yolanda Batista", cleaningStatus: "Clean", rateTonight: 219, floorNote: "VIP guest arriving party of 2" },
  { id: "s2", number: "Suite 2", type: "Suite", status: "Reserved", nextArrivalOffset: 0, cleaningStatus: "Inspected", rateTonight: 225, floorNote: "VIP — Nadia El-Amin, influencer residency" },
  { id: "s3", number: "Suite 3", type: "Suite", status: "Available", cleaningStatus: "Clean", rateTonight: 205 },
  { id: "s4", number: "Suite 4", type: "Suite", status: "Occupied", currentGuest: "Kenji Watanabe", cleaningStatus: "Clean", rateTonight: 212 },
];

// ---------------------------------------------------------------------------
// Guests (20)
// ---------------------------------------------------------------------------

export const guests: Guest[] = [
  {
    id: "g1", name: "Marisol Peña", country: "Dominican Republic", phone: "+1 809 555 0142", email: "marisol.pena@gmail.com",
    lastStayOffset: 0, totalStays: 6, source: "Direct", tags: ["Repeat Guest", "Dominican Guest", "High Value"], followUpStatus: "None",
    notes: "Prefers ocean-facing bungalow. Celebrates anniversary in August — flag for a complimentary bottle of wine.",
    preferences: "Late checkout, extra pillows, no daily housekeeping (do-not-disturb most mornings).",
    stayHistory: [{ dateOffset: -210, room: "Bungalow 2", nights: 4 }, { dateOffset: -90, room: "Bungalow 1", nights: 5 }, { dateOffset: 0, room: "Bungalow 1", nights: 6 }],
  },
  {
    id: "g2", name: "James Whitfield", country: "United States", phone: "+1 512 555 0199", email: "j.whitfield@outlook.com",
    lastStayOffset: 0, totalStays: 1, source: "Booking.com", tags: ["Direct Booking"], followUpStatus: "Due",
    notes: "First stay at Kaoba. Asked front desk about kite surfing lesson referrals.",
    preferences: "Ground floor room, gluten-free breakfast option.",
    stayHistory: [{ dateOffset: 0, room: "101", nights: 3 }],
  },
  {
    id: "g3", name: "Camille Laurent", country: "France", phone: "+33 6 12 34 56 78", email: "camille.laurent@yahoo.fr",
    lastStayOffset: 0, totalStays: 2, source: "Airbnb", tags: ["Wellness Interest"], followUpStatus: "Scheduled",
    notes: "Asked about yoga class schedule and a massage therapist referral.",
    preferences: "Quiet room away from pool bar, herbal tea in-room.",
    stayHistory: [{ dateOffset: -400, room: "Poolside 3", nights: 3 }, { dateOffset: 0, room: "Poolside 1", nights: 4 }],
  },
  {
    id: "g4", name: "Erik Solheim", country: "Norway", phone: "+47 412 34 567", email: "erik.solheim@proton.me",
    lastStayOffset: 0, totalStays: 1, source: "Direct", tags: ["Direct Booking", "High Value"], followUpStatus: "None",
    notes: "Booked directly after seeing Instagram post. Considering a return trip in December.",
    preferences: "King bed, coffee maker restocked daily.",
    stayHistory: [{ dateOffset: 0, room: "Bungalow 8", nights: 7 }],
  },
  {
    id: "g5", name: "Ana Beatriz Cruz", country: "Dominican Republic", phone: "+1 829 555 0177", email: "abcruz@hotmail.com",
    lastStayOffset: -3, totalStays: 3, source: "WhatsApp", tags: ["Dominican Guest", "Repeat Guest"], followUpStatus: "Due",
    notes: "Checked out 3 days ago with an outstanding balance of $85 for minibar charges.",
    preferences: "Requests room near the restaurant, allergic to shellfish.",
    stayHistory: [{ dateOffset: -180, room: "102", nights: 2 }, { dateOffset: -3, room: "105", nights: 3 }],
  },
  {
    id: "g6", name: "Marcus Reinholt", country: "Germany", phone: "+49 151 2345 6789", email: "m.reinholt@web.de",
    lastStayOffset: -420, totalStays: 1, source: "Booking.com", tags: [], followUpStatus: "None",
    notes: "Past guest, no return contact yet. Good candidate for a re-engagement offer.",
    preferences: "Non-smoking, away from elevator (n/a — noted from prior stay).",
    stayHistory: [{ dateOffset: -420, room: "104", nights: 5 }],
  },
  {
    id: "g7", name: "Priya Nandakumar", country: "Canada", phone: "+1 416 555 0133", email: "priya.nand@gmail.com",
    lastStayOffset: 0, totalStays: 2, source: "Direct", tags: ["Wellness Interest", "Direct Booking"], followUpStatus: "None",
    notes: "Working remotely during stay. Asked about co-working space near the pool.",
    preferences: "Strong WiFi, standing desk if available.",
    stayHistory: [{ dateOffset: -260, room: "Poolside 2", nights: 6 }, { dateOffset: 0, room: "Poolside 4", nights: 5 }],
  },
  {
    id: "g8", name: "Diego Fernández", country: "Argentina", phone: "+54 9 11 2345 6789", email: "diego.fernandez@gmail.com",
    lastStayOffset: 0, totalStays: 1, source: "Walk-in", tags: [], followUpStatus: "Due",
    notes: "Walked in without reservation, paid cash deposit. Balance due at checkout.",
    preferences: "None recorded yet.",
    stayHistory: [{ dateOffset: 0, room: "112", nights: 2 }],
  },
  {
    id: "g9", name: "Sarah Kowalski", country: "United States", phone: "+1 312 555 0161", email: "sarah.kowalski@icloud.com",
    lastStayOffset: 0, totalStays: 4, source: "Airbnb", tags: ["Repeat Guest", "Family Travel"], followUpStatus: "None",
    notes: "Traveling with two kids. Asked about the kids' menu and a crib for the youngest.",
    preferences: "Connecting rooms if possible, early dinner reservation.",
    stayHistory: [{ dateOffset: -300, room: "104", nights: 5 }, { dateOffset: -150, room: "107", nights: 4 }, { dateOffset: 0, room: "104", nights: 6 }],
  },
  {
    id: "g10", name: "Lucas Meijer", country: "Netherlands", phone: "+31 6 1234 5678", email: "lucas.meijer@gmail.com",
    lastStayOffset: -520, totalStays: 1, source: "Booking.com", tags: [], followUpStatus: "None",
    notes: "One-time guest, no follow-up initiated yet.",
    preferences: "Bike rental info requested at checkout.",
    stayHistory: [{ dateOffset: -520, room: "108", nights: 3 }],
  },
  {
    id: "g11", name: "Yolanda Batista", country: "Dominican Republic", phone: "+1 809 555 0121", email: "yolanda.batista@gmail.com",
    lastStayOffset: 0, totalStays: 8, source: "Direct", tags: ["High Value", "Dominican Guest", "Repeat Guest"], followUpStatus: "Scheduled",
    notes: "One of Kaoba's highest-value repeat guests. VIP arrival today — general manager to greet personally.",
    preferences: "Suite with garden view, champagne on arrival, late 2pm checkout standard.",
    stayHistory: [{ dateOffset: -600, room: "Suite 1", nights: 5 }, { dateOffset: -240, room: "Suite 1", nights: 4 }, { dateOffset: 0, room: "Suite 1", nights: 5 }],
  },
  {
    id: "g12", name: "Tom Bradshaw", country: "United Kingdom", phone: "+44 7700 900123", email: "tom.bradshaw@gmail.com",
    lastStayOffset: 0, totalStays: 1, source: "Direct", tags: ["Direct Booking"], followUpStatus: "None",
    notes: "Booked direct via WhatsApp inquiry. Asked about surf lesson bundles.",
    preferences: "Room with desk for evening work calls.",
    stayHistory: [{ dateOffset: 0, room: "107", nights: 4 }],
  },
  {
    id: "g13", name: "Isabella Rossi", country: "Italy", phone: "+39 345 678 9012", email: "isabella.rossi@libero.it",
    lastStayOffset: -45, totalStays: 2, source: "Airbnb", tags: ["Wellness Interest"], followUpStatus: "Due",
    notes: "Asked about a long-stay wellness package for a future visit — strong prospect.",
    preferences: "Vegetarian breakfast, quiet floor.",
    stayHistory: [{ dateOffset: -300, room: "Poolside 6", nights: 3 }, { dateOffset: -45, room: "Poolside 2", nights: 4 }],
  },
  {
    id: "g14", name: "Kenji Watanabe", country: "Japan", phone: "+81 90 1234 5678", email: "kenji.watanabe@gmail.com",
    lastStayOffset: 0, totalStays: 1, source: "Direct", tags: ["High Value", "Direct Booking"], followUpStatus: "None",
    notes: "Booked the Suite for a milestone birthday trip. Requested a private dinner setup.",
    preferences: "Minimalist room setup, no strong fragrances.",
    stayHistory: [{ dateOffset: 0, room: "Suite 4", nights: 5 }],
  },
  {
    id: "g15", name: "Nadia El-Amin", country: "United States", phone: "+1 305 555 0188", email: "nadia@nadiaelamin.co",
    lastStayOffset: 0, totalStays: 1, source: "Direct", tags: ["Influencer", "Wellness Interest", "High Value"], followUpStatus: "Scheduled",
    notes: "Wellness content creator (240K followers) exploring a 3-month residency partnership. VIP arrival today.",
    preferences: "Suite with natural light for content, flexible late checkout, quiet during 8–10am filming window.",
    stayHistory: [{ dateOffset: 0, room: "Suite 2", nights: 7 }],
  },
  {
    id: "g16", name: "Robert Coles", country: "Canada", phone: "+1 647 555 0155", email: "robert.coles@gmail.com",
    lastStayOffset: 0, totalStays: 2, source: "Booking.com", tags: ["Family Travel"], followUpStatus: "None",
    notes: "Traveling with spouse and two children. Booked adjoining bungalows for the extended family.",
    preferences: "Pool-facing rooms, kid-friendly snacks stocked.",
    stayHistory: [{ dateOffset: -260, room: "Bungalow 4", nights: 6 }, { dateOffset: 0, room: "Bungalow 3", nights: 5 }],
  },
  {
    id: "g17", name: "Fabiana Duarte", country: "Dominican Republic", phone: "+1 809 555 0110", email: "fabiana.duarte@gmail.com",
    lastStayOffset: -14, totalStays: 3, source: "Direct", tags: ["Dominican Guest", "Long-Term Stay"], followUpStatus: "None",
    notes: "Currently on a 21-night stay while relocating to Cabarete. Strong candidate for a monthly-rate conversation.",
    preferences: "Weekly linen refresh, small kitchenette use, quiet workspace.",
    stayHistory: [{ dateOffset: -14, room: "Bungalow 3", nights: 21 }],
  },
  {
    id: "g18", name: "Chris Alvarado", country: "United States", phone: "+1 213 555 0144", email: "chris.alvarado@gmail.com",
    lastStayOffset: -600, totalStays: 1, source: "Direct", tags: ["Direct Booking"], followUpStatus: "None",
    notes: "Long-lapsed direct guest. Good candidate for a re-engagement email with a returning-guest rate.",
    preferences: "Airport transfer requested previously.",
    stayHistory: [{ dateOffset: -600, room: "106", nights: 4 }],
  },
  {
    id: "g19", name: "Greta Lindqvist", country: "Sweden", phone: "+46 70 123 45 67", email: "greta.lindqvist@gmail.com",
    lastStayOffset: -1, totalStays: 2, source: "Airbnb", tags: ["Wellness Interest"], followUpStatus: "Due",
    notes: "Checked out yesterday with a $46 spa-service balance still outstanding.",
    preferences: "Early breakfast, oat milk in-room.",
    stayHistory: [{ dateOffset: -320, room: "Poolside 5", nights: 3 }, { dateOffset: -1, room: "Poolside 6", nights: 4 }],
  },
  {
    id: "g20", name: "Julio César Mateo", country: "Dominican Republic", phone: "+1 809 555 0199", email: "julio.mateo@gmail.com",
    lastStayOffset: 0, totalStays: 5, source: "WhatsApp", tags: ["Dominican Guest", "Repeat Guest"], followUpStatus: "None",
    notes: "Books almost every month for weekend trips with friends. Great referral source for local bookings.",
    preferences: "Same standard room each visit if available (101 or 104).",
    stayHistory: [{ dateOffset: -60, room: "101", nights: 2 }, { dateOffset: -20, room: "104", nights: 2 }, { dateOffset: 0, room: "101", nights: 2 }],
  },
];

// ---------------------------------------------------------------------------
// Reservations (15) — startOffset/endOffset are day-offsets from today
// ---------------------------------------------------------------------------

export const reservations: Reservation[] = [
  { id: "res1", guestName: "Marisol Peña", guestId: "g1", roomId: "b1", roomNumber: "Bungalow 1", roomType: "Bungalow", startOffset: -1, endOffset: 5, status: "Checked In", guestsCount: 2, source: "Direct", paymentStatus: "Paid", notes: "Anniversary trip — flag for welcome wine on arrival night." },
  { id: "res2", guestName: "James Whitfield", guestId: "g2", roomId: "r101", roomNumber: "101", roomType: "Standard Room", startOffset: -2, endOffset: 1, status: "Checked In", guestsCount: 1, source: "Booking.com", paymentStatus: "Paid", notes: "First-time guest, asked about kite surfing referrals." },
  { id: "res3", guestName: "Fabiana Duarte", guestId: "g17", roomId: "b3", roomNumber: "Bungalow 3", roomType: "Bungalow", startOffset: -14, endOffset: 7, status: "Checked In", guestsCount: 1, source: "Direct", paymentStatus: "Partial", notes: "21-night relocation stay — discuss monthly rate at week 3." },
  { id: "res4", guestName: "New Arrival — Rentería Party", roomId: "b5", roomNumber: "Bungalow 5", roomType: "Bungalow", startOffset: 0, endOffset: 4, status: "Confirmed", guestsCount: 2, source: "Airbnb", paymentStatus: "Paid", notes: "Airbnb booking, requested late check-in around 9pm." },
  { id: "res5", guestName: "Maintenance Hold — AC Repair", roomId: "b6", roomNumber: "Bungalow 6", roomType: "Bungalow", startOffset: -1, endOffset: 2, status: "Maintenance Block", guestsCount: 0, source: "Walk-in", paymentStatus: "Unpaid", notes: "Blocked until AC compressor part arrives from Santiago." },
  { id: "res6", guestName: "Erik Solheim", guestId: "g4", roomId: "b8", roomNumber: "Bungalow 8", roomType: "Bungalow", startOffset: 0, endOffset: 7, status: "Checked In", guestsCount: 1, source: "Direct", paymentStatus: "Paid", notes: "Direct booking from Instagram post. Considering December return." },
  { id: "res7", guestName: "Diego Fernández", guestId: "g8", roomId: "r112", roomNumber: "112", roomType: "Standard Room", startOffset: 0, endOffset: 2, status: "Checked In", guestsCount: 1, source: "Walk-in", paymentStatus: "Partial", notes: "Cash deposit taken, balance due at checkout." },
  { id: "res8", guestName: "Weekend Hold — Placeholder", roomId: "r106", roomNumber: "106", roomType: "Standard Room", startOffset: 0, endOffset: 2, status: "Courtesy Hold", guestsCount: 2, source: "WhatsApp", paymentStatus: "Unpaid", notes: "Courtesy hold for a WhatsApp inquiry pending confirmation." },
  { id: "res9", guestName: "Camille Laurent", guestId: "g3", roomId: "pl1", roomNumber: "Poolside 1", roomType: "Poolside Room", startOffset: -1, endOffset: 3, status: "Checked In", guestsCount: 1, source: "Airbnb", paymentStatus: "Paid", notes: "Asked about yoga schedule and massage referrals." },
  { id: "res10", guestName: "Priya Nandakumar", guestId: "g7", roomId: "pl4", roomNumber: "Poolside 4", roomType: "Poolside Room", startOffset: -2, endOffset: 3, status: "Checked In", guestsCount: 1, source: "Direct", paymentStatus: "Paid", notes: "Working remotely, needs strong WiFi confirmed daily." },
  { id: "res11", guestName: "Marc & Lucía Poolside Booking", roomId: "pl3", roomNumber: "Poolside 3", roomType: "Poolside Room", startOffset: 1, endOffset: 6, status: "Confirmed", guestsCount: 2, source: "Booking.com", paymentStatus: "Paid", notes: "OTA booking, no special requests on file." },
  { id: "res12", guestName: "Yolanda Batista", guestId: "g11", roomId: "s1", roomNumber: "Suite 1", roomType: "Suite", startOffset: 0, endOffset: 5, status: "Confirmed", guestsCount: 2, source: "Direct", paymentStatus: "Paid", notes: "VIP — general manager greeting on arrival, champagne setup requested." },
  { id: "res13", guestName: "Nadia El-Amin", guestId: "g15", roomId: "s2", roomNumber: "Suite 2", roomType: "Suite", startOffset: 0, endOffset: 7, status: "Confirmed", guestsCount: 1, source: "Direct", paymentStatus: "Paid", notes: "VIP — influencer residency conversation, needs quiet filming window 8–10am." },
  { id: "res14", guestName: "Kenji Watanabe", guestId: "g14", roomId: "s4", roomNumber: "Suite 4", roomType: "Suite", startOffset: -1, endOffset: 4, status: "Checked In", guestsCount: 2, source: "Direct", paymentStatus: "Paid", notes: "Milestone birthday trip, private dinner setup requested for night 2." },
  { id: "res15", guestName: "Robert Coles", guestId: "g16", roomId: "b4", roomNumber: "Bungalow 4", roomType: "Bungalow", startOffset: 2, endOffset: 7, status: "Pending", guestsCount: 4, source: "Booking.com", paymentStatus: "Unpaid", notes: "Family of four, awaiting deposit confirmation from OTA." },
];

// ---------------------------------------------------------------------------
// Activity log (8)
// ---------------------------------------------------------------------------

export const activityLogSeed: ActivityLogItem[] = [
  { id: "a1", icon: "calendar-plus", minutesAgo: 12, staff: "Front Desk — Yesenia", description: "Created a new reservation for Bungalow 5, Airbnb source, 4 nights." },
  { id: "a2", icon: "check-in", minutesAgo: 34, staff: "Front Desk — Yesenia", description: "Checked in Kenji Watanabe to Suite 4." },
  { id: "a3", icon: "sparkles", minutesAgo: 58, staff: "Housekeeping — Rosa", description: "Marked Bungalow 1 as clean and inspection-ready." },
  { id: "a4", icon: "whatsapp", minutesAgo: 76, staff: "Front Desk — Manuel", description: "Sent WhatsApp follow-up to Ana Beatriz Cruz about her outstanding balance." },
  { id: "a5", icon: "trending-up", minutesAgo: 110, staff: "Revenue — Katia", description: "Updated suggested rate for Poolside Room to $139 based on weekend demand." },
  { id: "a6", icon: "booking", minutesAgo: 142, staff: "System — Booking Flow", description: "New direct booking request captured for a Suite, 3 nights in September." },
  { id: "a7", icon: "wrench", minutesAgo: 205, staff: "Maintenance — Pedro", description: "Added a maintenance block on Bungalow 6 for AC compressor repair." },
  { id: "a8", icon: "note", minutesAgo: 260, staff: "Owner — Kalei", description: "Added a guest note on Yolanda Batista's profile ahead of her VIP arrival." },
];

// ---------------------------------------------------------------------------
// Tax
// ---------------------------------------------------------------------------

/** Dominican Republic tourism tax (ITBIS), applied to room folios. */
export const ITBIS_RATE = 0.18;

// ---------------------------------------------------------------------------
// Pricing intelligence
// ---------------------------------------------------------------------------

export const pricingSnapshot = {
  todayADR: 132,
  competitorAvg: 146,
  suggestedRate: 139,
  weekendDemand: "High" as const,
  occupancyTrend: 12,
};

export const competitors: Competitor[] = [
  { id: "c1", name: "Cabarete Beach Hotel", roomType: "Standard Double", publicRate: 118, availability: "6 rooms open", source: "Booking.com", lastCheckedHoursAgo: 3 },
  { id: "c2", name: "Tropical Casa Laguna", roomType: "Garden Bungalow", publicRate: 149, availability: "2 rooms open", source: "Direct site", lastCheckedHoursAgo: 6 },
  { id: "c3", name: "Viva Tangerine", roomType: "Poolside King", publicRate: 156, availability: "Sold out Sat", source: "Airbnb", lastCheckedHoursAgo: 5 },
  { id: "c4", name: "Local Boutique Stay", roomType: "Suite", publicRate: 189, availability: "1 room open", source: "Booking.com", lastCheckedHoursAgo: 9 },
  { id: "c5", name: "Sosua Ocean Rooms", roomType: "Standard Ocean View", publicRate: 121, availability: "9 rooms open", source: "Expedia", lastCheckedHoursAgo: 4 },
];

export const aiPricingNotes: string[] = [
  "Weekend demand is trending higher across Cabarete — expect Friday/Saturday to book out first.",
  "Competitor average ($146) is above current ADR ($132) — there is room to move without losing bookings.",
  "Poolside rooms could support a small rate increase given Viva Tangerine is already sold out for Saturday.",
  "Maintain bungalow rate for longer-stay guests like Fabiana Duarte's 21-night booking.",
  "Review pricing again tomorrow morning once Friday's OTA availability updates.",
];

// ---------------------------------------------------------------------------
// Channels (8)
// ---------------------------------------------------------------------------

export const channels: Channel[] = [
  { id: "ch1", name: "Website Direct Booking", status: "Connected Mock", description: "Mock direct request flow live inside this MVP — the highest-margin channel to grow first." },
  { id: "ch2", name: "Airbnb", status: "Manual Import", description: "Reservations currently tracked manually from the Airbnb host dashboard." },
  { id: "ch3", name: "Booking.com", status: "Manual Import", description: "Reservations currently tracked manually from the Booking.com extranet." },
  { id: "ch4", name: "Expedia", status: "Planned", description: "No active distribution yet — evaluate demand before onboarding." },
  { id: "ch5", name: "Google Hotel Search", status: "Future Integration", description: "Requires a connected channel manager or direct Google Hotel Ads feed." },
  { id: "ch6", name: "WhatsApp", status: "Connected Mock", description: "Primary channel for direct guest inquiries, follow-ups, and local repeat bookings." },
  { id: "ch7", name: "Walk-In", status: "Connected Mock", description: "Front desk logs walk-in reservations directly into the room grid and calendar." },
  { id: "ch8", name: "Referral Partners", status: "Planned", description: "I Love DR Realty and local partner referrals — tracking process to be formalized." },
];

// ---------------------------------------------------------------------------
// Housekeeping board (10 tasks)
// ---------------------------------------------------------------------------

export const housekeepingTasksSeed: HousekeepingTask[] = [
  { id: "hk1", roomNumber: "Bungalow 4", roomType: "Bungalow", status: "Dirty", lastCheckoutOffset: 0, nextArrivalOffset: 0, notes: "Checkout at 11am, new arrival expected by 3pm." },
  { id: "hk2", roomNumber: "103", roomType: "Standard Room", status: "Dirty", lastCheckoutOffset: 0, nextArrivalOffset: 0, notes: "Guest requested early checkout — room open earlier than usual." },
  { id: "hk3", roomNumber: "Poolside 5", roomType: "Poolside Room", status: "Dirty", lastCheckoutOffset: 0, nextArrivalOffset: 0, notes: "Standard turnover, no special requests." },
  { id: "hk4", roomNumber: "110", roomType: "Standard Room", status: "Cleaning", lastCheckoutOffset: 0, nextArrivalOffset: 1, notes: "In progress — deep clean requested after long stay." },
  { id: "hk5", roomNumber: "Bungalow 6", roomType: "Bungalow", status: "Maintenance", lastCheckoutOffset: -1, nextArrivalOffset: null, notes: "Blocked for AC compressor repair, do not assign." },
  { id: "hk6", roomNumber: "109", roomType: "Standard Room", status: "Maintenance", lastCheckoutOffset: -2, nextArrivalOffset: null, notes: "Plumbing repair in progress, parts ordered." },
  { id: "hk7", roomNumber: "Bungalow 5", roomType: "Bungalow", status: "Inspection", lastCheckoutOffset: -1, nextArrivalOffset: 0, notes: "Cleaned, awaiting supervisor inspection before VIP-adjacent arrival." },
  { id: "hk8", roomNumber: "Suite 2", roomType: "Suite", status: "Inspection", lastCheckoutOffset: -1, nextArrivalOffset: 0, notes: "VIP arrival today (influencer residency) — inspect closely, add welcome fruit plate." },
  { id: "hk9", roomNumber: "106", roomType: "Standard Room", status: "Ready", lastCheckoutOffset: -1, nextArrivalOffset: 0, notes: "Ready for courtesy hold guest, confirm before 2pm." },
  { id: "hk10", roomNumber: "Poolside 3", roomType: "Poolside Room", status: "Ready", lastCheckoutOffset: -2, nextArrivalOffset: 1, notes: "Ready ahead of tomorrow's confirmed Booking.com arrival." },
];

// ---------------------------------------------------------------------------
// Overview dashboard stats + Today's Pulse
// ---------------------------------------------------------------------------

export const overviewStats = {
  occupancyToday: 72,
  arrivalsToday: 14,
  departuresToday: 9,
  availableRooms: 21,
  inHouseGuests: 63,
  openFollowUps: 18,
  estimatedRevenueToday: 8420,
  adr: 132,
};

export const todaysPulse: string[] = [
  "3 rooms need cleaning before the next check-in window.",
  "2 VIP guests arriving today — Yolanda Batista and Nadia El-Amin.",
  "4 unpaid balances need front-desk follow-up before checkout.",
  "6 WhatsApp follow-ups are due for past and current guests.",
  "Weekend demand is trending up across Cabarete — consider a rate review.",
];

// ---------------------------------------------------------------------------
// Booking flow demo — room type catalog
// ---------------------------------------------------------------------------

export interface RoomTypeOption {
  type: RoomType;
  rate: number;
  capacity: number;
  amenities: string[];
  gradient: string;
  description: string;
}

export const roomTypeOptions: RoomTypeOption[] = [
  {
    type: "Bungalow",
    rate: 152,
    capacity: 2,
    amenities: ["Private terrace", "Garden view", "Outdoor shower", "Ceiling fan + A/C"],
    gradient: "gradient-placeholder-1",
    description: "Freestanding garden bungalows with a private terrace — Kaoba's most requested room type.",
  },
  {
    type: "Standard Room",
    rate: 96,
    capacity: 2,
    amenities: ["Queen bed", "En-suite bathroom", "Free WiFi", "Daily housekeeping"],
    gradient: "gradient-placeholder-4",
    description: "Comfortable, efficient rooms close to the main building — ideal for short stays.",
  },
  {
    type: "Poolside Room",
    rate: 134,
    capacity: 2,
    amenities: ["Pool-facing patio", "Walk-out pool access", "Mini fridge", "Rain shower"],
    gradient: "gradient-placeholder-2",
    description: "Steps from the pool deck, with direct outdoor access — popular with remote workers.",
  },
  {
    type: "Suite",
    rate: 213,
    capacity: 4,
    amenities: ["Separate living area", "Garden or ocean view", "Premium linens", "In-room welcome setup"],
    gradient: "gradient-placeholder-3",
    description: "Kaoba's top-tier accommodation for VIPs, milestone trips, and longer luxury stays.",
  },
];

// ---------------------------------------------------------------------------
// Demo roles
// ---------------------------------------------------------------------------

export interface DemoRole {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const demoRoles: DemoRole[] = [
  { id: "owner", label: "Owner / Admin", description: "Full visibility across operations, pricing, and the product roadmap.", icon: "crown" },
  { id: "frontdesk", label: "Front Desk", description: "Reservations, check-ins, guest profiles, and daily arrivals.", icon: "desk" },
  { id: "housekeeping", label: "Housekeeping", description: "Room status, cleaning queue, and turnover coordination.", icon: "sparkles" },
  { id: "revenue", label: "Revenue Manager", description: "Pricing intelligence, competitor rates, and demand trends.", icon: "chart" },
];
