import './project-index';

declare global {
  interface Window {
    openResume: () => void;
    copyEmail: (event: MouseEvent) => void;
    showContactPopup: (event: MouseEvent) => void;
    closeContactPopup: () => void;
  }
}

window.openResume = () => window.open(import.meta.env.BASE_URL + 'resume', '_blank');

window.copyEmail = (event: MouseEvent) => {
  event.preventDefault();
  navigator.clipboard.writeText('philippeho27@gmail.com').then(() => {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'fixed bottom-10 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-white px-6 py-2 font-mono text-sm font-bold text-black shadow-2xl';
      document.body.appendChild(toast);
    }
    toast.textContent = 'Copied to clipboard!';
  });
};

window.showContactPopup = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  document.querySelector<HTMLElement>('.contact-popup')?.style.setProperty('display', 'block');
};

window.closeContactPopup = () => {
  document.querySelector<HTMLElement>('.contact-popup')?.style.setProperty('display', 'none');
};

document.addEventListener('click', (event) => {
  const popup = document.querySelector<HTMLElement>('.contact-popup');
  const button = document.getElementById('contact-info-btn');
  if (popup?.style.display === 'block' && !popup.contains(event.target as Node) && event.target !== button) {
    window.closeContactPopup();
  }
});
