// Pricing Page - Fetch and Display Services from Square

// Category mapping - organize services by body area
const CATEGORY_MAP = {
  'Face & Brows': [
    'Eyebrows', '1 Face zone', 'Full face', 'Brow tinting', 'Lash tint', 'Nose'
  ],
  'Upper Body': [
    'Underarms', 'Full arms', 'Forearms', 'Chest', 'Stomach', 'Full chest',
    'Half stomach', 'Full back', 'Half back', 'Neck line'
  ],
  'Lower Body': [
    'Full legs', 'Upper legs', 'Lower legs', 'Inner thighs', 'Navel'
  ],
  'Intimate Areas': [
    'Bikini line', 'French line', 'Brazilian', 'Bum cheeks', 
    'Between the cheeks'
  ],
  'Treatments': [
    'Ingrown hair treatment', 'Ingrown extraction', 'Serum'
  ]
};

// Services that are women-only (no men's pricing)
const WOMEN_ONLY = ['Brazilian'];

// Men's price markup
const MENS_MARKUP = 15;

// Fetch services from API
async function loadServices() {
  const loadingEl = document.getElementById('services-loading');
  const containerEl = document.getElementById('services-container');
  
  try {
    const response = await fetch('http://localhost:3000/api/services');
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    console.log('Services loaded:', data.services);
    
    // Hide loading
    loadingEl.style.display = 'none';
    
    // Organize and render services
    renderServices(data.services);
    
  } catch (error) {
    console.error('Error loading services:', error);
    loadingEl.style.display = 'none';
    containerEl.innerHTML = `
      <div class="error-message">
        <h2>Error Loading Services</h2>
        <p>${error.message}</p>
        <p>Make sure your backend server is running.</p>
      </div>
    `;
  }
}

// Organize services into categories
function organizeServices(services) {
  const organized = {};
  
  // Initialize categories
  Object.keys(CATEGORY_MAP).forEach(category => {
    organized[category] = [];
  });
  
  // Sort services into categories
  services.forEach(service => {
    let placed = false;
    
    for (const [category, serviceNames] of Object.entries(CATEGORY_MAP)) {
      if (serviceNames.includes(service.name)) {
        organized[category].push(service);
        placed = true;
        break;
      }
    }
    
    // If not categorized, skip it (like "Men" service which is unclear)
    if (!placed && service.name !== 'Men') {
      console.log('Uncategorized service:', service.name);
    }
  });
  
  return organized;
}

// Render all services organized by category
function renderServices(services) {
  const containerEl = document.getElementById('services-container');
  const organized = organizeServices(services);
  
  let html = '';
  
  // Render each category
  Object.entries(organized).forEach(([category, categoryServices]) => {
    if (categoryServices.length === 0) return; // Skip empty categories
    
    html += `
      <div class="service-category">
        <h2 class="category-title">${category}</h2>
        <div class="services-columns">
          <div class="services-column">
            ${renderServiceList(categoryServices)}
          </div>
        </div>
      </div>
    `;
  });
  
  containerEl.innerHTML = html;
}

// Render a list of services
function renderServiceList(services) {
  let html = '';
  
  services.forEach(service => {
    const price = service.variations[0]?.price || 0;
    const description = service.description;
    
    html += `
      <div class="service-item">
        <div class="service-header">
          <span class="service-name">${service.name}</span>
          <span class="service-price">$${price}</span>
        </div>
        ${description ? `<div class="service-description">${description}</div>` : ''}
      </div>
    `;
  });
  
  return html;
}

// Load services when page loads
if (document.getElementById('services-container')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadServices);
  } else {
    loadServices();
  }
}