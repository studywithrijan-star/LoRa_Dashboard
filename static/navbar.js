document.addEventListener("DOMContentLoaded", function() {
    const menu = document.getElementById("mobile-menu");
    const navLinks = document.getElementById("nav-links");

    if (menu) {
        menu.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }
});
