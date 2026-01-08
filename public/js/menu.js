// ===== MENÚ HAMBURGUESA =====
const toggle = document.getElementById("menuToggle");
const menu = document.getElementById("menuMobile");

// Función para abrir/cerrar menú
function toggleMenu() {
    menu.classList.toggle("active");
    toggle.classList.toggle("active");
}

// Función para cerrar menú
function closeMenu() {
    menu.classList.remove("active");
    toggle.classList.remove("active");
}

// Evento click en el botón hamburguesa
if (toggle) {
    toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleMenu();
    });
}

// Cerrar menú al hacer clic fuera
document.addEventListener("click", (e) => {
    if (menu && toggle && !menu.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
    }
});

// Cerrar menú al hacer clic en un enlace del menú
if (menu) {
    const menuLinks = menu.querySelectorAll("a");
    menuLinks.forEach(link => {
        link.addEventListener("click", () => {
            closeMenu();
        });
    });
}

// Cerrar menú al redimensionar la ventana
window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
        closeMenu();
    }
});

// ===== DROPDOWN DE ACCESO =====
const accesoDropdown = document.getElementById('accesoDropdown');
const dropdownMenu = document.getElementById('dropdownMenu');

// Función para abrir/cerrar dropdown
function toggleAccesoDropdown() {
    accesoDropdown.classList.toggle('active');
}

// Función para cerrar dropdown
function closeAccesoDropdown() {
    accesoDropdown.classList.remove('active');
}

// Evento click en el dropdown de acceso
if (accesoDropdown) {
    accesoDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAccesoDropdown();
    });
}

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', (e) => {
    if (accesoDropdown && !accesoDropdown.contains(e.target)) {
        closeAccesoDropdown();
    }
});

// Cerrar dropdown al hacer clic en un enlace del dropdown
if (dropdownMenu) {
    const dropdownLinks = dropdownMenu.querySelectorAll('a');
    dropdownLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeAccesoDropdown();
        });
    });
}

// Cerrar ambos menús al presionar Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMenu();
        closeAccesoDropdown();
    }
});

// ===== GESTIÓN DE SCROLL =====
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

// Opcional: Ocultar navbar al hacer scroll hacia abajo (solo móviles)
window.addEventListener('scroll', () => {
    if (window.innerWidth <= 768) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling hacia abajo
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling hacia arriba
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    }
});

// Asegurar que el navbar vuelva a aparecer al redimensionar
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navbar.style.transform = 'translateY(0)';
    }
});

console.log('✅ Navegación inicializada correctamente');