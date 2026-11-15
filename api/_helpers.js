// Funções puras. Jamais aceitar IDs de responsáveis como origem de autorização.
export const ANOS = new Set([0,1,2,3,4,5,6]);
export const AVATARES = new Set(['astronauta', 'robo', 'estrela', 'foguete', 'planeta', 'dinossauro']);
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validarPerfil(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error:'Dados inválidos.' };
  const apelido = typeof input.apelido === 'string' ? input.apelido.trim().replace(/\s+/g,' ') : '';
  if (apelido.length < 2 || apelido.length > 24 || !/^[\p{L}\p{N} ._\-]+$/u.test(apelido)) return { error:'Use um apelido de 2 a 24 caracteres, sem símbolos especiais.' };
  if (typeof input.avatar !== 'string' || !AVATARES.has(input.avatar)) return { error:'Escolha um avatar disponível.' };
  if (!Number.isInteger(input.ano_escolar) || !ANOS.has(input.ano_escolar)) return { error:'Escolha um ano escolar válido.' };
  return { apelido, avatar:input.avatar, ano_escolar:input.ano_escolar };
}

export function autorizadoParaCriar(input) {
  return input?.sou_responsavel === true && input?.aceito_dados === true;
}

export function validarId(id) { return typeof id === 'string' && UUID_RE.test(id); }

export function extrairBearer(value) {
  if (typeof value !== 'string') return null;
  const match = /^Bearer ([A-Za-z0-9._~+\/-]+)$/i.exec(value.trim());
  return match ? match[1] : null;
}

export function respostaJson(res, status, body) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(status).json(body);
}

export function validarEmailConvite(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 180 && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email) ? email : null;
}
