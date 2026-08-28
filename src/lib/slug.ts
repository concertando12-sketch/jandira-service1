// Faixa unicode das marcas diacríticas combinantes (acentos), depois de
// normalizar a string em NFD — usado para tirar acento na hora de gerar
// slug. Compartilhado entre admin (categorias/serviços/bairros) e as
// ações do prestador (sugestão de bairro).
const DIACRITICS_REGEX = /[̀-ͯ]/g;

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
