// ===== STUDIO SCHEDULE (Single Source of Truth) =====
// 0 = Sunday, 1 = Monday, ... 6 = Saturday
// Format: "HH:MM-HH:MM" in 24-hour time

const STUDIO_SCHEDULE = {
  0: [], // Sunday - closed
  1: ["18:30-21:00"], // Monday
  2: ["10:00-19:00"], // Tuesday
  3: [], // Wednesday - closed
  4: ["18:30-21:00"], // Thursday
  5: [], // Friday - closed
  6: ["10:00-19:00"], // Saturday
};

// Helper function to get hours for a specific day
function getScheduleForDay(dayIndex) {
  return STUDIO_SCHEDULE[dayIndex] || [];
}

// Helper function to parse "HH:MM" into hour number
function parseHour(timeStr) {
  return parseInt(timeStr.split(":")[0], 10);
}

// Get start and end hours for a specific day
function getDayHours(dayIndex) {
  const hours = STUDIO_SCHEDULE[dayIndex];
  
  if (!hours || hours.length === 0) {
    return null; // Closed
  }
  
  // Get first opening and last closing
  const firstSlot = hours[0];
  const lastSlot = hours[hours.length - 1];
  
  const [openTime] = firstSlot.split("-");
  const [, closeTime] = lastSlot.split("-");
  
  return {
    start: parseHour(openTime),
    end: parseHour(closeTime),
  };
}