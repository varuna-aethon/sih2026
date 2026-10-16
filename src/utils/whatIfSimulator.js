// What-If Landfall & Pinpoint Zone Simulator Engine for AERO-SENSE (SIH26078)
// Computes real geometric 5km pinpoint footprints, identifies nearest coastal districts,
// and synthesizes multi-language citizen alerts across any coordinate along the Indian coastline.

export const COASTAL_DISTRICTS = [
  // West Bengal
  { id: 'WB-PURBA-MED', name: 'Purba Medinipur (Digha/Contai)', state: 'West Bengal', stateLang: 'bn', coords: [87.75, 21.90], areaKm2: 4713, citizens: 5095875 },
  { id: 'WB-SOUTH-24', name: 'South 24 Parganas (Sagar Island / Sundarbans)', state: 'West Bengal', stateLang: 'bn', coords: [88.35, 21.80], areaKm2: 9960, citizens: 8161961 },

  // Odisha
  { id: 'OD-BALASORE', name: 'Balasore (Chandipur / Baleswar)', state: 'Odisha', stateLang: 'or', coords: [86.93, 21.49], areaKm2: 3806, citizens: 2317419 },
  { id: 'OD-BHADRAK', name: 'Bhadrak (Dhamra Port Sector)', state: 'Odisha', stateLang: 'or', coords: [86.51, 21.05], areaKm2: 2505, citizens: 1506522 },
  { id: 'OD-KENDRAPARA', name: 'Kendrapara (Bhitarkanika / Rajnagar)', state: 'Odisha', stateLang: 'or', coords: [86.42, 20.50], areaKm2: 2644, citizens: 1440218 },
  { id: 'OD-JAGATSINGH', name: 'Jagatsinghpur (Paradeep Port Corridor)', state: 'Odisha', stateLang: 'or', coords: [86.60, 20.30], areaKm2: 1668, citizens: 1136971 },
  { id: 'OD-PURI', name: 'Puri (Puri Coast / Chilika North)', state: 'Odisha', stateLang: 'or', coords: [85.83, 19.81], areaKm2: 3479, citizens: 1698730 },
  { id: 'OD-GANJAM', name: 'Ganjam (Gopalpur / Berhampur Coastal)', state: 'Odisha', stateLang: 'or', coords: [84.90, 19.38], areaKm2: 8206, citizens: 3529031 },

  // Andhra Pradesh
  { id: 'AP-SRIKAKULAM', name: 'Srikakulam Coastal Sector', state: 'Andhra Pradesh', stateLang: 'te', coords: [83.89, 18.29], areaKm2: 5837, citizens: 2703114 },
  { id: 'AP-VIZAG', name: 'Visakhapatnam (Gangavaram / Bheemunipatnam)', state: 'Andhra Pradesh', stateLang: 'te', coords: [83.22, 17.69], areaKm2: 1048, citizens: 2358412 },
  { id: 'AP-KAKINADA', name: 'Kakinada (Coringa / Godavari Delta)', state: 'Andhra Pradesh', stateLang: 'te', coords: [82.23, 16.98], areaKm2: 3019, citizens: 2092374 },
  { id: 'AP-BAPATLA', name: 'Bapatla / Krishna (Machilipatnam)', state: 'Andhra Pradesh', stateLang: 'te', coords: [81.13, 16.18], areaKm2: 3829, citizens: 1586918 },
  { id: 'AP-NELLORE', name: 'Nellore (Krishnapatnam / Sriharikota)', state: 'Andhra Pradesh', stateLang: 'te', coords: [80.05, 14.25], areaKm2: 13076, citizens: 2963557 },

  // Tamil Nadu
  { id: 'TN-CHENNAI', name: 'Chennai Metropolitan Coast (Ennore / Marina)', state: 'Tamil Nadu', stateLang: 'ta', coords: [80.27, 13.08], areaKm2: 426, citizens: 7088403 },
  { id: 'TN-CHENGALPATTU', name: 'Chengalpattu (Mahabalipuram Coastal)', state: 'Tamil Nadu', stateLang: 'ta', coords: [80.19, 12.62], areaKm2: 2945, citizens: 2556244 },
  { id: 'TN-CUDDALORE', name: 'Cuddalore (Silver Beach / Pichavaram)', state: 'Tamil Nadu', stateLang: 'ta', coords: [79.76, 11.75], areaKm2: 3703, citizens: 2605914 },
  { id: 'TN-NAGAPATTINAM', name: 'Nagapattinam (Velankanni / Vedaranyam)', state: 'Tamil Nadu', stateLang: 'ta', coords: [79.84, 10.76], areaKm2: 2715, citizens: 1616450 },
  { id: 'TN-RAMANATHAPURAM', name: 'Ramanathapuram (Pamban / Rameswaram)', state: 'Tamil Nadu', stateLang: 'ta', coords: [78.83, 9.36], areaKm2: 4104, citizens: 1353445 },
  { id: 'TN-KANYAKUMARI', name: 'Kanyakumari (Cape Comorin Convergence)', state: 'Tamil Nadu', stateLang: 'ta', coords: [77.55, 8.08], areaKm2: 1672, citizens: 1870374 },

  // Kerala
  { id: 'KL-TRIVANDRUM', name: 'Thiruvananthapuram (Vizhinjam / Kovalam)', state: 'Kerala', stateLang: 'ml', coords: [76.93, 8.52], areaKm2: 2192, citizens: 3301427 },
  { id: 'KL-ALAPPUZHA', name: 'Alappuzha (Kuttanad Coastal Plain)', state: 'Kerala', stateLang: 'ml', coords: [76.33, 9.49], areaKm2: 1414, citizens: 2127789 },
  { id: 'KL-KOCHI', name: 'Ernakulam (Kochi Port / Vypin)', state: 'Kerala', stateLang: 'ml', coords: [76.27, 9.93], areaKm2: 3068, citizens: 3282388 },
  { id: 'KL-KOZHIKODE', name: 'Kozhikode (Beypore / Malabar Coast)', state: 'Kerala', stateLang: 'ml', coords: [75.78, 11.25], areaKm2: 2344, citizens: 3086293 },

  // Karnataka & Goa
  { id: 'KA-MANGALORE', name: 'Dakshina Kannada (Mangaluru Coastal)', state: 'Karnataka', stateLang: 'kn', coords: [74.85, 12.91], areaKm2: 4560, citizens: 2089649 },
  { id: 'KA-KARWAR', name: 'Uttara Kannada (Karwar / Gokarna)', state: 'Karnataka', stateLang: 'kn', coords: [74.13, 14.81], areaKm2: 10291, citizens: 1437169 },
  { id: 'GA-GOA', name: 'Mormugao & South Goa Coastal Corridor', state: 'Goa', stateLang: 'mr', coords: [73.83, 15.40], areaKm2: 1966, citizens: 640537 },

  // Maharashtra
  { id: 'MH-RATNAGIRI', name: 'Ratnagiri (Jaigad / Mirya Bay)', state: 'Maharashtra', stateLang: 'mr', coords: [73.30, 16.99], areaKm2: 8208, citizens: 1615069 },
  { id: 'MH-RAIGAD', name: 'Raigad (Alibag / Murud Coastal)', state: 'Maharashtra', stateLang: 'mr', coords: [72.87, 18.65], areaKm2: 7152, citizens: 2634200 },
  { id: 'MH-MUMBAI', name: 'Greater Mumbai (Colaba / Bandra / Worli)', state: 'Maharashtra', stateLang: 'mr', coords: [72.85, 19.07], areaKm2: 603, citizens: 12442373 },
  { id: 'MH-PALGHAR', name: 'Palghar (Tarapur / Dahanu Sector)', state: 'Maharashtra', stateLang: 'mr', coords: [72.76, 19.69], areaKm2: 5344, citizens: 2990116 },

  // Gujarat
  { id: 'GJ-VALSAD', name: 'Valsad (Daman & Tithal Coast)', state: 'Gujarat', stateLang: 'gu', coords: [72.93, 20.61], areaKm2: 3035, citizens: 1705678 },
  { id: 'GJ-BHAVNAGAR', name: 'Bhavnagar (Gulf of Khambhat)', state: 'Gujarat', stateLang: 'gu', coords: [72.15, 21.76], areaKm2: 8334, citizens: 2880365 },
  { id: 'GJ-VERAVAL', name: 'Gir Somnath (Veraval / Somnath Coast)', state: 'Gujarat', stateLang: 'gu', coords: [70.36, 20.90], areaKm2: 3755, citizens: 1217477 },
  { id: 'GJ-PORBANDAR', name: 'Porbandar Coastal Plain', state: 'Gujarat', stateLang: 'gu', coords: [69.60, 21.64], areaKm2: 2298, citizens: 585449 },
  { id: 'GJ-DWARKA', name: 'Devbhumi Dwarka (Okha / Arabian Sea Gate)', state: 'Gujarat', stateLang: 'gu', coords: [68.96, 22.24], areaKm2: 4051, citizens: 752484 },
  { id: 'GJ-KACHCHH', name: 'Kachchh (Kandla Port / Mandvi)', state: 'Gujarat', stateLang: 'gu', coords: [69.36, 22.83], areaKm2: 45674, citizens: 2092371 }
];

