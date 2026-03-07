export default function WhatsAppFloat() {
  const phone = "5551986545485";
  const message = "Olá! Quero agendar uma consulta.";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg transition hover:scale-105 hover:bg-green-600"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="h-8 w-8 fill-white"
      >
        <path d="M19.11 17.21c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.89-.79-1.5-1.76-1.67-2.06-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.05 1.02-1.05 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.48.71.31 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35z" />
        <path d="M16.03 3C8.84 3 3 8.73 3 15.8c0 2.5.74 4.9 2.13 6.96L3.74 29l6.43-1.66c1.96 1.06 4.17 1.62 5.86 1.62h.01c7.19 0 13.03-5.73 13.03-12.8C29.06 8.73 23.22 3 16.03 3zm0 23.78h-.01c-1.53 0-3.03-.41-4.34-1.18l-.31-.18-3.82.99 1.02-3.71-.2-.38a10.6 10.6 0 0 1-1.36-5.16c0-5.86 4.84-10.63 10.8-10.63 2.89 0 5.6 1.11 7.64 3.12a10.44 10.44 0 0 1 3.16 7.5c0 5.86-4.84 10.63-10.58 10.63z" />
      </svg>
    </a>
  );
}
