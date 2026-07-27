/* ==========================================================================
   Rich Exotic Rentals — Site Configuration
   --------------------------------------------------------------------------
   This is the ONLY file you need to edit to take the site live.
   Everything below is a PLACEHOLDER until you replace it with real values.
   See README.md for step-by-step setup instructions.
   ========================================================================== */

window.RER_CONFIG = {

  /* --- Contact -------------------------------------------------------- */
  // Digits only, with country code. Used for tel: and sms: links.
  phoneE164: '+18005550123',          // TODO: replace with real number
  // How the number is displayed on the page.
  phoneDisplay: '(800) 555-0123',     // TODO: replace with real number
  // Number that receives text messages (often the same as phoneE164).
  smsE164: '+18005550123',            // TODO: replace with real number
  // Pre-filled body for the "Text to Book" link.
  smsBody: 'Hi Rich Exotic Rentals — I’d like to check availability for a rental.',

  email: 'bookings@richexoticrentals.com',   // TODO: replace with real inbox
  serviceArea: 'Local pickup • Regional delivery available on request', // TODO

  /* --- Social ---------------------------------------------------------- */
  instagram: 'https://instagram.com/',   // TODO: replace with real profile URL
  facebook: 'https://facebook.com/',     // TODO: replace with real page URL

  /* --- Booking form destination ---------------------------------------- */
  // Where booking requests are POSTed as JSON. Any endpoint that accepts a
  // JSON POST works: a GoHighLevel inbound webhook, Zapier/Make catch hook,
  // Formspree, or your own server. Leave empty to run in "review mode"
  // (the form validates and confirms locally, but nothing is transmitted).
  //
  // The email + SMS notifications and the calendar/CRM record are created by
  // whatever you point this at — see README.md § "Wiring up notifications".
  formEndpoint: '',                      // TODO: e.g. 'https://services.leadconnectorhq.com/hooks/XXXX'

  // Same idea for the "Join the Priority List" form. Falls back to
  // formEndpoint when left empty.
  priorityListEndpoint: '',

  /* --- Analytics ------------------------------------------------------- */
  // Leave empty to skip loading the tag entirely (no wasted requests).
  googleAnalyticsId: '',                 // TODO: e.g. 'G-XXXXXXXXXX'
  metaPixelId: '',                       // TODO: e.g. '1234567890123456'

  /* --- Business rules -------------------------------------------------- */
  minimumDriverAge: 25,                  // Used by the form's age validation
  minimumLeadTimeDays: 1,                // Earliest selectable pickup date
  maximumRentalDays: 30                  // Guard-rail on the date range
};