export const STORM_CATEGORIES = [
  {
    code: 'CYCLONIC_STORM',
    name: 'Cyclonic Storm (CS)',
    categoryLevel: 'Category 1',
    windRange: '62 – 88 km/h',
    peakWind: 75,
    centralPressure: '990 hPa',
    stormSurge: '1.0 – 1.5 meters',
    severity: 'MODERATE',
    color: '#f59e0b'
  },
  {
    code: 'SEVERE_CYCLONIC',
    name: 'Severe Cyclonic Storm (SCS)',
    categoryLevel: 'Category 2',
    windRange: '89 – 117 km/h',
    peakWind: 105,
    centralPressure: '978 hPa',
    stormSurge: '1.5 – 2.0 meters',
    severity: 'SEVERE',
    color: '#ef4444'
  },
  {
    code: 'VERY_SEVERE',
    name: 'Very Severe Cyclonic Storm (VSCS)',
    categoryLevel: 'Category 3',
    windRange: '118 – 166 km/h',
    peakWind: 145,
    centralPressure: '958 hPa',
    stormSurge: '2.5 – 3.5 meters',
    severity: 'SEVERE',
    color: '#ef4444'
  },
  {
    code: 'EXTREMELY_SEVERE',
    name: 'Extremely Severe Cyclonic Storm (ESCS)',
    categoryLevel: 'Category 4',
    windRange: '167 – 221 km/h',
    peakWind: 185,
    centralPressure: '935 hPa',
    stormSurge: '3.5 – 5.5 meters',
    severity: 'CATASTROPHIC',
    color: '#dc2626'
  },
  {
    code: 'SUPER_CYCLONE',
    name: 'Super Cyclonic Storm (SuCS)',
    categoryLevel: 'Category 5',
    windRange: '≥ 222 km/h',
    peakWind: 240,
    centralPressure: '908 hPa',
    stormSurge: '6.0 – 9.0 meters',
    severity: 'CATASTROPHIC',
    color: '#dc2626'
  }
];

