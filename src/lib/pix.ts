import QRCode from "qrcode";

// Gera o payload PIX no padrão "BR Code" do Banco Central (EMV QR
// Code) — o mesmo formato que qualquer banco/carteira sabe ler.
// Referência: manual de padrões do Bacen (QR Code estático).
function tlv(id: string, value: string) {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

// CRC16-CCITT (falso), como exigido no payload PIX.
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Remove acento/caractere especial — o padrão só aceita ASCII básico
// nesses campos.
function sanitize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim();
}

export function buildPixPayload({
  pixKey,
  receiverName,
  city,
  amount,
}: {
  pixKey: string;
  receiverName: string;
  city: string;
  amount: number;
}): string {
  const merchantAccountInfo = tlv("00", "br.gov.bcb.pix") + tlv("01", pixKey);
  const additionalData = tlv("05", "***"); // txid genérico — QR estático, sem pedido específico associado

  const fields =
    tlv("00", "01") + // Payload Format Indicator
    tlv("26", merchantAccountInfo) + // Merchant Account Information (PIX)
    tlv("52", "0000") + // Merchant Category Code
    tlv("53", "986") + // Transaction Currency (BRL)
    tlv("54", amount.toFixed(2)) + // Transaction Amount
    tlv("58", "BR") + // Country Code
    tlv("59", sanitize(receiverName).slice(0, 25) || "JANDIRA SERVICE") + // Merchant Name
    tlv("60", sanitize(city).slice(0, 15) || "JANDIRA") + // Merchant City
    tlv("62", additionalData); // Additional Data Field Template

  const withCrcPlaceholder = `${fields}6304`;
  return `${withCrcPlaceholder}${crc16(withCrcPlaceholder)}`;
}

// PNG em data URL — dá pra usar direto num <img>, sem precisar de
// nenhum serviço externo pra gerar o QR.
export async function buildPixQrDataUrl(opts: {
  pixKey: string;
  receiverName: string;
  city: string;
  amount: number;
}): Promise<string> {
  const payload = buildPixPayload(opts);
  return QRCode.toDataURL(payload, { width: 320, margin: 1 });
}
