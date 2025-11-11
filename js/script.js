console.log("Script loaded succesfully!")

function toggleDropdown(){
    console.log("toggleDropdown called!"); 
    const dropdown = document.getElementById("servicesDropdown");
    dropdown.classList.toggle("show");
    console.log("Dropdown classes:", dropdown.className); 
}

// Close dropdown when clicking outside (fixed class name)
window.onclick = function(event) {
    if (!event.target.matches('.dropdown') && 
        !event.target.matches('.dropdown span') &&
        !event.target.closest('.dropdown-container')) {
        
        const dropdown = document.getElementById("servicesDropdown");
        dropdown.classList.remove("show");
    }
}

// ===== CALENDAR FUNCTIONALITY =====

// Fetch calendar data from our API
async function loadCalendar() {
  try {
    const response = await fetch('http://localhost:3000/api/calendar');
    const data = await response.json();
    
    console.log('Calendar data:', data);
    
    const container = document.getElementById('calendar-container');
    
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
    console.error('Error loading calendar:', error);
    const container = document.getElementById('calendar-container');
    
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
  const container = document.getElementById('calendar-container');
  
  // Get bookings and availability
  const bookings = data.bookings?.bookings || [];
  const availabilities = data.availability?.availabilities || [];
  
  console.log('Bookings:', bookings.length);
  console.log('Availabilities:', availabilities.length);
  
  // Organize data by date
  const calendarData = {};
  
  // Add bookings to calendar
  bookings.forEach(booking => {
    const date = new Date(booking.start_at);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!calendarData[dateKey]) {
      calendarData[dateKey] = { bookings: [], availabilities: [] };
    }
    
    calendarData[dateKey].bookings.push({
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      duration: booking.appointment_segments.reduce((sum, seg) => sum + seg.duration_minutes, 0)
    });
  });
  
  // Add availabilities to calendar
  availabilities.forEach(availability => {
    const date = new Date(availability.start_at);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!calendarData[dateKey]) {
      calendarData[dateKey] = { bookings: [], availabilities: [] };
    }
    
    calendarData[dateKey].availabilities.push({
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      duration: availability.appointment_segments[0]?.duration_minutes || 60
    });
  });
  
  // Get current month and year
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Build calendar HTML
  let calendarHTML = buildMonthCalendar(currentYear, currentMonth, calendarData);
  
  // Add summary (incase you want to have a summary)
//   const summary = `
//     <div class="calendar-summary">
//       <div class="summary-item">
//         <span class="summary-label">🗓️ Booked Appointments:</span>
//         <span class="summary-value">${bookings.length}</span>
//       </div>
//       <div class="summary-item">
//         <span class="summary-label">⏰ Available Slots:</span>
//         <span class="summary-value">${availabilities.length}</span>
//       </div>
//     </div>
//   `;
  
  container.innerHTML = calendarHTML;
}

// Function to build a month calendar
function buildMonthCalendar(year, month, calendarData) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
  
  let html = `
    <div class="calendar-month">
      <div class="month-header">
        ${monthNames[month]} ${year}
      </div>
      
      <div class="calendar-grid">
        <!-- Day headers -->
        <div class="day-name">Sun</div>
        <div class="day-name">Mon</div>
        <div class="day-name">Tue</div>
        <div class="day-name">Wed</div>
        <div class="day-name">Thu</div>
        <div class="day-name">Fri</div>
        <div class="day-name">Sat</div>
  `;
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    html += '<div class="calendar-day empty"></div>';
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = date.toISOString().split('T')[0];
    const dayData = calendarData[dateKey] || { bookings: [], availabilities: [] };
    
    const isToday = date.toDateString() === new Date().toDateString();
    const todayClass = isToday ? 'today' : '';
    
    html += `
      <div class="calendar-day ${todayClass}">
        <div class="day-number">${day}</div>
        <div class="day-events">
    `;
    
    // Show bookings count
    if (dayData.bookings.length > 0) {
      html += `<div class="event-indicator busy">${dayData.bookings.length} booked</div>`;
    }
    
    // Show availability count
    if (dayData.availabilities.length > 0) {
      html += `<div class="event-indicator available">${dayData.availabilities.length} available</div>`;
    }
    
    html += `
        </div>
      </div>
    `;
  }
  
  html += `
      </div>
    </div>
  `;
  
  return html;
}

// Load calendar when page loads (only if calendar container exists)
if (document.getElementById('calendar-container')) {
  // Wait for page to fully load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCalendar);
  } else {
    // Page already loaded
    loadCalendar();
  }
}

