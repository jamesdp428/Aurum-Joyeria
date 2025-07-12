const toggle = document.getElementById("menuToggle");
const menu = document.getElementById("menuMobile");

toggle.addEventListener("click", () => {
    menu.classList.toggle("active");
});

