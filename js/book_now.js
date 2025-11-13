// ===== CALENDAR FUNCTIONALITY =====

// Fetch calendar data from our API
async function loadCalendar() {
  try {
    const response = await fetch("/api/calendar");
    const data = await response.json();

    console.log("Calendar data:", data);

    const container = document.getElementById("calendar-container");

    if (!container) {
      // Calendar container doesn't exist on this page, exit early
      return;
    }

    // Check for errors in the response
    if (data.error) {
      container.innerHTML = `
        <div class="error">
          <h2>Error Loading Calendar</h2>
          <p>${data.error}</p>
        </div>
      `;
      return;
    }

    // Build the calendar
    renderCalendar(data);
  } catch (error) {
    console.error("Error loading calendar:", error);
    const container = document.getElementById("calendar-container");

    if (container) {
      container.innerHTML = `
        <div class="error">
          <h2>Error Loading Calendar</h2>
          <p>${error.message}</p>
          <p>Make sure your backend server is running on http://localhost:3000</p>
        </div>
      `;
    }
  }
}

// Function to render the calendar
function renderCalendar(data) {
  const container = document.getElementById("calendar-container");

  // Get bookings and availability
  const bookings = data.bookings?.bookings || [];
  const availabilities = data.availability?.availabilities || [];

  console.log("Bookings:", bookings.length);
  console.log("Availabilities:", availabilities.length);

  // Organize data by date
  const calendarData = {};

  // Add bookings to calendar
  bookings.forEach((booking) => {
    const date = new Date(booking.start_at);
    const dateKey = date.toLocaleDateString("en-CA", {
      timeZone: "America/Vancouver",
    }); // YYYY-MM-DD in Pacific time

    if (!calendarData[dateKey]) {
      calendarData[dateKey] = { bookings: [], availabilities: [] };
    }

    calendarData[dateKey].bookings.push({
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Vancouver",
      }),
      duration: booking.appointment_segments.reduce(
        (sum, seg) => sum + seg.duration_minutes,
        0
      ),
    });
  });

  // Add availabilities to calendar
  availabilities.forEach((availability) => {
    const date = new Date(availability.start_at);
    const dateKey = date.toLocaleDateString("en-CA", {
      timeZone: "America/Vancouver",
    }); // YYYY-MM-DD in Pacific time

    if (!calendarData[dateKey]) {
      calendarData[dateKey] = { bookings: [], availabilities: [] };
    }

    calendarData[dateKey].availabilities.push({
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Vancouver",
      }),
      duration: availability.appointment_segments[0]?.duration_minutes || 60,
    });
  });

  // Build 7-day view with hourly slots starting from today
  const today = new Date();
  let currentStartDate = today; // Will be updated by navigation buttons

  // Store data in a global variable so navigation buttons can access it
  window.calendarData = calendarData;
  window.currentStartDate = currentStartDate;

  let calendarHTML = buildWeekView(currentStartDate, calendarData);

  container.innerHTML = calendarHTML;

  // Add event listeners for navigation buttons
  document
    .getElementById("prev-week")
    ?.addEventListener("click", () => navigateWeek(-7));
  document
    .getElementById("next-week")
    ?.addEventListener("click", () => navigateWeek(7));
}

// Function to build a 7-day view with hourly availability
function buildWeekView(startDate, calendarData) {
  const days = [];

  // Generate 7 days starting from startDate
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    days.push(date);
  }

  let html = `
    <div class="week-view">
      <div class="week-navigation">
        <button id="prev-week" class="nav-button">← Previous 7 Days</button>
        <button id="next-week" class="nav-button">Next 7 Days →</button>
      </div>
      
      <div class="days-grid">
  `;

  // Render each day
  days.forEach((date) => {
    const dateKey = date.toLocaleDateString("en-CA", {
      timeZone: "America/Vancouver",
    });
    const dayData = calendarData[dateKey] || {
      bookings: [],
      availabilities: [],
    };

    const isToday = date.toDateString() === new Date().toDateString();
    const todayClass = isToday ? "today" : "";

    const dayName = date.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "America/Vancouver",
    });
    const monthDay = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/Vancouver",
    });

    html += `
  <div class="day-column ${todayClass}">
    <div class="day-header">
      <div class="day-date">${monthDay}</div>
      <div class="day-name">${dayName}</div>
    </div>
    <div class="time-slots">
      ${renderTimeSlots(dayData)}
    </div>
  </div>
`;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

// Function to render hourly time slots for a day
function renderTimeSlots(dayData) {
  // DEBUG: See what data we have
  console.log("Day data:", dayData);
  console.log("Availabilities count:", dayData.availabilities.length);
  console.log("Bookings count:", dayData.bookings.length);

  // Check if the studio is closed (no availability AND no bookings)
  if (dayData.availabilities.length === 0 && dayData.bookings.length === 0) {
    return `
      <div class="studio-closed">
        <span class="closed-icon">🚫</span>
        <span class="closed-text">Studio Closed</span>
      </div>
    `;
  }

  // Create time slots from 9 AM to 9 PM (business hours)
  const startHour = 9;
  const endHour = 21;

  let html = "";

  for (let hour = startHour; hour <= endHour; hour++) {
    const timeStr = formatTime(hour);

    // Check if this time slot has availability or bookings
    const hasAvailability = dayData.availabilities.some((slot) =>
      slot.time.includes(formatTime12(hour))
    );
    const hasBooking = dayData.bookings.some((slot) =>
      slot.time.includes(formatTime12(hour))
    );

    const slotClass = hasBooking
      ? "booked"
      : hasAvailability
      ? "available"
      : "unavailable";

    html += `
      <div class="time-slot ${slotClass}">
        <span class="time-label">${timeStr}</span>
        <span class="slot-status">
          ${hasBooking ? "Booked" : hasAvailability ? "Available" : "—"}
        </span>
      </div>
    `;
  }

  return html;
}

// Helper function to format hour to 12-hour time
function formatTime(hour) {
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${ampm}`;
}

// Helper function to match availability time format
function formatTime12(hour) {
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:`;
}

// Navigate forward or backward by days
function navigateWeek(dayOffset) {
  const newStartDate = new Date(window.currentStartDate);
  newStartDate.setDate(newStartDate.getDate() + dayOffset);

  window.currentStartDate = newStartDate;

  const calendarHTML = buildWeekView(newStartDate, window.calendarData);
  document.getElementById("calendar-container").innerHTML = calendarHTML;

  // Re-attach event listeners
  document
    .getElementById("prev-week")
    ?.addEventListener("click", () => navigateWeek(-7));
  document
    .getElementById("next-week")
    ?.addEventListener("click", () => navigateWeek(7));
}

// Load calendar when page loads (only if calendar container exists)
if (document.getElementById("calendar-container")) {
  // Wait for page to fully load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadCalendar);
  } else {
    // Page already loaded
    loadCalendar();
  }
}

