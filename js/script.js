// Load menu component on every page
document.addEventListener('DOMContentLoaded', function() {
  const menuContainer = document.getElementById('menu-container');
  
  if (menuContainer) {
    fetch('/components/menu.html')
      .then(response => response.text())
      .then(html => {
        menuContainer.innerHTML = html;
      })
      .catch(error => console.error('Error loading menu:', error));
  }
});

// Load booking button component
document.addEventListener('DOMContentLoaded', function() {
  const bookingButtonContainer = document.getElementById('booking-button-container');
  
  if (bookingButtonContainer) {
    fetch('/components/booking_button.html')
      .then(response => response.text())
      .then(html => {
        bookingButtonContainer.innerHTML = html;
      })
      .catch(error => console.error('Error loading booking button:', error));
  }
});
//Load footer
document.addEventListener('DOMContentLoaded', function() {
  const footerContainer = document.getElementById('footer-container');
  
  if (footerContainer) {
    fetch('/components/footer.html')
      .then(response => response.text())
      .then(html => {
        footerContainer.innerHTML = html;
      })
      .catch(error => console.error('Error loading footer:', error));
  }
});
console.log("Script loaded succesfully!")

// Close dropdown when clicking outside (fixed class name)
window.onclick = function(event) {
    if (!event.target.matches('.dropdown') && 
        !event.target.matches('.dropdown span') &&
        !event.target.closest('.dropdown-container')) {
        
        const dropdown = document.getElementById("servicesDropdown");
        dropdown.classList.remove("show");
    }
}

// Load menu component on every page
document.addEventListener('DOMContentLoaded', function() {
  const menuContainer = document.getElementById('menu-container');
  
  if (menuContainer) {
    fetch('/components/menu.html')
      .then(response => response.text())
      .then(html => {
        menuContainer.innerHTML = html;
      })
      .catch(error => console.error('Error loading menu:', error));
  }
});


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

// Load menu component on every page
document.addEventListener('DOMContentLoaded', function() {
  const menuContainer = document.getElementById('menu-container');
  
  if (menuContainer) {
    fetch('/components/menu.html')
      .then(response => response.text())
      .then(html => {
        menuContainer.innerHTML = html;
      })
      .catch(error => console.error('Error loading menu:', error));
  }
});

