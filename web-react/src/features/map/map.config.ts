export const REGIONS = {
    CONTINENT: {
        url: "https://gist.githubusercontent.com/hrbrmstr/91ea5cc9474286c72838/raw/continents.json",
        color: "#ffffff", // Pure White: Unambiguous and clean at the global level
        zoom: { min: 1, max: 3.5 },
        unfocusOffset: 0.4,
    },
    COUNTRY: {
        // (Use the 50m dataset URL here for performance!)
        url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson",
        color: "#ffffff", // Bright Yellow: Maximum contrast against blue oceans and green land
        zoom: { min: 3.5, max: 5.5 },
        unfocusOffset: 0.6,
    },
    DIVISION: {
        url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson",
        color: "#ffffff", // Neon Pink: Slices perfectly through the green terrain of Bangladesh
        zoom: { min: 5.5, max: 6.5 },
        unfocusOffset: 0.8,
    },
    DISTRICT: {
        url: "https://raw.githubusercontent.com/mostakimjihad/bd_district_geojson/master/district.json",
        color: "#ffffff", // Electric Cyan: Matches your UI highlights, pops brilliantly at high zoom
        zoom: { min: 6.5, max: 22 },
        unfocusOffset: 1.0,
    },
} as const;

export const TILES = {
    ROADMAP: "https://mt1.google.com/vt/lyrs=m&apistyle=s.e%3Al%7Cp.v%3Aoff&scale=2&x={x}&y={y}&z={z}",
    SATELLITE: "https://mt1.google.com/vt/lyrs=s&scale=2&x={x}&y={y}&z={z}",
    LABELS_BORDERS: "https://mt1.google.com/vt/lyrs=h&scale=2&x={x}&y={y}&z={z}",
    LABELS_TEXT: "https://mt1.google.com/vt/lyrs=h&apistyle=s.e%3Ag%7Cp.v%3Aoff&scale=2&x={x}&y={y}&z={z}",
} as const;

export const THEME = {
    hoverFill: "#00e5ff",
    hoverOpacity: 0.15,
} as const;

export const INITIAL_VIEW = {
    center: [90.4, 23.7] as [number, number],
    zoom: 2.2,
    pitch: 0,
    bearing: 0,
} as const;
