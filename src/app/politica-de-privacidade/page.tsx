export default function PoliticaDePrivacidadePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-bold text-slate-800">
            Política de Privacidade
          </h1>

          <div className="mt-8 space-y-6 text-slate-600">
            <p>
              Este site coleta apenas os dados necessários para realizar o
              agendamento de consultas, como nome, CPF, telefone, serviço,
              data e horário selecionados.
            </p>

            <p>
              As informações fornecidas são utilizadas exclusivamente para
              organização do atendimento, contato com o paciente e futura
              confirmação da consulta.
            </p>

            <p>
              Nenhum conteúdo clínico sensível, prontuário ou anotação
              terapêutica é exibido publicamente neste site.
            </p>

            <p>
              Áreas administrativas futuras, caso implementadas, deverão
              possuir autenticação e controle de acesso apropriado.
            </p>

            <p>
              Ao utilizar este site, o usuário concorda com o envio dos
              dados necessários para o fluxo de agendamento.
            </p>

            <p>
              Esta página poderá ser atualizada futuramente para adequação
              a integrações, banco de dados e novas funcionalidades.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
