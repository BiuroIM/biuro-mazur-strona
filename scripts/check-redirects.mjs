const SITE = 'https://biuro-mazur.pl';

const OLD_URLS = [
  ['/', '/'],
  ['/o-nas/', '/o-nas/'],
  ['/kontakt/', '/kontakt/'],
  ['/blog/', '/blog/'],
  ['/oferta/', '/uslugi/'],
  ['/sygnalisci/', '/sygnalisci/'],
  ['/wp-content/uploads/2024/12/Procedura-zgloszen-wewnetrznych-sygnalisci.pdf', '/documents/whistleblower-procedure.pdf'],
  ['/2025/03/18/podatek-a-przeznaczenie-nieruchomosci/', '/uslugi/'],
  ['/2025/12/22/sprawdz-godziny-pracy-biura-rachunkowego-w-debicy-w-okresie-swiateczno-noworocznym-2025-2026/', '/blog/'],
  ['/2025/12/22/swiateczne-zyczenia-biuro-rachunkowe-iwona-mazur/', '/blog/'],
  ['/2026/01/02/nowy-rok-2026-zyczenia-biuro-rachunkowe-debica/', '/blog/'],
  ['/2026/01/02/ksef-2-0-jak-przygotowac-firme-na-2026-rok/', '/blog/ksef-w-praktyce/'],
  ['/2026/03/04/samodzielna-ksiegowa-samodzielny-ksiegowy-debica-stacjonarnie-hybrydowo/', '/o-nas/'],
  ['/2026/03/04/praca-mlodsza-ksiegowa-debica/', '/o-nas/'],
  ['/2026/01/05/samodzielna-ksiegowa-samodzielny-ksiegowy-debica-stacjonarnie-hybrydowo/', '/o-nas/'],
  ['/2026/04/04/wielkanocny-bilans-nadziei-zyczenia-od-biura-rachunkowego-iwona-mazur-sp-k/', '/blog/'],
  ['/category/bez-kategorii/', '/blog/'],
  ['/author/rs/', '/blog/'],
  ['/elementor-hf/mazur_menu_h/', '/blog/'],
  ['/feed/', '/blog/'],
  ['/sitemap.xml', '/sitemap-index.xml'],
  ['/sitemap_index.xml', '/sitemap-index.xml'],
  ['/post-sitemap.xml', '/sitemap-index.xml'],
  ['/page-sitemap.xml', '/sitemap-index.xml'],
  ['/wp-content/uploads/2026/01/KSeF-Krajowy-System-e-Faktur-CO-SIEZMIENIA-I-JAK-SIE-PRZYGOTOWAC.pdf', '/blog/ksef-w-praktyce/'],
  ['/wp-content/uploads/2022/12/3.jpg', '/'],
  ['/wp-login.php', '/'],
  ['/?p=1', '/'],
];

const HOSTS = [
  'https://biuro-mazur.pl',
  'http://biuro-mazur.pl',
  'https://www.biuro-mazur.pl',
  'http://www.biuro-mazur.pl',
  'https://pulpit.biuro-mazur.pl',
];

const MAX_HOPS = 6;

const follow = async (url) => {
  const hops = [];
  let current = url;

  for (let i = 0; i < MAX_HOPS; i++) {
    const response = await fetch(current, { redirect: 'manual' });
    hops.push(response.status);
    const location = response.headers.get('location');
    if (response.status < 300 || response.status >= 400 || !location) {
      return { hops, final: current, status: response.status };
    }
    current = new URL(location, current).href;
  }

  return { hops, final: current, status: 'pętla' };
};

let failures = 0;

for (const [from, to] of OLD_URLS) {
  for (const host of HOSTS) {
    const url = host + from;
    const expected = SITE + to;
    let result;

    try {
      result = await follow(url);
    } catch (error) {
      failures++;
      console.log(`BŁĄD   ${url}: ${error.message}`);
      continue;
    }

    const redirects = result.hops.length - 1;
    const ok = result.status === 200 && result.final === expected && redirects <= 1;
    if (!ok) failures++;

    console.log(
      `${ok ? 'OK    ' : 'ŹLE   '}${redirects} przekier.  ${url}  →  ${result.final} (${result.status})`
    );
  }
}

const total = OLD_URLS.length * HOSTS.length;
console.log(`\n${total - failures}/${total} adresów w porządku`);
process.exit(failures ? 1 : 0);
