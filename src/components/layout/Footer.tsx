export default function Footer() {
  const mensagem = encodeURIComponent(
    "Olá! Gostaria de criar um site para o meu negócio.\n\nVi o trabalho da Dra. Daiane Damasceno e gostaria de criar algo semelhante, personalizado para minha empresa.\n\nGostaria de saber como funciona e solicitar um orçamento."
  );

  const whatsappUrl = `https://wa.me/5547992479888?text=${mensagem}`;

  return (
    <footer className="text-center py-6">
      <p className="text-sm text-gray-600">
        Todos os direitos autorais reservados 2026 – Criado por Dionathan Martins
      </p>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm font-medium text-green-600 hover:text-green-700 hover:underline"
      >
        Quero criar meu site
      </a>
    </footer>
  );
}
