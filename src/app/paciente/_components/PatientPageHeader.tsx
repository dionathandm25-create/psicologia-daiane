export default function PatientPageHeader({
  section,
  title,
  description,
}: {
  section: string;
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6c38]">
        {section}
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#572936] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71545a]">
        {description}
      </p>
    </header>
  );
}
