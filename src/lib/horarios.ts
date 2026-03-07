export const horariosPorDia: Record<string, string[]> = {
  "Segunda-feira": ["19:00", "20:00", "21:00"],
  "Terça-feira": ["13:00", "14:00", "15:00", "16:00"],
  "Quarta-feira": ["19:00", "20:00", "21:00", "22:00"],
  "Quinta-feira": ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"],
  "Sexta-feira": ["19:00", "20:00", "21:00", "22:00"],
  "Sábado": ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"],
  Domingo: [],
};

export function obterDiaSemana(data: string) {
  if (!data) return "";

  const dia = new Date(`${data}T12:00:00`);
  const nomes = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  return nomes[dia.getDay()];
}

export function formatarCPF(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  return numeros
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
