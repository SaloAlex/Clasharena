// CACHE PARA EL MAPPING OFICIAL DE CAMPEONES DE DATA DRAGON
type ChampMaps = { version: string; idToKey: Record<number, string> };
let CHAMP_CACHE: ChampMaps | null = null;

// FUNCIÓN PARA OBTENER LA ÚLTIMA VERSIÓN DE DATA DRAGON
async function getLatestVersion(): Promise<string> {
  try {
    const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json', { cache: 'no-store' });
    const arr: string[] = await res.json();
    return arr[0]; // última versión
  } catch (error) {
    console.warn('[DataDragon] Error obteniendo última versión, usando fallback:', error);
    return '14.22.1';
  }
}

// FUNCIÓN PARA OBTENER Y CACHEAR EL MAPPING OFICIAL DE CAMPEONES
async function ensureChampMap(version?: string): Promise<ChampMaps> {
  if (CHAMP_CACHE && (!version || CHAMP_CACHE.version === version)) {
    return CHAMP_CACHE;
  }
  
  const ver = version ?? await getLatestVersion();
  const url = `https://ddragon.leagueoflegends.com/cdn/${ver}/data/en_US/champion.json`;
  
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    const idToKey: Record<number, string> = {};
    // data.data = { Aatrox: { key: "266", ... }, Ahri: { key:"103", ... }, ... }
    for (const [key, obj] of Object.entries<any>(data.data)) {
      idToKey[Number(obj.key)] = key;
    }
    
    CHAMP_CACHE = { version: ver, idToKey };
    return CHAMP_CACHE;
  } catch (error) {
    console.error('[DataDragon] Error obteniendo champion mapping:', error);
    // Fallback a versión conocida
    return { version: '14.22.1', idToKey: {} };
  }
}

// VERSIONES ESTABLES DE DATA DRAGON (probadas y funcionando)
const STABLE_VERSIONS = [
  '14.22.1',
  '14.21.1', 
  '14.20.1',
  '14.19.1',
  '14.18.1'
];

let validVersion: string | null = null;

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

// FUNCIÓN PRINCIPAL PARA OBTENER URL DE IMAGEN DE CAMPEÓN (USANDO MAPPING OFICIAL)
export async function getChampionImageUrl(championId: number): Promise<string> {
  try {
    const { version, idToKey } = await ensureChampMap();
    const champKey = idToKey[championId];

    // Si no lo encuentra (muy raro), devolver un fallback visible pero loguear
    if (!champKey) {
      console.warn(`[DataDragon] Unknown champion ID ${championId} → fallback Aatrox`);
      return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/Aatrox.png`;
    }

    const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champKey}.png`;
    return imageUrl;
    
  } catch (error) {
    console.error(`[DataDragon] Error in getChampionImageUrl for ID ${championId}:`, error);
    return `https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/Aatrox.png`;
  }
}

// FUNCIÓN PARA OBTENER MÚLTIPLES IMÁGENES DE CAMPEONES
export async function getBulkChampionImages(championIds: number[]): Promise<{ [championId: number]: string }> {
  const { version, idToKey } = await ensureChampMap();
  const results: { [championId: number]: string } = {};
  
  for (const championId of championIds) {
    const champKey = idToKey[championId];
    if (champKey) {
      results[championId] = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champKey}.png`;
    } else {
      // Fallback para campeones no encontrados
      results[championId] = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/Aatrox.png`;
    }
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

// FUNCIÓN PARA OBTENER TÍTULO DEL CAMPEÓN
export async function getChampionTitle(championId: number): Promise<string> {
  try {
    const { version, idToKey } = await ensureChampMap();
    const champKey = idToKey[championId];

    if (!champKey) {
      console.warn(`[DataDragon] Unknown champion ID ${championId} for title → fallback`);
      return 'The Dark Child'; // Título de Annie como fallback
    }

    // Obtener datos completos del campeón
    const championDataUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${champKey}.json`;
    const response = await fetch(championDataUrl, { cache: 'no-store' });
    
    if (!response.ok) {
      console.warn(`[DataDragon] Error obteniendo datos de campeón ${champKey}: ${response.status}`);
      return 'The Dark Child';
    }

    const data = await response.json();
    const championData = data.data[champKey];
    
    if (championData && championData.title) {
      return championData.title;
    } else {
      console.warn(`[DataDragon] No se encontró título para campeón ${champKey}`);
      return 'The Dark Child';
    }
    
  } catch (error) {
    console.error(`[DataDragon] Error obteniendo título para champion ID ${championId}:`, error);
    return 'The Dark Child';
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
