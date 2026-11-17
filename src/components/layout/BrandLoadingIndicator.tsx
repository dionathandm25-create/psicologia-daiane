import Image from "next/image";

type BrandLoadingIndicatorProps = {
  overlay?: boolean;
};

export default function BrandLoadingIndicator({
  overlay = false,
}: BrandLoadingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando Transformação Saúde"
      className={
        overlay
          ? "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FEEDD9]/85 px-4 backdrop-blur-[2px]"
          : "flex min-h-[65vh] flex-col items-center justify-center bg-[#FEEDD9]/85 px-4 py-12 backdrop-blur-[2px]"
      }
    >
      <div className="brand-loader-emblem" aria-hidden="true">
        <div className="brand-loader-grid" />
        <Image
          src="/images/transformacao-saude/logo/logo-carregamento-referencia.jpeg"
          alt=""
          width={768}
          height={768}
          sizes="152px"
          className="brand-loader-logo"
        />
      </div>
      <p className="mt-6 text-sm font-semibold tracking-wide text-[#640219]">
        Preparando sua experiência...
      </p>
    </div>
  );
}