//JS for the weekly schedule:
/* ===== Weekly Schedule (Vancouver TZ) ===== */
(function(){
  // ---- CONFIG: set your hours here ----
  // 0 = Sun ... 6 = Sat. Use 24h "HH:MM-HH:MM". Multiple ranges supported.
  const SCHEDULE = {
    0: [],                  // Sunday
    1: ["18:30-21:00"],     // Monday
    2: ["10:00-19:00"],     // Tuesday
    3: [],                  // Wednesday
    4: ["18:30-21:00"],     // Thursday
    5: [],                  // Friday
    6: ["10:00-19:00"],     // Saturday
  };

  // Fixed studio timezone (IANA name). Change if needed.
  const TIMEZONE = "America/Vancouver";

  const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  // Expose a tiny API in case you want to tweak at runtime
  window.StudioSchedule = {
    setSchedule(newSched){ Object.assign(SCHEDULE, newSched); refreshAll(); },
    getStatus(){ return computeStatus(); },
    refresh: refreshAll
  };

  // ---- Utilities ----
  const $ = sel => document.querySelector(sel);

  function minutesSinceMidnight(d){ return d.getHours()*60 + d.getMinutes(); }
  function parseHM(hm){ const [h,m] = hm.split(":").map(Number); return h*60 + m; }
  function fmt12h(mins){
    let h = Math.floor(mins/60), m = mins % 60;
    const ampm = h >= 12 ? "pm" : "am";
    h = ((h + 11) % 12) + 1;
    return `${h}:${String(m).padStart(2,"0")} ${ampm}`;
  }
  function to12h(hm){ return fmt12h(parseHM(hm)); }
  function intervalsForDay(dayIdx){
    return (SCHEDULE[dayIdx] || []).map(r => {
      const [a,b] = r.split("-");
      return [parseHM(a), parseHM(b)];
    });
  }

  // Get "now" in minutes since midnight + weekday for either local or fixed TZ
  function nowInTZ() {
    if (!TIMEZONE) {
      const d = new Date();
      return { day: d.getDay(), mins: minutesSinceMidnight(d) };
    }
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
    const map = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
    const day = map[parts.weekday];
    const mins = parseInt(parts.hour,10)*60 + parseInt(parts.minute,10);
    return { day, mins };
  }

  // ---- DOM refs (lazy) ----
  let elRoot, elStatus, elSub, elList;

  function getEls(){
    elRoot   = elRoot   || $("#studio-schedule");
    elStatus = elStatus || $("#ws-status");
    elSub    = elSub    || $("#ws-subline");
    elList   = elList   || $("#ws-list");
    return elRoot && elStatus && elSub && elList;
  }

  // ---- Render the weekly list ----
  function renderList(){
    if(!getEls()) return;
    elList.innerHTML = "";
    const today = nowInTZ().day;

    for(let i=0;i<7;i++){
      const hours = SCHEDULE[i];
      const dayCell = document.createElement("li");
      const timeCell = document.createElement("li");

      // allow "today" highlighting via CSS (optional .ws-today styles)
      if(i === today){
        dayCell.classList.add("ws-today");
        timeCell.classList.add("ws-today");
      }

      const dayLabel = document.createElement("span");
      dayLabel.className = "ws-day";
      dayLabel.textContent = DAY_NAMES[i];

      const timeLabel = document.createElement("span");
      timeLabel.className = "ws-time";

      if(!hours.length){
        timeLabel.textContent = "Closed";
        timeLabel.classList.add("ws-closed");
      }else{
        timeLabel.innerHTML = hours.map(r=>{
          const [a,b] = r.split("-");
          return `<time>${to12h(a)} – ${to12h(b)}</time>`;
        }).join(", ");
      }

      dayCell.appendChild(dayLabel);
      timeCell.appendChild(timeLabel);
      // grid uses display:contents on li in CSS, so two li per row:
      elList.appendChild(dayCell);
      elList.appendChild(timeCell);
    }
  }

  // ---- Compute open/closed status (uses Vancouver TZ) ----
  function computeStatus(){
    const { day: today, mins: nowMin } = nowInTZ();

    // Check today's intervals
    const todayIntervals = intervalsForDay(today);
    for(const [start,end] of todayIntervals){
      if(nowMin >= start && nowMin < end){
        return { isOpen:true, closesAt:end, day:today };
      }
    }

    // Find next opening within 7 days
    for(let offset=0; offset<7; offset++){
      const day = (today + offset) % 7;
      const intervals = intervalsForDay(day);
      if(!intervals.length) continue;

      if(offset === 0){
        // later today
        const later = intervals.find(([start]) => start > nowMin);
        if(later) return { isOpen:false, opensAt: later[0], day };
      }else{
        return { isOpen:false, opensAt: intervals[0][0], day };
      }
    }
    return { isOpen:false, opensAt:null, day:null }; // no openings at all
  }

  // ---- Apply status to the UI ----
  function applyStatus(){
    if(!getEls()) return;
    const st = computeStatus();
    const todayIdx = nowInTZ().day;

    if(st.isOpen){
      elStatus.textContent = "Open now";
      elRoot.classList.add("ws-open");
      elRoot.classList.remove("ws-closed");
      elStatus.setAttribute("aria-label","Studio is open");
      elSub.textContent = `Until ${fmt12h(st.closesAt)} today (${DAY_NAMES[st.day]}).`;
    }else{
      elStatus.textContent = "Closed";
      elRoot.classList.add("ws-closed");
      elRoot.classList.remove("ws-open");
      elStatus.setAttribute("aria-label","Studio is closed");

      if(st.opensAt != null){
        const label = (st.day === todayIdx) ? "today" : DAY_NAMES[st.day];
        elSub.textContent = `Opens ${label} at ${fmt12h(st.opensAt)}.`;
      }else{
        elSub.textContent = "No upcoming openings.";
      }
    }
  }

  function refreshAll(){
    renderList();
    applyStatus();
  }

  // ---- Init on DOM ready ----
  document.addEventListener("DOMContentLoaded", function(){
    if(!getEls()) return; // silently skip if the block isn't on this page
    refreshAll();
    // keep fresh
    setInterval(applyStatus, 60 * 1000);
  });
})();