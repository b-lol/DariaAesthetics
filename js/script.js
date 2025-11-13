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

