import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { APP_CITY, APP_STATE, SUPPORT_WHATSAPP_PHONE } from "@/lib/constants";

export default function TermosDeUsoPage() {
  return (
    <LegalPageShell title="Termos de Uso" updatedAt="30 de agosto de 2026">
      <p>
        Ao criar uma conta no Jandira Service, você concorda com os termos abaixo. Leia com
        atenção.
      </p>

      <div>
        <h2>1. O que é o Jandira Service</h2>
        <p>
          O Jandira Service é uma plataforma que conecta clientes a prestadores de serviço em
          {" "}
          {APP_CITY} - {APP_STATE}. Nós facilitamos o encontro entre as partes (busca por
          serviço e região, solicitação, avaliação), mas <strong>não somos parte</strong> no
          serviço contratado.
        </p>
      </div>

      <div>
        <h2>2. Cadastro</h2>
        <ul>
          <li>Você precisa ter 18 anos ou mais pra criar uma conta.</li>
          <li>As informações que você cadastra (nome, e-mail, WhatsApp, CPF) precisam ser verdadeiras.</li>
          <li>Você é responsável por manter sua senha em sigilo e por tudo que acontecer na sua conta.</li>
          <li>Uma conta é pessoal e intransferível.</li>
        </ul>
      </div>

      <div>
        <h2>3. Assinatura mensal</h2>
        <p>
          Cliente e prestador precisam manter uma assinatura mensal ativa pra usar
          determinadas funções da plataforma (cliente: solicitar serviço; prestador: aparecer
          na busca). O pagamento é feito por PIX, de forma manual: você paga a chave informada
          no app e envia o comprovante pra análise. A assinatura é aprovada pela administração
          após conferência do comprovante, e vale por 1 mês a partir da aprovação.
        </p>
        <p>Não fazemos cobrança automática nem armazenamos dados de cartão.</p>
      </div>

      <div>
        <h2>4. Relação entre cliente e prestador</h2>
        <ul>
          <li>
            O <strong>valor, prazo, forma de pagamento do serviço contratado e qualquer
            negociação</strong> são combinados diretamente entre cliente e prestador — o
            Jandira Service não participa, não garante e não se responsabiliza por esses
            acordos.
          </li>
          <li>
            O Jandira Service não se responsabiliza pela qualidade do serviço prestado, por
            danos, atrasos ou qualquer problema decorrente da relação entre cliente e
            prestador.
          </li>
          <li>
            Recomendamos sempre combinar os detalhes por escrito (pelo WhatsApp) antes de
            iniciar qualquer serviço.
          </li>
        </ul>
      </div>

      <div>
        <h2>5. Homologação de prestadores</h2>
        <p>
          Todo prestador passa por uma análise da administração antes de aparecer nas buscas.
          Isso não é uma garantia de qualidade do serviço — é apenas uma verificação cadastral
          básica.
        </p>
      </div>

      <div>
        <h2>6. Avaliações</h2>
        <p>
          Após um serviço concluído, o cliente pode avaliar o prestador com nota e comentário.
          Avaliações precisam ser verdadeiras e respeitosas. A administração pode ocultar
          avaliações que violem essas regras, sem excluir o registro.
        </p>
      </div>

      <div>
        <h2>7. Condutas proibidas</h2>
        <ul>
          <li>Cadastrar dados falsos ou de outra pessoa.</li>
          <li>Usar a plataforma pra fins ilegais ou fraudulentos.</li>
          <li>Assediar, ameaçar ou discriminar outros usuários.</li>
          <li>Tentar burlar a moderação, a assinatura ou os controles de segurança do app.</li>
        </ul>
        <p>
          O descumprimento pode levar à suspensão ou ao cancelamento da conta, a critério da
          administração.
        </p>
      </div>

      <div>
        <h2>8. Denúncias e moderação</h2>
        <p>
          Você pode denunciar um usuário diretamente no app. A administração analisa cada
          denúncia e pode advertir, suspender ou banir contas que violem estes termos.
        </p>
      </div>

      <div>
        <h2>9. Cancelamento</h2>
        <p>
          Você pode parar de usar o app quando quiser. Pra excluir sua conta e seus dados,
          entre em contato pelo suporte.
        </p>
      </div>

      <div>
        <h2>10. Alterações nestes termos</h2>
        <p>
          Podemos atualizar estes termos de tempos em tempos. Mudanças relevantes serão
          avisadas dentro do app.
        </p>
      </div>

      <div>
        <h2>11. Contato</h2>
        <p>
          Dúvidas sobre estes termos? Fale com a gente pelo WhatsApp de suporte:{" "}
          <strong>{SUPPORT_WHATSAPP_PHONE}</strong>.
        </p>
      </div>
    </LegalPageShell>
  );
}
