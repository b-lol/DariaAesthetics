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