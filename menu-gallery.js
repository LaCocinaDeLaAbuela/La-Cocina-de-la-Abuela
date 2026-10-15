document.addEventListener('DOMContentLoaded', function () {
  const gallery = document.getElementById('menuGallery');
  if (!gallery) return;

  const menuItems = Array.from(gallery.querySelectorAll('.menu-item'));
  const imageSources = menuItems.map(item => item.querySelector('img').src);

  const modal = document.createElement('div');
  modal.className = 'menu-modal';
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('role', 'dialog');

  modal.innerHTML = `
    <div class="modal-body">
      <div class="modal-header">
        <div class="title">Menú</div>
        <button class="modal-close" aria-label="Cerrar">✕</button>
      </div>
      <div class="modal-content">
        <img src="" alt="Menú ampliado">
      </div>
      <div class="modal-nav">
        <button type="button" class="prev" aria-label="Anterior">&#9664;</button>
        <button type="button" class="next" aria-label="Siguiente">&#9654;</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const modalImg = modal.querySelector('.modal-content img');
  const btnClose = modal.querySelector('.modal-close');
  const btnPrev = modal.querySelector('.prev');
  const btnNext = modal.querySelector('.next');

  let currentIndex = 0;

  function openModal(index) {
    currentIndex = index;
    modalImg.src = imageSources[currentIndex];
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    btnClose.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    modalImg.src = '';
  }

  function changeImage(step) {
    currentIndex = (currentIndex + step + imageSources.length) % imageSources.length;
    modalImg.src = imageSources[currentIndex];
  }

  menuItems.forEach((item, index) => {
    item.addEventListener('click', () => openModal(index));
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(index);
      }
    });
  });

  btnClose.addEventListener('click', closeModal);
  btnPrev.addEventListener('click', () => changeImage(-1));
  btnNext.addEventListener('click', () => changeImage(1));

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('open')) return;

    if (event.key === 'Escape') closeModal();
    if (event.key === 'ArrowRight') changeImage(1);
    if (event.key === 'ArrowLeft') changeImage(-1);
  });
});
