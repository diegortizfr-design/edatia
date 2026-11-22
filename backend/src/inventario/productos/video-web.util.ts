import { BadRequestException } from '@nestjs/common';

/**
 * Validación y normalización de los videos web de un producto (metadataWeb.videos).
 *
 * - Acepta TikTok, YouTube (incluye Shorts), Instagram, Facebook, Vimeo y archivos .mp4/.webm/Cloudinary.
 * - Resuelve en el servidor los enlaces cortos de TikTok (vt.tiktok.com / vm.tiktok.com / tiktok.com/t/),
 *   porque el navegador de la tienda no puede seguir esas redirecciones (CORS).
 * - Solo sigue redirecciones que permanecen dentro de tiktok.com (sin riesgo de SSRF).
 *
 * La tienda vuelve a validar cada URL y construye el embed oficial a partir de un ID verificado.
 */

export type PlataformaVideo = 'tiktok' | 'youtube' | 'instagram' | 'facebook' | 'vimeo' | 'archivo';

export interface VideoWeb {
  url: string;
  plataforma: PlataformaVideo;
  titulo?: string;
}

export const MAX_VIDEOS_WEB = 6;
const MAX_LARGO_URL = 600;
const MAX_LARGO_TITULO = 80;
const TIMEOUT_MS = 6000;
const MAX_SALTOS = 4;

const MENSAJE_PLATAFORMAS =
  'Usa enlaces de TikTok, YouTube, Instagram, Facebook, Vimeo o un archivo de video (.mp4 / .webm).';

const limpiarHost = (u: URL) => u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
const esDominio = (host: string, dominio: string) => host === dominio || host.endsWith(`.${dominio}`);
const recortar = (texto: string) => (texto.length > 80 ? `${texto.slice(0, 80)}…` : texto);

const esEnlaceCortoTikTok = (u: URL) => {
  const host = limpiarHost(u);
  return (
    host === 'vt.tiktok.com' ||
    host === 'vm.tiktok.com' ||
    (esDominio(host, 'tiktok.com') && u.pathname.startsWith('/t/'))
  );
};

async function resolverEnlaceCortoTikTok(inicial: URL): Promise<URL> {
  let actual = inicial;
  for (let salto = 0; salto < MAX_SALTOS && esEnlaceCortoTikTok(actual); salto++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const resp = await fetch(actual.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EdatiaBot/1.0; +https://edatia.com)' },
      });
      const destino = resp.headers.get('location');
      if (!destino) break;
      const siguiente = new URL(destino, actual);
      if (siguiente.protocol !== 'https:' || !esDominio(limpiarHost(siguiente), 'tiktok.com')) break;
      actual = siguiente;
    } catch {
      break;
    } finally {
      clearTimeout(timer);
    }
  }

  if (esEnlaceCortoTikTok(actual)) {
    throw new BadRequestException(
      'No pudimos abrir el enlace corto de TikTok. Intenta de nuevo o pega el enlace completo (tiktok.com/@usuario/video/...).',
    );
  }
  return actual;
}

