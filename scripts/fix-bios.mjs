// Ruční opravy popisů hráčů, kde Wikipedie vrátila rozcestník (spouští se po fetch-bios a audit-bios).
import fs from 'node:fs';
const bios = JSON.parse(fs.readFileSync('src/content/bios.json', 'utf8'));
bios.pele = 'Edson Arantes do Nascimento, známý jako Pelé, byl brazilský fotbalista a jeden z nejlepších hráčů všech dob. Jako jediný hráč vyhrál mistrovství světa třikrát: v letech 1958, 1962 a 1970. Většinu kariéry hrál za FC Santos a za reprezentaci Brazílie dal 77 gólů.';
bios.thmuller = 'Thomas Müller je německý fotbalista a mistr světa z roku 2014. Dlouhá léta hrál za Bayern Mnichov a stal se jedním z nejlepších útočných záložníků své doby. Na mistrovství světa 2010 byl nejlepším střelcem a nejlepším mladým hráčem turnaje.';
fs.writeFileSync('src/content/bios.json', JSON.stringify(bios, null, 1));
console.log('opraveno');
