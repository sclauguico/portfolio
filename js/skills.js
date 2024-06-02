document.addEventListener('DOMContentLoaded', () => {
    const skillsContainer = document.querySelector('.skills-container');

    if (skillsContainer) {
        skillsContainer.addEventListener('click', (event) => {
            const accordion = event.target.closest('.skills-accordion');
            if (accordion) {
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
            }
        });
    }
});
