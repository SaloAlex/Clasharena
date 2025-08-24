// MAPEO DE CAMPEONES CON NOMBRES ESPECIALES EN DATA DRAGON
const CHAMPION_KEY_MAPPING: { [championId: number]: string } = {
  // Wukong es el problema principal
  62: 'MonkeyKing',        // Wukong -> MonkeyKing
  
  // Otros casos especiales comunes
  32: 'Amumu',
  34: 'Anivia', 
  1: 'Annie',
  22: 'Ashe',
  136: 'AurelionSol',      // Aurelion Sol -> AurelionSol
  268: 'Azir',
  432: 'Bard',
  53: 'Blitzcrank',
  63: 'Brand',
  201: 'Braum',
  51: 'Caitlyn',
  164: 'Camille',
  69: 'Cassiopeia',
  31: 'Chogath',           // Cho'Gath -> Chogath
  42: 'Corki',
  122: 'Darius',
  131: 'Diana',
  36: 'DrMundo',           // Dr. Mundo -> DrMundo
  119: 'Draven',
  245: 'Ekko',
  60: 'Elise',
  28: 'Evelynn',
  81: 'Ezreal',
  9: 'Fiddlesticks',
  114: 'Fiora',
  105: 'Fizz',
  3: 'Galio',
  41: 'Gangplank',
  86: 'Garen',
  150: 'Gnar',
  79: 'Gragas',
  104: 'Graves',
  887: 'Gwen',
  120: 'Hecarim',
  74: 'Heimerdinger',
  420: 'Illaoi',
  39: 'Irelia',
  427: 'Ivern',
  40: 'Janna',
  59: 'JarvanIV',          // Jarvan IV -> JarvanIV
  24: 'Jax',
  126: 'Jayce',
  202: 'Jhin',
  222: 'Jinx',
  145: 'Kaisa',            // Kai'Sa -> Kaisa
  429: 'Kalista',
  43: 'Karma',
  30: 'Karthus',
  38: 'Kassadin',
  55: 'Katarina',
  10: 'Kayle',
  141: 'Kayn',
  85: 'Kennen',
  121: 'Khazix',           // Kha'Zix -> Khazix
  203: 'Kindred',
  240: 'Kled',
  96: 'KogMaw',            // Kog'Maw -> KogMaw
  897: 'KSante',           // K'Sante -> KSante
  7: 'Leblanc',            // LeBlanc -> Leblanc
  64: 'LeeSin',            // Lee Sin -> LeeSin
  89: 'Leona',
  876: 'Lillia',
  127: 'Lissandra',
  236: 'Lucian',
  117: 'Lulu',
  99: 'Lux',
  54: 'Malphite',
  90: 'Malzahar',
  57: 'Maokai',
  11: 'MasterYi',          // Master Yi -> MasterYi
  21: 'MissFortune',       // Miss Fortune -> MissFortune
  82: 'Mordekaiser',
  25: 'Morgana',
  267: 'Nami',
  75: 'Nasus',
  111: 'Nautilus',
  518: 'Neeko',
  76: 'Nidalee',
  895: 'Nilah',
  56: 'Nocturne',
  20: 'Nunu',             // Nunu & Willump -> Nunu
  2: 'Olaf',
  61: 'Orianna',
  516: 'Ornn',
  80: 'Pantheon',
  78: 'Poppy',
  555: 'Pyke',
  246: 'Qiyana',
  133: 'Quinn',
  497: 'Rakan',
  33: 'Rammus',
  421: 'RekSai',           // Rek'Sai -> RekSai
  526: 'Rell',
  888: 'Renata',          // Renata Glasc -> Renata
  58: 'Renekton',
  107: 'Rengar',
  92: 'Riven',
  68: 'Rumble',
  13: 'Ryze',
  113: 'Sejuani',
  235: 'Senna',
  147: 'Seraphine',
  875: 'Sett',
  35: 'Shaco',
  98: 'Shen',
  102: 'Shyvana',
  27: 'Singed',
  14: 'Sion',
  15: 'Sivir',
  72: 'Skarner',
  37: 'Sona',
  16: 'Soraka',
  50: 'Swain',
  517: 'Sylas',
  134: 'Syndra',
  223: 'TahmKench',        // Tahm Kench -> TahmKench
  163: 'Taliyah',
  91: 'Talon',
  44: 'Taric',
  17: 'Teemo',
  412: 'Thresh',
  18: 'Tristana',
  48: 'Trundle',
  23: 'Tryndamere',
  4: 'TwistedFate',        // Twisted Fate -> TwistedFate
  29: 'Twitch',
  77: 'Udyr',
  6: 'Urgot',
  110: 'Varus',
  67: 'Vayne',
  45: 'Veigar',
  161: 'Velkoz',           // Vel'Koz -> Velkoz
  254: 'Vi',
  711: 'Viego',
  112: 'Viktor',
  8: 'Vladimir',
  106: 'Volibear',
  19: 'Warwick',
  498: 'Xayah',
  101: 'Xerath',
  5: 'XinZhao',           // Xin Zhao -> XinZhao
  83: 'Yorick',
  350: 'Yuumi',
  154: 'Zac',
  238: 'Zed',
  221: 'Zeri',
  115: 'Ziggs',
  26: 'Zilean',
  142: 'Zoe',
  143: 'Zyra'
};