//JS for the weekly schedule:
/* ===== Weekly Schedule (Vancouver TZ) ===== */
(function () {
  // ---- CONFIG: set your hours here ----
  // 0 = Sun ... 6 = Sat. Use 24h "HH:MM-HH:MM". Multiple ranges supported.
  const SCHEDULE = {
    0: [], // Sunday
    1: ["18:30-21:00"], // Monday
    2: ["10:00-19:00"], // Tuesday
    3: [], // Wednesday
    4: ["18:30-21:00"], // Thursday
    5: [], // Friday
    6: ["10:00-19:00"], // Saturday
  };

  // Fixed studio timezone (IANA name). Change if needed.
  const TIMEZONE = "America/Vancouver";

  const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Expose a tiny API in case you want to tweak at runtime
  window.StudioSchedule = {
    setSchedule(newSched) {
      Object.assign(SCHEDULE, newSched);
      refreshAll();
    },
    getStatus() {
      return computeStatus();
    },
    refresh: refreshAll,
  };

  // ---- Utilities ----
  const $ = (sel) => document.querySelector(sel);

  function minutesSinceMidnight(d) {
    return d.getHours() * 60 + d.getMinutes();
  }
  function parseHM(hm) {
    const [h, m] = hm.split(":").map(Number);
    return h * 60 + m;
  }
  function fmt12h(mins) {
    let h = Math.floor(mins / 60),
      m = mins % 60;
    const ampm = h >= 12 ? "pm" : "am";
    h = ((h + 11) % 12) + 1;
    return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
  }
  function to12h(hm) {
    return fmt12h(parseHM(hm));
  }
  function intervalsForDay(dayIdx) {
    return (SCHEDULE[dayIdx] || []).map((r) => {
      const [a, b] = r.split("-");
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
      hour12: false,
    });
    const parts = Object.fromEntries(
      fmt.formatToParts(new Date()).map((p) => [p.type, p.value])
    );
    const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = map[parts.weekday];
    const mins = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
    return { day, mins };
  }

  // ---- DOM refs (lazy) ----
  let elRoot, elStatus, elSub, elList;

  function getEls() {
    elRoot = elRoot || $("#studio-schedule");
    elStatus = elStatus || $("#ws-status");
    elSub = elSub || $("#ws-subline");
    elList = elList || $("#ws-list");
    return elRoot && elStatus && elSub && elList;
  }

  // ---- Render the weekly list ----
  function renderList() {
    if (!getEls()) return;
    elList.innerHTML = "";
    const today = nowInTZ().day;

    for (let i = 0; i < 7; i++) {
      const hours = SCHEDULE[i];
      const dayCell = document.createElement("li");
      const timeCell = document.createElement("li");

      // allow "today" highlighting via CSS (optional .ws-today styles)
      if (i === today) {
        dayCell.classList.add("ws-today");
        timeCell.classList.add("ws-today");
      }

      const dayLabel = document.createElement("span");
      dayLabel.className = "ws-day";
      dayLabel.textContent = DAY_NAMES[i];

      const timeLabel = document.createElement("span");
      timeLabel.className = "ws-time";

      if (!hours.length) {
        timeLabel.textContent = "Closed";
        timeLabel.classList.add("ws-closed");
      } else {
        timeLabel.innerHTML = hours
          .map((r) => {
            const [a, b] = r.split("-");
            return `<time>${to12h(a)} – ${to12h(b)}</time>`;
          })
          .join(", ");
      }

      dayCell.appendChild(dayLabel);
      timeCell.appendChild(timeLabel);
      // grid uses display:contents on li in CSS, so two li per row:
      elList.appendChild(dayCell);
      elList.appendChild(timeCell);
    }
  }

  // ---- Compute open/closed status (uses Vancouver TZ) ----
  function computeStatus() {
    const { day: today, mins: nowMin } = nowInTZ();

    // Check today's intervals
    const todayIntervals = intervalsForDay(today);
    for (const [start, end] of todayIntervals) {
      if (nowMin >= start && nowMin < end) {
        return { isOpen: true, closesAt: end, day: today };
      }
    }

    // Find next opening within 7 days
    for (let offset = 0; offset < 7; offset++) {
      const day = (today + offset) % 7;
      const intervals = intervalsForDay(day);
      if (!intervals.length) continue;

      if (offset === 0) {
        // later today
        const later = intervals.find(([start]) => start > nowMin);
        if (later) return { isOpen: false, opensAt: later[0], day };
      } else {
        return { isOpen: false, opensAt: intervals[0][0], day };
      }
    }
    return { isOpen: false, opensAt: null, day: null }; // no openings at all
  }

  // ---- Apply status to the UI ----
  function applyStatus() {
    if (!getEls()) return;
    const st = computeStatus();
    const todayIdx = nowInTZ().day;

    if (st.isOpen) {
      elStatus.textContent = "Open now";
      elRoot.classList.add("ws-open");
      elRoot.classList.remove("ws-closed");
      elStatus.setAttribute("aria-label", "Studio is open");
      elSub.textContent = `Until ${fmt12h(st.closesAt)} today (${
        DAY_NAMES[st.day]
      }).`;
    } else {
      elStatus.textContent = "Closed";
      elRoot.classList.add("ws-closed");
      elRoot.classList.remove("ws-open");
      elStatus.setAttribute("aria-label", "Studio is closed");

      if (st.opensAt != null) {
        const label = st.day === todayIdx ? "today" : DAY_NAMES[st.day];
        elSub.textContent = `Opens ${label} at ${fmt12h(st.opensAt)}.`;
      } else {
        elSub.textContent = "No upcoming openings.";
      }
    }
  }

  function refreshAll() {
    renderList();
    applyStatus();
  }

  // ---- Init on DOM ready ----
  document.addEventListener("DOMContentLoaded", function () {
    if (!getEls()) return; // silently skip if the block isn't on this page
    refreshAll();
    // keep fresh
    setInterval(applyStatus, 60 * 1000);
  });
})();



