window.addEventListener("scroll", function() {
    const teamSection = document.querySelector(".team-section");
    const sectionTop = teamSection.getBoundingClientRect().top;
    const screenHeight = window.innerHeight;

    if(sectionTop < screenHeight - 100){
        teamSection.classList.add("show");
        teamSection.classList.remove("hidden");
    }
});