/// 5 Hazard Types Supported by What-If Simulator (SIH26078)
export const HAZARD_TYPES = [
  { id: 'cyclone', name: 'Cyclone / Tropical Storm', unit: 'km/h', icon: 'Wind' },
  { id: 'flood', name: 'Heavy Rainfall / Cloudburst', unit: 'mm/h', icon: 'CloudRain' },
  { id: 'landslide', name: 'Landslide / Debris Flow', unit: 'slope index', icon: 'Mountain' },
  { id: 'heatwave', name: 'Severe Heatwave', unit: '°C', icon: 'Sun' },
  { id: 'coldwave', name: 'Cold Wave & Frost', unit: '°C', icon: 'Snowflake' }
];

export const ALL_HAZARD_CATEGORIES = {
  cyclone: STORM_CATEGORIES,
  flood: [
    { code: 'FLOOD_MODERATE', name: 'Heavy Inundation (50-100mm/24h)', peakMetric: '75 mm/24h', severity: 'MODERATE', color: '#f59e0b', radiusKm: 6 },
    { code: 'FLOOD_SEVERE', name: 'Very Heavy Rainfall (115-204mm/24h)', peakMetric: '160 mm/24h', severity: 'SEVERE', color: '#ef4444', radiusKm: 8 },
    { code: 'DELUGE_EXTREME', name: 'Cloudburst Deluge (>204mm/24h or >100mm/h)', peakMetric: '125 mm/h', severity: 'CATASTROPHIC', color: '#dc2626', radiusKm: 12 }
  ],
  landslide: [
    { code: 'SLOPE_MODERATE', name: 'Moderate Slope Creep (Debris Risk)', peakMetric: '35° Slope', severity: 'MODERATE', color: '#f59e0b', radiusKm: 4 },
    { code: 'SLOPE_SEVERE', name: 'High-Relief Debris Avalanche', peakMetric: '48° Slope', severity: 'SEVERE', color: '#ef4444', radiusKm: 6 },
    { code: 'LANDSLIDE_CRITICAL', name: 'Glacial Moraine / GLOF Breach', peakMetric: 'Catastrophic Runout', severity: 'CATASTROPHIC', color: '#dc2626', radiusKm: 10 }
  ],
  heatwave: [
    { code: 'HEAT_MODERATE', name: 'Heatwave Alert (40-43°C)', peakMetric: '42.5°C', severity: 'MODERATE', color: '#f59e0b', radiusKm: 15 },
    { code: 'HEAT_SEVERE', name: 'Severe Heatwave (44-46°C)', peakMetric: '45.8°C', severity: 'SEVERE', color: '#ef4444', radiusKm: 20 },
    { code: 'HEAT_CATASTROPHIC', name: 'Catastrophic Thermal Dome (>47°C)', peakMetric: '48.5°C', severity: 'CATASTROPHIC', color: '#dc2626', radiusKm: 25 }
  ],
  coldwave: [
    { code: 'COLD_MODERATE', name: 'Cold Day (Departure -4.5°C)', peakMetric: '5.2°C Min', severity: 'MODERATE', color: '#60a5fa', radiusKm: 15 },
    { code: 'COLD_SEVERE', name: 'Severe Cold Wave (<4°C Min)', peakMetric: '1.5°C Min', severity: 'SEVERE', color: '#3b82f6', radiusKm: 20 },
    { code: 'COLD_FREEZING', name: 'Sub-Zero Freezing & Ground Frost', peakMetric: '-1.5°C Min', severity: 'CATASTROPHIC', color: '#1d4ed8', radiusKm: 25 }
  ]
};

