export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-transparent px-6 py-16 flex justify-center">
      
      <div className="max-w-xl w-full rounded-3xl bg-white/90 p-10 shadow-md text-center">

        <h1 className="text-3xl font-bold text-slate-800">
          Contato
        </h1>

        <p className="mt-4 text-slate-600">
          Entre em contato para tirar dúvidas ou iniciar seu agendamento.
        </p>


        {/* WHATSAPP */}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">

          <h2 className="text-xl font-semibold text-slate-800">
            WhatsApp
          </h2>

          <p className="mt-2 text-slate-600">
            Atendimento rápido para dúvidas e confirmação de consultas.
          </p>

          <a
            href="https://wa.me/5547992034457"
            className="mt-4 inline-block rounded-2xl bg-green-500 px-6 py-3 text-white font-semibold hover:bg-green-600"
          >
            Falar no WhatsApp
          </a>

        </div>


        {/* AGENDAMENTO */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">

          <h2 className="text-xl font-semibold text-slate-800">
            Agendamento
          </h2>

          <p className="mt-2 text-slate-600">
            Faça seu agendamento online com praticidade.
          </p>

          <a
            href="/agendar"
            className="mt-4 inline-block rounded-2xl bg-slate-800 px-6 py-3 text-white font-semibold hover:bg-slate-900"
          >
            Ir para agendamento
          </a>

        </div>


        {/* ENDEREÇO */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">

          <h2 className="text-xl font-semibold text-slate-800">
            Endereço
          </h2>

          <p className="mt-2 text-slate-600">
            Espaço reservado para endereço futuro da clínica.
          </p>

        </div>


        {/* EMAIL */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">

          <h2 className="text-xl font-semibold text-slate-800">
            E-mail
          </h2>

          <p className="mt-2 text-slate-600">
            Entre em contato também pelo e-mail profissional:
          </p>

          <a
            href="mailto:psi.daianedamasceno@gmail.com"
            className="mt-3 block text-blue-600 font-semibold hover:underline"
          >
            psi.daianedamasceno@gmail.com
          </a>

        </div>

      </div>

    </div>
  );
}