// VERSIONES ESTABLES DE DATA DRAGON (probadas y funcionando)
const STABLE_VERSIONS = [
  '14.22.1',
  '14.21.1', 
  '14.20.1',
  '14.19.1',
  '14.18.1'
];

let validVersion: string | null = null;

// FUNCIÓN PARA OBTENER EL NOMBRE CORRECTO DEL CAMPEÓN
function getChampionKey(championId: number): string {
  return CHAMPION_KEY_MAPPING[championId] || `Champion${championId}`;
}

// FUNCIÓN PARA OBTENER VERSIÓN VÁLIDA DE DATA DRAGON
async function getStableDataDragonVersion(): Promise<string> {
  if (validVersion) {
    return validVersion;
  }

  // Probar versiones estables una por una
  for (const version of STABLE_VERSIONS) {
    try {
      const testUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/Aatrox.png`;
      const response = await fetch(testUrl, { method: 'HEAD' });
      
      if (response.ok) {
        validVersion = version;
        return version;
      }
    } catch (error) {
      // Silenciar errores
    }
  }

  // Fallback final
  validVersion = '14.22.1';
  return validVersion;
}

// FUNCIÓN PRINCIPAL PARA OBTENER URL DE IMAGEN DE CAMPEÓN
export async function getChampionImageUrl(championId: number): Promise<string> {
  try {
    const championKey = getChampionKey(championId);
    const version = await getStableDataDragonVersion();
    const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championKey}.png`;
    
    // Verificar que la URL funciona
    const testResponse = await fetch(imageUrl, { method: 'HEAD' });
    
    if (testResponse.ok) {
      return imageUrl;
    } else {
      // Usar imagen por defecto
      return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/Aatrox.png`;
    }
    
  } catch (error) {
    const version = await getStableDataDragonVersion();
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/Aatrox.png`;
  }
}

// FUNCIÓN PARA OBTENER MÚLTIPLES IMÁGENES DE CAMPEONES
export async function getBulkChampionImages(championIds: number[]): Promise<{ [championId: number]: string }> {
  const version = await getStableDataDragonVersion();
  const results: { [championId: number]: string } = {};
  
  for (const championId of championIds) {
    const championKey = getChampionKey(championId);
    results[championId] = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championKey}.png`;
  }
  
  return results;
}

// FUNCIÓN PARA OBTENER IMAGEN DE CAMPEÓN POR NOMBRE (para compatibilidad)
export async function getChampionImageUrlByName(championName: string): Promise<string> {
  try {
    const version = await getStableDataDragonVersion();
    const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championName}.png`;
    
    // Verificar que la URL funciona
    const testResponse = await fetch(imageUrl, { method: 'HEAD' });
    
    if (testResponse.ok) {
      return imageUrl;
    } else {
      return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/Aatrox.png`;
    }
    
  } catch (error) {
    const version = await getStableDataDragonVersion();
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/Aatrox.png`;
  }
}

// FUNCIÓN PARA OBTENER IMAGEN DE SPELL
export async function getSpellImageUrl(spellKey: string): Promise<string> {
  try {
    const version = await getStableDataDragonVersion();
    const spellUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spellKey}.png`;
    
    // Verificar si la imagen existe
    const testResponse = await fetch(spellUrl, { method: 'HEAD' });
    
    if (testResponse.ok) {
      return spellUrl;
    }
    
    // Si falla, intentar con versión de fallback
    for (const fallbackVersion of STABLE_VERSIONS) {
      const fallbackUrl = `https://ddragon.leagueoflegends.com/cdn/${fallbackVersion}/img/spell/${spellKey}.png`;
      const fallbackResponse = await fetch(fallbackUrl, { method: 'HEAD' });
      
      if (fallbackResponse.ok) {
        return fallbackUrl;
      }
    }
    
    // Si no se encuentra en ninguna versión, usar imagen por defecto
    return `https://ddragon.leagueoflegends.com/cdn/14.22.1/img/spell/SummonerFlash.png`;
    
  } catch (error) {
    return `https://ddragon.leagueoflegends.com/cdn/14.22.1/img/spell/SummonerFlash.png`;
  }
}