function detectarVideo(u: URL): { plataforma: PlataformaVideo; url: string } | null {
  const host = limpiarHost(u);

  if (esDominio(host, 'tiktok.com')) {
    const m = u.pathname.match(/\/(?:video|v|embed\/v2|embed|player\/v1)\/(\d{8,25})/);
    return m ? { plataforma: 'tiktok', url: `https://www.tiktok.com${u.pathname}` } : null;
  }

  if (esDominio(host, 'youtube.com') || host === 'youtu.be' || esDominio(host, 'youtube-nocookie.com')) {
    const partes = u.pathname.split('/');
    let id = '';
    let esShort = false;
    if (host === 'youtu.be') id = partes[1] || '';
    else if (u.pathname.startsWith('/shorts/')) {
      id = partes[2] || '';
      esShort = true;
    } else if (/^\/(embed|live|v)\//.test(u.pathname)) id = partes[2] || '';
    else id = u.searchParams.get('v') || '';
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return {
      plataforma: 'youtube',
      url: esShort ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
    };
  }

  if (esDominio(host, 'instagram.com')) {
    const m = u.pathname.match(/^\/(?:[A-Za-z0-9._]+\/)?(reels?|p|tv)\/([A-Za-z0-9_-]{5,40})/);
    if (!m) return null;
    const tipo = m[1] === 'p' ? 'p' : m[1] === 'tv' ? 'tv' : 'reel';
    return { plataforma: 'instagram', url: `https://www.instagram.com/${tipo}/${m[2]}/` };
  }

  if (esDominio(host, 'facebook.com')) {
    const esVideo = /\/(videos|reel|watch)(\/|$)/.test(u.pathname) || u.searchParams.has('v');
    if (!esVideo) return null;
    const v = u.searchParams.get('v');
    return {
      plataforma: 'facebook',
      url: `https://www.facebook.com${u.pathname}${v ? `?v=${encodeURIComponent(v)}` : ''}`,
    };
  }

  if (esDominio(host, 'vimeo.com')) {
    const m = u.pathname.match(/\/(?:video\/)?(\d{6,12})(?:\/|$)/);
    return m ? { plataforma: 'vimeo', url: `https://vimeo.com/${m[1]}` } : null;
  }

  const esCloudinaryVideo = host === 'res.cloudinary.com' && u.pathname.includes('/video/upload/');
  if (esCloudinaryVideo || /\.(mp4|webm|m4v|mov)$/i.test(u.pathname)) {
    return { plataforma: 'archivo', url: u.toString() };
  }

  return null;
}

/** Valida, canoniza y deduplica la lista de videos. Lanza BadRequest con mensajes amigables para el usuario del ERP. */
export async function normalizarVideosWeb(entrada: unknown): Promise<VideoWeb[]> {
  if (entrada === null || entrada === undefined) return [];
  if (!Array.isArray(entrada)) {
    throw new BadRequestException('El campo "videos" debe ser una lista de enlaces.');
  }
  if (entrada.length > MAX_VIDEOS_WEB) {
    throw new BadRequestException(`Máximo ${MAX_VIDEOS_WEB} videos por producto.`);
  }

  const resultado: VideoWeb[] = [];
  const vistos = new Set<string>();

  for (const item of entrada) {
    const esObjeto = item !== null && typeof item === 'object';
    const urlCruda = typeof item === 'string' ? item : esObjeto ? (item as any).url : null;
    const tituloCrudo = esObjeto ? (item as any).titulo : undefined;

    if (typeof urlCruda !== 'string' || !urlCruda.trim()) {
      throw new BadRequestException('Hay un video sin enlace.');
    }
    const texto = urlCruda.trim();
    if (texto.length > MAX_LARGO_URL) {
      throw new BadRequestException('El enlace del video es demasiado largo.');
    }

    let url: URL;
    try {
      url = new URL(texto);
    } catch {
      throw new BadRequestException(`"${recortar(texto)}" no es un enlace válido. ${MENSAJE_PLATAFORMAS}`);
    }
    if (url.protocol === 'http:') url.protocol = 'https:';
    if (url.protocol !== 'https:') {
      throw new BadRequestException('El enlace del video debe empezar por https://');
    }

    if (esEnlaceCortoTikTok(url)) {
      url = await resolverEnlaceCortoTikTok(url);
    }

    const detectado = detectarVideo(url);
    if (!detectado) {
      throw new BadRequestException(`No reconocemos el video "${recortar(texto)}". ${MENSAJE_PLATAFORMAS}`);
    }
    if (vistos.has(detectado.url)) continue;
    vistos.add(detectado.url);

    const titulo =
      typeof tituloCrudo === 'string' ? tituloCrudo.replace(/[<>]/g, '').trim().slice(0, MAX_LARGO_TITULO) : '';

    resultado.push({ url: detectado.url, plataforma: detectado.plataforma, ...(titulo ? { titulo } : {}) });
  }

  return resultado;
}

