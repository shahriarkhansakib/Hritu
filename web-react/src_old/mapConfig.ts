
export const CONTINENTS_URL =
    "https://gist.githubusercontent.com/hrbrmstr/91ea5cc9474286c72838/raw/continents.json";
export const COUNTRIES_URL =
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson";
export const STATES_URL =
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";
export const BD_URL =
    "https://raw.githubusercontent.com/mostakimjihad/bd_district_geojson/master/district.json";

export const TILES_DEFAULT_BASE =
    "https://mt1.google.com/vt/lyrs=m&apistyle=s.e%3Al%7Cp.v%3Aoff&scale=2&x={x}&y={y}&z={z}";
export const TILES_SATELLITE_BASE =
    "https://mt1.google.com/vt/lyrs=s&scale=2&x={x}&y={y}&z={z}";
export const TILES_LABELS_WITH_BORDERS =
    "https://mt1.google.com/vt/lyrs=h&scale=2&x={x}&y={y}&z={z}";
export const TILES_LABELS_PURE_TEXT =
    "https://mt1.google.com/vt/lyrs=h&apistyle=s.e%3Ag%7Cp.v%3Aoff&scale=2&x={x}&y={y}&z={z}";

export const THEME = {
    continentBorder: "#d8b4fe",
    countryBorder: "#fde047",
    divisionBorder: "#38bdf8",
    bdBorder: "#00e5ff",
    hoverFill: "#00e5ff",
    hoverOpacity: 0.15,
} as const;

export const INITIAL_VIEW = {
    center: [90.4, 23.7] as [number, number],
    zoom: 2.2,
    pitch: 0,
    bearing: 0,
};
