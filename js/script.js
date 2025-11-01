function toggleDropdown(){
    const dropdown = document.getElementById("servicesDropdown");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

// Close dropdown when clicking outside (fixed class name)
window.onclick = function(event) {
    if (!event.target.matches('.dropdown') && !event.target.matches('.dropdown span')) {
        const dropdown = document.getElementById("servicesDropdown");
        dropdown.style.display = "none";
    }
}