// Stáhne fotky fotbalistů z Wikimedia Commons (volné licence) + autora a licenci pro rub karty.
// Výstup: assets/img/cards/<id>.jpg a src/content/cards.json. Hráči bez volné fotky dostanou kartu s ilustrací.
import fs from 'node:fs';
import { MORE } from './more-cards.mjs';
const UA = 'FotbalTreninkovaPodlozka/1.0 (private family app; football cards)';
// id, jméno, wiki titulek, země, post, hodnocení
const P = [
  ['messi', 'Lionel Messi', 'Lionel_Messi', 'ARG', 'ÚT', 96], ['ronaldo', 'Cristiano Ronaldo', 'Cristiano_Ronaldo', 'POR', 'ÚT', 95],
  ['mbappe', 'Kylian Mbappé', 'Kylian_Mbappé', 'FRA', 'ÚT', 94], ['haaland', 'Erling Haaland', 'Erling_Haaland', 'NOR', 'ÚT', 94],
  ['neymar', 'Neymar', 'Neymar', 'BRA', 'ÚT', 90], ['lewandowski', 'Robert Lewandowski', 'Robert_Lewandowski', 'POL', 'ÚT', 90],
  ['modric', 'Luka Modrić', 'Luka_Modrić', 'CRO', 'ZÁL', 89], ['debruyne', 'Kevin De Bruyne', 'Kevin_De_Bruyne', 'BEL', 'ZÁL', 91],
  ['salah', 'Mohamed Salah', 'Mohamed_Salah', 'EGY', 'ÚT', 91], ['vinicius', 'Vinícius Júnior', 'Vinícius_Júnior', 'BRA', 'ÚT', 92],
  ['bellingham', 'Jude Bellingham', 'Jude_Bellingham', 'ENG', 'ZÁL', 92], ['kane', 'Harry Kane', 'Harry_Kane', 'ENG', 'ÚT', 92],
  ['yamal', 'Lamine Yamal', 'Lamine_Yamal', 'ESP', 'ÚT', 91], ['pedri', 'Pedri', 'Pedri', 'ESP', 'ZÁL', 89],
  ['benzema', 'Karim Benzema', 'Karim_Benzema', 'FRA', 'ÚT', 89],
  ['ibra', 'Zlatan Ibrahimović', 'Zlatan_Ibrahimović', 'SWE', 'ÚT', 90], ['ronaldinho', 'Ronaldinho', 'Ronaldinho', 'BRA', 'ZÁL', 93],
  ['maradona', 'Diego Maradona', 'Diego_Maradona', 'ARG', 'ZÁL', 97], ['pele', 'Pelé', 'Pelé', 'BRA', 'ÚT', 98],
  ['zidane', 'Zinedine Zidane', 'Zinedine_Zidane', 'FRA', 'ZÁL', 96], ['cruyff', 'Johan Cruyff', 'Johan_Cruyff', 'NED', 'ÚT', 95],
  ['beckenbauer', 'Franz Beckenbauer', 'Franz_Beckenbauer', 'GER', 'OBR', 94], ['cech', 'Petr Čech', 'Petr_Čech', 'CZE', 'BRA', 90],
  ['nedved', 'Pavel Nedvěd', 'Pavel_Nedvěd', 'CZE', 'ZÁL', 91], ['rosicky', 'Tomáš Rosický', 'Tomáš_Rosický', 'CZE', 'ZÁL', 84],
  ['schick', 'Patrik Schick', 'Patrik_Schick', 'CZE', 'ÚT', 85], ['soucek', 'Tomáš Souček', 'Tomáš_Souček', 'CZE', 'ZÁL', 83],
  ['coufal', 'Vladimír Coufal', 'Vladimír_Coufal', 'CZE', 'OBR', 80], ['hlozek', 'Adam Hložek', 'Adam_Hložek', 'CZE', 'ÚT', 78],
  ['panenka', 'Antonín Panenka', 'Antonín_Panenka', 'CZE', 'ZÁL', 85], ['koller', 'Jan Koller', 'Jan_Koller', 'CZE', 'ÚT', 82],
  ['baros', 'Milan Baroš', 'Milan_Baroš', 'CZE', 'ÚT', 80], ['poborsky', 'Karel Poborský', 'Karel_Poborský', 'CZE', 'ZÁL', 79],
  ['kroos', 'Toni Kroos', 'Toni_Kroos', 'GER', 'ZÁL', 89], ['musiala', 'Jamal Musiala', 'Jamal_Musiala', 'GER', 'ZÁL', 89],
  ['rodri', 'Rodri', 'Rodri_(footballer,_born_1996)', 'ESP', 'ZÁL', 91], ['saka', 'Bukayo Saka', 'Bukayo_Saka', 'ENG', 'ÚT', 88],
  ['foden', 'Phil Foden', 'Phil_Foden', 'ENG', 'ZÁL', 89], ['vandijk', 'Virgil van Dijk', 'Virgil_van_Dijk', 'NED', 'OBR', 89],
  ['courtois', 'Thibaut Courtois', 'Thibaut_Courtois', 'BEL', 'BRA', 90], ['neuer', 'Manuel Neuer', 'Manuel_Neuer', 'GER', 'BRA', 90],
  ['buffon', 'Gianluigi Buffon', 'Gianluigi_Buffon', 'ITA', 'BRA', 91], ['ramos', 'Sergio Ramos', 'Sergio_Ramos', 'ESP', 'OBR', 88],
  ['iniesta', 'Andrés Iniesta', 'Andrés_Iniesta', 'ESP', 'ZÁL', 92], ['xavi', 'Xavi', 'Xavi', 'ESP', 'ZÁL', 91],
  ['henry', 'Thierry Henry', 'Thierry_Henry', 'FRA', 'ÚT', 93], ['ronaldo9', 'Ronaldo Nazário', 'Ronaldo_(Brazilian_footballer)', 'BRA', 'ÚT', 96],
  ['kaka', 'Kaká', 'Kaká', 'BRA', 'ZÁL', 90], ['griezmann', 'Antoine Griezmann', 'Antoine_Griezmann', 'FRA', 'ÚT', 88],
  ['alisson', 'Alisson Becker', 'Alisson_Becker', 'BRA', 'BRA', 89], ['dybala', 'Paulo Dybala', 'Paulo_Dybala', 'ARG', 'ÚT', 86],
];
const NEW = [
  ['beckham', 'David Beckham', 'David_Beckham', 'ENG', 'ZÁL', 90], ['rooney', 'Wayne Rooney', 'Wayne_Rooney', 'ENG', 'ÚT', 88], ['gerrard', 'Steven Gerrard', 'Steven_Gerrard', 'ENG', 'ZÁL', 89],
  ['lampard', 'Frank Lampard', 'Frank_Lampard', 'ENG', 'ZÁL', 88], ['totti', 'Francesco Totti', 'Francesco_Totti', 'ITA', 'ÚT', 90], ['pirlo', 'Andrea Pirlo', 'Andrea_Pirlo', 'ITA', 'ZÁL', 91],
  ['maldini', 'Paolo Maldini', 'Paolo_Maldini', 'ITA', 'OBR', 92], ['baggio', 'Roberto Baggio', 'Roberto_Baggio', 'ITA', 'ÚT', 92], ['platini', 'Michel Platini', 'Michel_Platini', 'FRA', 'ZÁL', 93],
  ['vanbasten', 'Marco van Basten', 'Marco_van_Basten', 'NED', 'ÚT', 94], ['gullit', 'Ruud Gullit', 'Ruud_Gullit', 'NED', 'ZÁL', 90], ['eusebio', 'Eusébio', 'Eusébio', 'POR', 'ÚT', 93],
  ['puskas', 'Ferenc Puskás', 'Ferenc_Puskás', 'HUN', 'ÚT', 94], ['yashin', 'Lev Jašin', 'Lev_Yashin', 'RUS', 'BRA', 93], ['distefano', 'Alfredo Di Stéfano', 'Alfredo_Di_Stéfano', 'ARG', 'ÚT', 93],
  ['robertocarlos', 'Roberto Carlos', 'Roberto_Carlos', 'BRA', 'OBR', 89], ['rivaldo', 'Rivaldo', 'Rivaldo', 'BRA', 'ÚT', 90], ['drogba', 'Didier Drogba', 'Didier_Drogba', 'CIV', 'ÚT', 89],
  ['etoo', "Samuel Eto'o", "Samuel_Eto'o", 'CMR', 'ÚT', 89], ['casillas', 'Iker Casillas', 'Iker_Casillas', 'ESP', 'BRA', 91], ['figo', 'Luís Figo', 'Luís_Figo', 'POR', 'ZÁL', 90],
  ['raul', 'Raúl', 'Raúl_(footballer)', 'ESP', 'ÚT', 89], ['suarez', 'Luis Suárez', 'Luis_Suárez', 'URU', 'ÚT', 90], ['aguero', 'Sergio Agüero', 'Sergio_Agüero', 'ARG', 'ÚT', 89],
  ['hazard', 'Eden Hazard', 'Eden_Hazard', 'BEL', 'ÚT', 89], ['cantona', 'Eric Cantona', 'Eric_Cantona', 'FRA', 'ÚT', 88], ['romario', 'Romário', 'Romário', 'BRA', 'ÚT', 92],
  ['cafu', 'Cafu', 'Cafu', 'BRA', 'OBR', 90], ['bale', 'Gareth Bale', 'Gareth_Bale', 'WAL', 'ÚT', 89], ['gerdmuller', 'Gerd Müller', 'Gerd_Müller', 'GER', 'ÚT', 93],
  ['matthaus', 'Lothar Matthäus', 'Lothar_Matthäus', 'GER', 'ZÁL', 92], ['mane', 'Sadio Mané', 'Sadio_Mané', 'SEN', 'ÚT', 88], ['daniAlves', 'Dani Alves', 'Dani_Alves', 'BRA', 'OBR', 89],
  ['thmuller', 'Thomas Müller', 'Thomas_Müller', 'GER', 'ÚT', 88], ['ancelotti0', 'Kaká', 'Kaká', 'BRA', 'ZÁL', 90],
];
P.push(...NEW.filter((n) => n[0] !== 'ancelotti0'));
const moreIds = new Set(MORE.map((m) => m[0]));
P.push(...MORE);
const get = async (url) => { for (let i = 0; i < 5; i++) { const r = await fetch(url, { headers: { 'User-Agent': UA } }); if (r.status === 429) { await new Promise((s) => setTimeout(s, 4000 * (i + 1))); continue; } return r; } throw new Error('429 ' + url); };
const strip = (s = '') => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
fs.mkdirSync('assets/img/cards', { recursive: true });
const prev = fs.existsSync('src/content/cards.json') ? JSON.parse(fs.readFileSync('src/content/cards.json', 'utf8')) : [];
const out = [];
for (const [id, name, wiki, country, pos, rating] of P) {
  const card = { id, name, country, pos, rating, photo: null };
  const old = prev.find((c) => c.id === id);
  if (old && old.photo && fs.existsSync(`assets/img/cards/${old.photo}`)) { out.push({ ...old, name, country, pos, rating }); console.log(id, 'beze změny'); continue; }
  try {
    const q = await (await get(`https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(wiki)}&prop=pageimages&piprop=name&redirects=1`)).json();
    const page = Object.values(q.query.pages)[0];
    const file = page.pageimage;
    if (file) {
      const c = await (await get(`https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent('File:' + file)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=520`)).json();
      const info = Object.values(c.query.pages)[0].imageinfo?.[0];
      const lic = info?.extmetadata?.LicenseShortName?.value || '';
      if (info && info.thumburl && /CC|Public|PD|Attribution/i.test(lic)) {
        const img = await get(info.thumburl);
        if (img.ok) {
          fs.writeFileSync(`assets/img/cards/${id}.jpg`, Buffer.from(await img.arrayBuffer()));
          card.photo = `${id}.jpg`; card.author = strip(info.extmetadata?.Artist?.value) || 'neuvedeno'; card.license = lic; card.source = info.descriptionurl;
        }
      }
    }
  } catch (e) { console.log('chyba', id, e.message); }
  console.log(id, card.photo ? 'foto ' + card.license : 'bez fotky');
  out.push(card);
  await new Promise((s) => setTimeout(s, 700));
}
const final = out.filter((c) => c.photo || !moreIds.has(c.id));
fs.writeFileSync('src/content/cards.json', JSON.stringify(final, null, 1));
console.log('hotovo', out.filter((c) => c.photo).length, '/', out.length);
