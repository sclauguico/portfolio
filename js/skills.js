document.addEventListener('DOMContentLoaded', () => {
    const accordions = document.querySelectorAll('.skills-accordion');

    accordions.forEach(accordion => {
        accordion.addEventListener('click', () => {
            const parent = accordion.closest('.skills-grid');
            const isOpen = parent.classList.contains('skills-open');

            document.querySelectorAll('.skills-grid').forEach(grid => {
                grid.classList.remove('skills-open');
                grid.classList.add('skills-close');
            });

            if (!isOpen) {
                parent.classList.add('skills-open');
                parent.classList.remove('skills-close');
            }
        });
    });
});
