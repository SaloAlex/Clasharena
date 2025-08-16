export const REGIONS = [
  { value: 'americas', label: 'Americas', platforms: [
    { value: 'BR1', label: 'Brasil' },
    { value: 'LA1', label: 'LAN' },
    { value: 'LA2', label: 'LAS' },
    { value: 'NA1', label: 'Norteamérica' }
  ]},
  { value: 'europe', label: 'Europa', platforms: [
    { value: 'EUN1', label: 'Europa Nórdica y Este' },
    { value: 'EUW1', label: 'Europa Oeste' },
    { value: 'TR1', label: 'Turquía' },
    { value: 'RU', label: 'Rusia' }
  ]},
  { value: 'asia', label: 'Asia', platforms: [
    { value: 'JP1', label: 'Japón' },
    { value: 'KR', label: 'Corea' }
  ]},
  { value: 'sea', label: 'Sudeste Asiático', platforms: [
    { value: 'OC1', label: 'Oceanía' }
  ]}
] as const;

export type Platform = typeof REGIONS[number]['platforms'][number]['value'];
export type Region = typeof REGIONS[number]['value'];

// Mapeo de plataformas a regiones
export const PLATFORM_TO_REGION = Object.fromEntries(
  REGIONS.flatMap(region => 
    region.platforms.map(platform => [platform.value, region.value])
  )
) as { [key in Platform]: Region };
