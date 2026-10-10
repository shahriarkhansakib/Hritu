import type { Feature, FeatureCollection, Geometry } from "geojson";

export type RegionType = "All" | "Continent" | "Country" | "Division" | "District";
export type SourceName = "continents-data" | "countries-data" | "bd-divisions-data" | "bd-districts-data";

export type RegionProperties = Record<string, unknown>;
export type RegionFeature = Feature<Geometry, RegionProperties> & {
    id?: string | number;
};
export type RegionCollection = FeatureCollection<Geometry, RegionProperties>;

export interface MapData {
    continents: RegionCollection;
    countries: RegionCollection;
    divisions: RegionCollection;
    districts: RegionCollection;
}

export interface MapUiState {
    hoverEnabled: boolean;
    autoRotate: boolean;
    labelsVisible: boolean;
    customLabelsVisible: boolean;
    baseMap: "roadmap" | "satellite";
    projection: "globe" | "mercator";
    borderMode: "auto" | "continents" | "countries" | "division" | "districts" | "off";
    selected: string;
    loading: boolean;
}

export interface SearchItem {
    id: string | number;
    source: SourceName;
    type: Exclude<RegionType, "All">;
    name: string;
    feature: RegionFeature;
}

export interface SelectedRegion {
    id: string | number;
    name: string;
    type: string;
    lat: number;
    lon: number;
    source: string;
    feature: any;
}