// FUNCIÓN PARA OBTENER IMAGEN DE ITEM
export async function getItemImageUrl(itemId: number): Promise<string> {
  try {
    const version = await getStableDataDragonVersion();
    const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`;
    
    // Verificar que la imagen existe antes de devolverla
    const testResponse = await fetch(imageUrl, { method: 'HEAD' });
    
    if (testResponse.ok) {
      return imageUrl;
    }
    
    // Si falla, intentar con versión de fallback
    for (const fallbackVersion of STABLE_VERSIONS) {
      const fallbackUrl = `https://ddragon.leagueoflegends.com/cdn/${fallbackVersion}/img/item/${itemId}.png`;
      const fallbackResponse = await fetch(fallbackUrl, { method: 'HEAD' });
      
      if (fallbackResponse.ok) {
        return fallbackUrl;
      }
    }
    
    // Si no se encuentra en ninguna versión, usar imagen por defecto
    return `https://ddragon.leagueoflegends.com/cdn/14.22.1/img/item/1001.png`; // Item por defecto
    
  } catch (error) {
    console.warn(`[getItemImageUrl] Error obteniendo imagen para item ${itemId}:`, error);
    return `https://ddragon.leagueoflegends.com/cdn/14.22.1/img/item/1001.png`; // Item por defecto
  }
}

// FUNCIÓN PARA OBTENER IMAGEN DE RUNE
export async function getRuneImageUrl(runeId: number): Promise<string> {
  const version = await getStableDataDragonVersion();
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/perk/${runeId}.png`;
}

// FUNCIÓN PARA OBTENER IMAGEN DE PROFILE ICON
export async function getProfileIconImageUrl(iconId: number): Promise<string> {
  const version = await getStableDataDragonVersion();
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
}

// FUNCIÓN PARA VERIFICAR Y ARREGLAR URLs DE IMAGEN
export async function getValidImageUrl(originalUrl: string, type: 'champion' | 'spell' | 'item' | 'rune' | 'profileicon', identifier: string | number): Promise<string> {
  try {
    // Verificar si la URL original funciona
    const testResponse = await fetch(originalUrl, { method: 'HEAD' });
    
    if (testResponse.ok) {
      return originalUrl;
    }

    // URL original falló, generando alternativa...
    const version = await getStableDataDragonVersion();

    // Generar URL con versión válida
    switch (type) {
      case 'champion':
        if (typeof identifier === 'number') {
          return await getChampionImageUrl(identifier);
        } else {
          return await getChampionImageUrlByName(identifier);
        }
      case 'spell':
        return await getSpellImageUrl(identifier as string);
      case 'item':
        return await getItemImageUrl(identifier as number);
      case 'rune':
        return await getRuneImageUrl(identifier as number);
      case 'profileicon':
        return await getProfileIconImageUrl(identifier as number);
      default:
        throw new Error(`Tipo de imagen no soportado: ${type}`);
    }
  } catch (error) {
    // Fallback a imagen por defecto
    const version = await getStableDataDragonVersion();
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/Aatrox.png`;
  }
}

// UTILIDAD PARA ACTUALIZAR TU CÓDIGO EXISTENTE
export function fixWukongImage(existingUrl: string): string {
  // Si detecta Wukong en la URL, corregirla
  if (existingUrl.includes('Wukong.png')) {
    return existingUrl.replace('Wukong.png', 'MonkeyKing.png');
  }
  
  // Si detecta una versión problemática, usar una estable
  const problematicVersions = ['15.16.1', '15.15.1', '15.14.1'];
  for (const badVersion of problematicVersions) {
    if (existingUrl.includes(badVersion)) {
      return existingUrl.replace(badVersion, '14.22.1');
    }
  }
  
  return existingUrl;
}

// EXPORTAR FUNCIONES DE CONVENIENCIA PARA COMPATIBILIDAD
export { getStableDataDragonVersion as getValidDataDragonVersion };