/**
 * Find the closest Indian coastal district using Haversine formula
 */
export function findNearestCoastalDistrict(clickLon, clickLat) {
  let minD = Infinity;
  let nearest = COASTAL_DISTRICTS[0];

  COASTAL_DISTRICTS.forEach(d => {
    const R = 6371; // Earth radius in km
    const dLat = (d.coords[1] - clickLat) * (Math.PI / 180);
    const dLon = (d.coords[0] - clickLon) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(clickLat * (Math.PI / 180)) * Math.cos(d.coords[1] * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R * c;

    if (distKm < minD) {
      minD = distKm;
      nearest = { ...d, distKm: Math.round(distKm) };
    }
  });

  return nearest;
}

/**
 * Generate multi-language citizen alerts for any simulated hazard scenario
 */
export function generateWhatIfTranslations(target) {
  const { coords, nearestDistrict, stormCat, hazardType = 'cyclone' } = target;
  const lon = coords[0].toFixed(2);
  const lat = coords[1].toFixed(2);
  const distName = nearestDistrict.name.split(' (')[0];
  const state = nearestDistrict.state;
  const hazardName = stormCat.name;
  const metric = stormCat.peakWind ? `${stormCat.peakWind} km/h` : (stormCat.peakMetric || 'Extreme Threshold');

  return {
    eventName: `[SIMULATED] ${hazardName} Impact near ${distName}`,
    english: `AERO-SENSE SIMULATION ALERT: Projected impact of ${hazardName.toUpperCase()} near ${distName} (${lat}°N, ${lon}°E). Peak intensity: ${metric}. Evacuate designated danger perimeter to community shelters. District Control: 1077 / NDMA: 1078. [DRILL/EXERCISE ONLY]`,
    hindi: `एरो-सेंस अभ्यास सिमुलेशन: ${distName} क्षेत्र (${lat}°N, ${lon}°E) के पास ${hazardName} का प्रभाव संभावित। चरम तीव्रता: ${metric}। प्रभावित क्षेत्र के नागरिक तुरंत राहत आश्रयों में जाएं। हेल्पलाइन: 1077 / 1078। [केवल मॉक ड्रिल अभ्यास]`,
    bengali: `অ্যারো-সেন্স সিমুলেশন সতর্কতা: ${distName} অঞ্চলের (${lat}°N, ${lon}°E) কাছে ${hazardName} পূর্বাভাস। চরম তীব্রতা: ${metric}। বিপন্ন এলাকার বাসিন্দারা অবিলম্বে আশ্রয়কেন্দ্রে যান। হেল্পলাইন: ১০৭৭ / ১০৭৮। [মহড়া/মকড্রিল]`,
    odia: `ଏରୋ-ସେନ୍ସ ସିମୁଲେସନ ସତର୍କତା: ${distName} ଅଞ୍ଚଳ (${lat}°N, ${lon}°E) ନିକଟରେ ${hazardName} ଆଶଙ୍କା। ତୀବ୍ରତା: ${metric}। ସୁରକ୍ଷିତ ଆଶ୍ରୟସ୍ଥଳକୁ ଯାଆନ୍ତୁ। ହେଲ୍ପଲାଇନ: ୧୦୭୭ / ୧୦୭୮। [ଅଭ୍ୟାସ ସତର୍କତା]`,
    tamil: `ஏரோ-சென்ஸ் மாதிரி எச்சரிக்கை: ${distName} பகுதியில் (${lat}°N, ${lon}°E) ${hazardName} தாக்கும் அபாயம். தீவிரம்: ${metric}. மக்கள் பாதுகாப்பு மையங்களுக்கு செல்லவும். அவசர எண்: 1077 / 1078. [ஒத்திகை எச்சரிக்கை]`,
    telugu: `ఏరో-సెన్స్ అనుకరణ హెచ్చరిక: ${distName} వద్ద (${lat}°N, ${lon}°E) ${hazardName} ప్రభావం అవకాశం. తీవ్రత: ${metric}. ప్రజలు పునరావాస కేంద్రాలకు తరలివెళ్లండి. హెల్ప్‌లైన్: 1077 / 1078. [మాక్ డ్రిల్ హెచ్చరిక]`
  };
}
