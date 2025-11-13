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


