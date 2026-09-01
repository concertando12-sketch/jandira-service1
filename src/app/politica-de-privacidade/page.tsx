import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { APP_CITY, APP_STATE, SUPPORT_WHATSAPP_PHONE } from "@/lib/constants";

export default function PoliticaDePrivacidadePage() {
  return (
    <LegalPageShell title="Política de Privacidade" updatedAt="30 de agosto de 2026">
      <p>
        Esta política explica quais dados o Jandira Service coleta, para que servem e quais
        direitos você tem sobre eles, em conformidade com a Lei Geral de Proteção de Dados
        (LGPD — Lei nº 13.709/2018).
      </p>

      <div>
        <h2>1. Quais dados coletamos</h2>
        <ul>
          <li>
            <strong>Cadastro:</strong> nome completo, e-mail, WhatsApp, CPF e senha
            (a senha nunca fica visível pra nós — é armazenada de forma criptografada).
          </li>
          <li>
            <strong>Endereço:</strong> cidade, bairro, rua, número e complemento — usados pra
            encontrar profissionais na sua região. Seu endereço completo nunca aparece
            publicamente; só o bairro é mostrado pra outros usuários.
          </li>
          <li>
            <strong>Perfil do prestador:</strong> foto, descrição, faixa de preço,
            disponibilidade e os serviços que oferece.
          </li>
          <li>
            <strong>Foto de perfil</strong> (cliente e prestador), quando você optar por enviar
            uma.
          </li>
          <li>
            <strong>Avaliações:</strong> nota e comentário que você deixa após um serviço
            concluído.
          </li>
          <li>
            <strong>Comprovante de pagamento (PIX):</strong> a imagem ou PDF que você envia pra
            confirmar a assinatura mensal — fica num espaço privado, visível só pra você e pra
            administração, usado exclusivamente pra conferir o pagamento.
          </li>
          <li>
            <strong>Uso da plataforma:</strong> solicitações de serviço, favoritos, notificações
            e denúncias que você registra.
          </li>
        </ul>
      </div>

      <div>
        <h2>2. Como usamos esses dados</h2>
        <p>
          Usamos seus dados exclusivamente para: conectar clientes e prestadores de serviço em
          {" "}
          {APP_CITY} - {APP_STATE}; permitir a busca por serviço e região; processar e
          acompanhar solicitações de serviço; calcular avaliações e reputação dos prestadores;
          confirmar o pagamento da assinatura mensal; e enviar notificações sobre o andamento
          dos seus pedidos.
        </p>
        <p>
          Não vendemos, alugamos nem compartilhamos seus dados com terceiros para fins de
          publicidade. Não usamos nenhuma API externa (como Google Maps) que envie seus dados
          pra fora da plataforma.
        </p>
      </div>

      <div>
        <h2>3. Com quem seus dados são compartilhados</h2>
        <ul>
          <li>
            Seu <strong>nome, foto, avaliações e serviços oferecidos</strong> ficam visíveis
            publicamente pra outros usuários da plataforma (é assim que a busca funciona).
          </li>
          <li>
            Seu <strong>endereço completo, CPF e comprovante de pagamento</strong> nunca
            aparecem publicamente — são vistos só por você e pela administração da plataforma.
          </li>
          <li>
            Quando você contrata um prestador (ou aceita um pedido, se for prestador), seu nome
            e WhatsApp podem ser usados pela outra parte pra combinar os detalhes do
            serviço — essa conversa acontece fora da plataforma, diretamente pelo WhatsApp.
          </li>
        </ul>
      </div>

      <div>
        <h2>4. Onde seus dados ficam armazenados</h2>
        <p>
          Seus dados são armazenados de forma segura na infraestrutura do Supabase, com
          controle de acesso por linha (Row Level Security) — ou seja, o próprio banco de dados
          impede que um usuário acesse dados de outro, mesmo em caso de falha na aplicação.
        </p>
      </div>

      <div>
        <h2>5. Seus direitos (LGPD)</h2>
        <p>Você pode, a qualquer momento:</p>
        <ul>
          <li>Acessar e corrigir seus dados diretamente no seu perfil, dentro do app.</li>
          <li>Solicitar a exclusão da sua conta e dos seus dados.</li>
          <li>Solicitar uma cópia dos dados que temos sobre você.</li>
          <li>Retirar seu consentimento a qualquer momento.</li>
        </ul>
        <p>
          Pra exercer qualquer um desses direitos, entre em contato pelo WhatsApp de suporte:{" "}
          <strong>{SUPPORT_WHATSAPP_PHONE}</strong>.
        </p>
      </div>

      <div>
        <h2>6. Alterações nesta política</h2>
        <p>
          Podemos atualizar esta política de tempos em tempos. Mudanças relevantes serão
          avisadas dentro do app.
        </p>
      </div>
    </LegalPageShell>
  );
}
