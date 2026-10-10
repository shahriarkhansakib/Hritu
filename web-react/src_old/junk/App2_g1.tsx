import React, { useState, useRef, useEffect } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import type { Point, Feature, FeatureCollection, Geometry } from "geojson";

// -----------------------------------------
// TYPES
// -----------------------------------------

export type RegionType =
    | "All" | "Continent" | "Country" | "Division" | "District";

export type SourceName =
    | "continents-data"
    | "countries-data"
    | "bd-divisions-data"
    | "bd-districts-data";

export type RegionProperties = Record<string, unknown>;

export type RegionFeature = Feature<Geometry, RegionProperties> & {
    id?: string | number;
};

export type RegionCollection = FeatureCollection<Geometry, RegionProperties>;

export type RegionIndex = {
    id: string | number,
    source: SourceName,
    type: Exclude<RegionType, 'All'>,
    name: string,
    feature: RegionFeature,
};

type MapProjection = 'mercator' | 'globe';
type MapType = 'satellite' | 'roadmap';

type BorderMode =
    | 'auto' | 'continents' | 'countries' | 'divisions' | 'districts' | 'off';

// -----------------------------------------
// Search Helpers
// -----------------------------------------

const is_fuzzy_match = (text: string, query: string): boolean => {
    const lower_text = text.toLowerCase();
    const lower_query = query.toLowerCase().trim();

    if (!lower_query) return true;

    let query_index = 0;
    for (const character of lower_text) {
        if (character === lower_query[query_index]) ++query_index;
        if (query_index === lower_query.length) return true;
    }
    return false;
}

const get_match_score = (text: string, query: string): number => {
    const lower_text = text.toLowerCase();
    const lower_query = query.toLowerCase();

    if (!lower_query) return 1;
    if (lower_text === lower_query) return 100;
    if (lower_text.startsWith(lower_query)) return 80;
    if (lower_text.includes(lower_query)) return 40;
    if (is_fuzzy_match(lower_text, lower_query)) return 20;
    return 0;
}

function HightlightMatch({ text, query }: { text: string; query: string; }) {
    if (!query) {
        return <>{text}</>;
    }

    const lower_text = text.toLowerCase();
    const lower_query = query.toLowerCase();
    const substring_index = lower_text.indexOf(lower_query);

    if (substring_index !== -1) {
        return (
            <>
                {text.substring(0, substring_index)}
                <span style={{ color: '#4ade80', fontWeight: 600 }}>
                    {text.substring(substring_index, substring_index + query.length)}
                </span>
                {text.substring(substring_index + query.length)}
            </>
        );
    }

    const result: React.ReactNode[] = [];
    let query_index = 0;
    for (let i = 0; i < text.length; ++i) {
        const character = text[i];
        if (
            query_index < lower_query.length &&
            character.toLowerCase() === lower_query[query_index]
        ) {
            result.push(
                <span key={i} style={{ color: '#4ade80', fontWeight: 600 }}>
                    {character}
                </span>
            );
            ++query_index;
        } else {
            result.push(character);
        }
    }
    return <>{result}</>;
}

// -----------------------------------------
// Search Bar
// -----------------------------------------

function SearchBar({
    regions,
    value,
    onChange,
    onSelect,
    onEscape,
    placeholder
}: {
    regions: RegionIndex[];
    value: string;
    onChange: (value: string) => void;
    onSelect: (region: RegionIndex) => void;
    onEscape: () => void;
    placeholder?: string;
}) {
    const container_ref = useRef<HTMLDivElement>(null);
    const list_ref = useRef<HTMLDivElement>(null);
    const region_selection_types: RegionType[] = ["All", "Continent", "Country", "Division", "District"];

    const [selected_region_type, set_selected_region_type] = useState<RegionType>('All');
    const [show_dropdown, set_show_dropdown] = useState(false);
    const [active_region_index, set_active_region_index] = useState(-1);

    const filtered_regions = React.useMemo(() => {
        const query = value.trim();
        const scored_results = regions
            .filter((region) => {
                if (selected_region_type !== 'All' && region.type !== selected_region_type) return false;
                return true;
            })
            .map((region) => ({
                region,
                score: get_match_score(region.name, query),
            }))
            .filter((result) => result.score > 0)
            .sort((a, b) => b.score - a.score || a.region.name.localeCompare(b.region.name));
        return scored_results.map((result) => result.region);
    }, [regions, value, selected_region_type]);

    useEffect(() => {
        set_active_region_index(filtered_regions.length > 0 ? 0 : -1);
    }, [filtered_regions]);

    useEffect(() => {
        const handle_click_outside = (event: MouseEvent) => {
            if (container_ref.current && !container_ref.current.contains(event.target as Node)) {
                set_show_dropdown(false);
            }
        };
        document.addEventListener('mousedown', handle_click_outside);
        return () => document.removeEventListener('mousedown', handle_click_outside);
    }, []);

    useEffect(() => {
        if (active_region_index >= 0 && list_ref.current) {
            const active_element = list_ref.current.children[active_region_index] as HTMLElement | undefined;
            active_element?.scrollIntoView({ block: 'nearest' });
        }
    }, [active_region_index]);

    const perform_selection = (region: RegionIndex) => {
        onChange(region.name);
        set_show_dropdown(false);
        onSelect(region);
    };

    const handle_key_down = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            if (show_dropdown) {
                set_show_dropdown(false);
                (event.target as HTMLInputElement).blur();
                return;
            }
            onEscape();
            return;
        }

        if (!show_dropdown) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                set_show_dropdown(true);
            }
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            set_active_region_index(prev => Math.min(prev + 1, filtered_regions.length - 1));
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            set_active_region_index(prev => Math.max(prev - 1, 0));
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            if (active_region_index >= 0 && active_region_index < filtered_regions.length) {
                perform_selection(filtered_regions[active_region_index]);
            }
        }
    };

    return (
        <div ref={container_ref} className="search-container">
            <input
                id="searchInput"
                type="text"
                className="search-input"
                value={value}
                onChange={(event) => {
                    onChange(event.target.value);
                    set_show_dropdown(true);
                }}
                onFocus={() => set_show_dropdown(true)}
                onKeyDown={handle_key_down}
                placeholder={placeholder ?? 'Search'}
                autoComplete="off"
            />
            <div className={`search-dropdown ${show_dropdown ? "show" : ""}`}>
                <div className="search-tags">
                    {region_selection_types.map((region_type) =>
                        <div
                            key={region_type}
                            className={`search-tag ${selected_region_type === region_type ? "active" : ""}`}
                            onMouseDown={(event) => {
                                event.preventDefault();
                                set_selected_region_type(region_type);
                                set_show_dropdown(true);
                            }}
                        >{region_type}</div>
                    )}
                </div>
                <div ref={list_ref} className="search-list">
                    {filtered_regions.length === 0 ? (
                        <div className="search-item" style={{ color: '#666', cursor: 'default' }}>
                            No regions found
                        </div>
                    ) : (
                        filtered_regions.map((region, index) =>
                            <div
                                key={`${region.source}-${region.id}`}
                                className={`search-item ${active_region_index === index ? "active" : ""}`}
                                onMouseEnter={() => set_active_region_index(index)}
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                    perform_selection(region);
                                }}
                            >
                                <span><HightlightMatch text={region.name} query={value} /></span>
                                <span style={{ fontSize: '11px', color: '#888' }}>{region.type}</span>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

// -----------------------------------------
// URLs & Fetch Logic (Hoisted)
// -----------------------------------------

const URL_CONTINENTS = "https://gist.githubusercontent.com/hrbrmstr/91ea5cc9474286c72838/raw/continents.json";
const URL_COUNTRIES = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson";
const URL_STATES = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";
const URL_BD_DISTRICTS = "https://raw.githubusercontent.com/mostakimjihad/bd_district_geojson/master/district.json";

let geo_data_promise: Promise<[RegionCollection, RegionCollection, RegionCollection, RegionCollection]> | null = null;

const fetch_geo_data = () => {
    if (!geo_data_promise) {
        geo_data_promise = Promise.all([
            fetch(URL_CONTINENTS).then(res => res.json()),
            fetch(URL_COUNTRIES).then(res => res.json()),
            fetch(URL_STATES).then(res => res.json()),
            fetch(URL_BD_DISTRICTS).then(res => res.json()),
        ]);
    }
    return geo_data_promise;
}

// -----------------------------------------
// Google Tile URLs & Theme
// -----------------------------------------

const TILES_ROADMAP_BASE = 'https://mt1.google.com/vt/lyrs=m&apistyle=s.e%3Al%7Cp.v%3Aoff&scale=2&x={x}&y={y}&z={z}';
const TILES_SATELLITE_BASE = 'https://mt1.google.com/vt/lyrs=s&scale=2&x={x}&y={y}&z={z}';
const TILES_LABELS_WITH_BORDERS = 'https://mt1.google.com/vt/lyrs=h&scale=2&x={x}&y={y}&z={z}';
const TILES_LABELS_PURE_TEXT = 'https://mt1.google.com/vt/lyrs=h&apistyle=s.e%3Ag%7Cp.v%3Aoff&scale=2&x={x}&y={y}&z={z}';

const MAP_THEME = {
    continentBorder: '#d8b4fe',
    countryBorder: '#fde047',
    divisionBorder: '#38bdf8',
    bdBorder: '#00e5ff',
    hoverFill: '#00e5ff',
    hoverOpacity: 0.25
};

const INTERACTIVE_LAYERS = [
    'bd-districts-fill', 'bd-divisions-fill', 'countries-fill', 'continents-fill',
    'bd-districts-labels', 'bd-divisions-labels', 'countries-labels', 'continents-labels'
];

// -----------------------------------------
// App
// -----------------------------------------

export default function App2() {
    const map_container_ref = useRef<HTMLDivElement>(null);
    const map_instance_ref = useRef<maplibregl.Map | null>(null);

    // UI State
    const [left_sidebar_open, set_left_sidebar_open] = useState(true);
    const [right_sidebar_open, set_right_sidebar_open] = useState(false);
    const [selection_text, set_selection_text] = useState('None');
    const [search_term, set_search_term] = useState('');

    // Map Controls
    const [is_map_ready, set_is_map_ready] = useState(false);
    const [hover_enabled, set_hover_enabled] = useState(true);
    const [auto_rotate, set_auto_rotate] = useState(false);
    const [current_map_projection, set_current_map_projection] = useState<MapProjection>('globe');
    const [current_map_type, set_current_map_type] = useState<MapType>('satellite');
    const [base_labels_visible, set_base_labels_visible] = useState(false);
    const [region_labels_visible, set_region_labels_visible] = useState(true);
    const [border_mode, set_border_mode] = useState<BorderMode>('auto');

    // Data State
    const [region_indexes, set_region_indexes] = useState<RegionIndex[]>([]);
    const region_indexes_ref = useRef<RegionIndex[]>([]);

    // Refs
    const selected_feature_id_ref = useRef<string | number | null>(null);
    const selected_source_ref = useRef<SourceName | null>(null);
    const hovered_state_id_ref = useRef<string | number | null>(null);
    const hovered_source_ref = useRef<SourceName | null>(null);
    const hover_enabled_ref = useRef(hover_enabled);
    const auto_rotate_ref = useRef(auto_rotate);
    const is_interacting_ref = useRef(false);

    useEffect(() => { hover_enabled_ref.current = hover_enabled; }, [hover_enabled]);
    useEffect(() => { auto_rotate_ref.current = auto_rotate; }, [auto_rotate]);
    useEffect(() => { region_indexes_ref.current = region_indexes; }, [region_indexes]);

    const clear_hover = () => {
        const map = map_instance_ref.current;
        if (!map) return;
        map.getCanvas().style.cursor = '';
        if (hovered_source_ref.current && hovered_state_id_ref.current && map.getSource(hovered_source_ref.current)) {
            try {
                map.setFeatureState(
                    { source: hovered_source_ref.current, id: hovered_state_id_ref.current },
                    { hover: false }
                );
            } catch { }
        }
        hovered_source_ref.current = null;
        hovered_state_id_ref.current = null;
    };

    const set_source_data = (source_name: string, data: GeoJSON.GeoJSON) => {
        const map = map_instance_ref.current;
        if (!map) return;
        const source = map.getSource(source_name) as maplibregl.GeoJSONSource | undefined;
        source?.setData(data);
    }

    const focus_on_region = (region: RegionIndex) => {
        const map = map_instance_ref.current;
        if (!map) return;

        clear_hover();
        selected_feature_id_ref.current = region.id;
        selected_source_ref.current = region.source;
        set_selection_text(`${region.type}: ${region.name}`);
        set_source_data('selected-data', region.feature);

        try {
            const safe_world_polygon = turf.polygon([[
                [179.9, 89.9], [-179.9, 89.9], [-179.9, -89.9], [179.9, -89.9], [179.9, 89.9],
            ]]);
            const mask = turf.mask(region.feature as any, safe_world_polygon);
            set_source_data('mask-data', mask as any);
        } catch {
            set_source_data('mask-data', { type: 'FeatureCollection', features: [] });
        }

        try {
            const bbox = turf.bbox(region.feature as any);
            const bounds: maplibregl.LngLatBoundsLike = [[bbox[0], bbox[1]], [bbox[2], bbox[3]]];
            const target_camera = map.cameraForBounds(bounds, { padding: 40 });
            if (!target_camera) return;

            if (region.source === 'continents-data') {
                try {
                    const centroid = turf.centroid(region.feature as any);
                    target_camera.center = centroid.geometry.coordinates as [number, number];
                    target_camera.zoom = (target_camera.zoom ?? 0) + 0.15;
                } catch { }
            } else if (region.source === 'countries-data') {
                target_camera.zoom = Math.max(target_camera.zoom ?? 0, 5.0);
            } else if (region.source === 'bd-divisions-data') {
                target_camera.zoom = Math.max(target_camera.zoom ?? 0, 6.2);
            } else if (region.source === 'bd-districts-data') {
                target_camera.zoom = Math.max(target_camera.zoom ?? 0, 6.8);
            }

            map.flyTo({ ...target_camera, duration: 1800, essential: true });
        } catch (error) {
            console.error('Could not focus region:', error);
        }
    }

    const clear_selection = (zoom_out = true) => {
        const map = map_instance_ref.current;
        selected_feature_id_ref.current = null;
        selected_source_ref.current = null;
        set_selection_text('None');
        set_search_term('');
        set_source_data('selected-data', { type: 'FeatureCollection', features: [] });
        set_source_data('mask-data', { type: 'FeatureCollection', features: [] });

        if (map && zoom_out) {
            map.easeTo({
                zoom: Math.max(1, map.getZoom() - 1.5),
                duration: 1200,
                essential: true,
            });
        }
    };

    const get_region_from_feature = (source: string, id: string | number): RegionIndex | undefined => {
        return region_indexes_ref.current.find((region) => region.source === source && String(region.id) === String(id));
    };

    useEffect(() => {
        if (map_instance_ref.current || !map_container_ref.current) return;

        const map = new maplibregl.Map({
            container: map_container_ref.current,
            style: {
                version: 8,
                glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
                sources: {
                    'google-raster-base': { type: 'raster', tiles: [TILES_SATELLITE_BASE], tileSize: 256 },
                },
                layers: [{ id: 'google-base-layer', type: 'raster', source: 'google-raster-base', minzoom: 0, maxzoom: 22 }],
                projection: { type: 'globe' }
            },
            center: [90.4, 23.7],
            zoom: 2.2,
            minZoom: 1,
            maxZoom: 14,
            pitch: 0,
            bearing: 0,
        });

        map_instance_ref.current = map;

        map.on('load', async () => {
            try {
                set_selection_text('Loading Geometry...');

                // Fetch data, wait for JSON, and destructure directly. No .ok checks needed.
                const [
                    continents_data,
                    countries_data,
                    states_data,
                    bd_districts_data,
                ] = await fetch_geo_data();

                // Prevent operating on a map that unmounted during fetch
                if (!map_instance_ref.current) return;

                set_selection_text('None');

                const bd_division_features = states_data.features.filter((feature) =>
                    feature.properties.adm0_a3 === 'BGD' || feature.properties.admin === 'Bangladesh'
                );
                const bd_divisions_data: RegionCollection = { type: 'FeatureCollection', features: bd_division_features };

                const continents_points: FeatureCollection<Point, RegionProperties> = { type: 'FeatureCollection', features: [] };
                const countries_points: FeatureCollection<Point, RegionProperties> = { type: 'FeatureCollection', features: [] };
                const bd_divisions_points: FeatureCollection<Point, RegionProperties> = { type: 'FeatureCollection', features: [] };
                const bd_districts_points: FeatureCollection<Point, RegionProperties> = { type: 'FeatureCollection', features: [] };

                const new_region_indexes: RegionIndex[] = [];

                const process_layer = (
                    data: RegionCollection,
                    source_name: SourceName,
                    type_name: Exclude<RegionType, 'All'>,
                    name_extractor: (properties: RegionProperties) => string,
                    points_collection: FeatureCollection<Point, RegionProperties>
                ) => {
                    data.features.forEach((feature, index) => {
                        feature.id = index;
                        const region_name = name_extractor(feature.properties || {}) || 'Unknown';
                        const display_name = type_name === 'Division' ? `${region_name} Division` : region_name;

                        new_region_indexes.push({
                            id: index, source: source_name, type: type_name,
                            name: display_name, feature: feature as RegionFeature
                        });

                        try {
                            const point = turf.centroid(feature as any) as Feature<Point, RegionProperties>;
                            point.id = index;
                            point.properties = feature.properties ?? {};
                            points_collection.features.push(point);
                        } catch { }
                    });
                };

                process_layer(continents_data, 'continents-data', 'Continent', p => String(p.CONTINENT ?? 'Unknown'), continents_points);
                process_layer(countries_data, 'countries-data', 'Country', p => String(p.ADMIN ?? p.NAME ?? 'Unknown'), countries_points);
                process_layer(bd_divisions_data, 'bd-divisions-data', 'Division', p => String(p.name ?? p.NAME ?? 'Unknown'), bd_divisions_points);
                process_layer(bd_districts_data, 'bd-districts-data', 'District', p => String(p.ADM2_EN ?? p.NAME_2 ?? p.name ?? 'Unknown'), bd_districts_points);

                new_region_indexes.sort((a, b) => a.name.localeCompare(b.name));
                region_indexes_ref.current = new_region_indexes;
                set_region_indexes(new_region_indexes);

                map.addSource('continents-data', { type: 'geojson', data: continents_data });
                map.addSource('countries-data', { type: 'geojson', data: countries_data });
                map.addSource('bd-divisions-data', { type: 'geojson', data: bd_divisions_data });
                map.addSource('bd-districts-data', { type: 'geojson', data: bd_districts_data });

                map.addSource('continents-points', { type: 'geojson', data: continents_points });
                map.addSource('countries-points', { type: 'geojson', data: countries_points });
                map.addSource('bd-divisions-points', { type: 'geojson', data: bd_divisions_points });
                map.addSource('bd-districts-points', { type: 'geojson', data: bd_districts_points });

                map.addSource('selected-data', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
                map.addSource('mask-data', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

                // Fills
                map.addLayer({ id: 'continents-fill', type: 'fill', source: 'continents-data', minzoom: 1.0, maxzoom: 3.5, paint: { 'fill-color': MAP_THEME.hoverFill, 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], MAP_THEME.hoverOpacity, 0.0] } });
                map.addLayer({ id: 'countries-fill', type: 'fill', source: 'countries-data', minzoom: 3.5, maxzoom: 5.5, paint: { 'fill-color': MAP_THEME.hoverFill, 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], MAP_THEME.hoverOpacity, 0.0] } });
                map.addLayer({ id: 'bd-divisions-fill', type: 'fill', source: 'bd-divisions-data', minzoom: 5.5, maxzoom: 6.5, paint: { 'fill-color': MAP_THEME.hoverFill, 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], MAP_THEME.hoverOpacity, 0.0] } });
                map.addLayer({ id: 'bd-districts-fill', type: 'fill', source: 'bd-districts-data', minzoom: 6.5, paint: { 'fill-color': MAP_THEME.hoverFill, 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], MAP_THEME.hoverOpacity, 0.0] } });

                // Borders
                map.addLayer({ id: 'continents-borders', type: 'line', source: 'continents-data', minzoom: 1.0, maxzoom: 3.5, layout: { 'visibility': 'visible' }, paint: { 'line-color': MAP_THEME.continentBorder, 'line-width': ['interpolate', ['linear'], ['zoom'], 1.0, 1, 3.5, 2.5] } });
                map.addLayer({ id: 'countries-borders', type: 'line', source: 'countries-data', minzoom: 3.5, maxzoom: 5.5, layout: { 'visibility': 'visible' }, paint: { 'line-color': MAP_THEME.countryBorder, 'line-width': ['interpolate', ['linear'], ['zoom'], 3.5, 0.5, 5.5, 2.5] } });
                map.addLayer({ id: 'bd-divisions-borders', type: 'line', source: 'bd-divisions-data', minzoom: 5.5, maxzoom: 6.5, layout: { 'visibility': 'visible' }, paint: { 'line-color': MAP_THEME.divisionBorder, 'line-width': ['interpolate', ['linear'], ['zoom'], 5.5, 1, 6.5, 2.5] } });
                map.addLayer({ id: 'bd-districts-borders', type: 'line', source: 'bd-districts-data', minzoom: 6.5, layout: { 'visibility': 'visible' }, paint: { 'line-color': MAP_THEME.bdBorder, 'line-width': ['interpolate', ['linear'], ['zoom'], 6.5, 1, 10, 3.5] } });

                // Selection Mask
                map.addLayer({ id: 'mask-layer', type: 'fill', source: 'mask-data', paint: { 'fill-color': '#000000', 'fill-opacity': 0.65 } });
                map.addLayer({ id: 'selected-border', type: 'line', source: 'selected-data', paint: { 'line-color': '#00e5ff', 'line-width': 3.5, 'line-opacity': 1.0 } });

                // Labels
                map.addLayer({ id: 'continents-labels', type: 'symbol', source: 'continents-points', minzoom: 1.0, maxzoom: 3.5, layout: { 'text-field': ['get', 'CONTINENT'], 'text-font': ['Noto Sans Medium'], 'text-size': ['interpolate', ['linear'], ['zoom'], 1.0, 10, 3.5, 24], 'visibility': 'visible' }, paint: { 'text-color': MAP_THEME.continentBorder, 'text-halo-color': 'rgba(0,0,0,0.85)', 'text-halo-width': 1.5 } });
                map.addLayer({ id: 'countries-labels', type: 'symbol', source: 'countries-points', minzoom: 3.5, maxzoom: 5.5, layout: { 'text-field': ['coalesce', ['get', 'ADMIN'], ['get', 'NAME'], 'Unknown'], 'text-font': ['Noto Sans Medium'], 'text-size': ['interpolate', ['linear'], ['zoom'], 3.5, 11, 5.5, 20], 'visibility': 'visible' }, paint: { 'text-color': MAP_THEME.countryBorder, 'text-halo-color': 'rgba(0,0,0,0.85)', 'text-halo-width': 1.5 } });
                map.addLayer({ id: 'bd-divisions-labels', type: 'symbol', source: 'bd-divisions-points', minzoom: 5.5, maxzoom: 6.5, layout: { 'text-field': ['coalesce', ['get', 'name'], ['get', 'NAME'], 'Unknown'], 'text-font': ['Noto Sans Medium'], 'text-size': ['interpolate', ['linear'], ['zoom'], 5.5, 11, 6.5, 18], 'visibility': 'visible' }, paint: { 'text-color': MAP_THEME.divisionBorder, 'text-halo-color': 'rgba(0,0,0,0.85)', 'text-halo-width': 1.5 } });
                map.addLayer({ id: 'bd-districts-labels', type: 'symbol', source: 'bd-districts-points', minzoom: 6.5, layout: { 'text-field': ['coalesce', ['get', 'ADM2_EN'], ['get', 'NAME_2'], ['get', 'name'], 'Unknown'], 'text-font': ['Noto Sans Medium'], 'text-size': ['interpolate', ['linear'], ['zoom'], 6.5, 12, 10, 22], 'visibility': 'visible' }, paint: { 'text-color': MAP_THEME.bdBorder, 'text-halo-color': 'rgba(0,0,0,0.85)', 'text-halo-width': 1.5 } });

                // Base Map Labels
                map.addSource('google-raster-labels', { type: 'raster', tiles: [TILES_LABELS_WITH_BORDERS], tileSize: 256 });
                map.addLayer({ id: 'google-labels-layer', type: 'raster', source: 'google-raster-labels', minzoom: 0, maxzoom: 22, layout: { 'visibility': 'none' } });

                // Interaction State Listeners (For Autorotate fix)
                ['mousedown', 'dragstart', 'touchstart', 'zoomstart'].forEach(evt => map.on(evt as any, () => is_interacting_ref.current = true));
                ['mouseup', 'dragend', 'touchend', 'zoomend'].forEach(evt => map.on(evt as any, () => is_interacting_ref.current = false));

                map.on('mousemove', (event) => {
                    if (!hover_enabled_ref.current) { clear_hover(); return; }
                    const features = map.queryRenderedFeatures(event.point, { layers: INTERACTIVE_LAYERS });
                    if (features.length === 0) { clear_hover(); return; }
                    const top_feature = features[0];
                    if (top_feature.id == null || !top_feature.source) { clear_hover(); return; }

                    const actual_source = top_feature.source as SourceName;
                    if (selected_source_ref.current === actual_source && String(selected_feature_id_ref.current) === String(top_feature.id)) { clear_hover(); return; }

                    map.getCanvas().style.cursor = 'pointer';
                    if (hovered_state_id_ref.current !== top_feature.id || hovered_source_ref.current !== actual_source) {
                        clear_hover();
                        hovered_state_id_ref.current = top_feature.id;
                        hovered_source_ref.current = actual_source;
                        try { map.setFeatureState({ source: actual_source, id: top_feature.id }, { hover: true }); } catch { }
                    }
                });

                map.on('mouseout', clear_hover);
                map.on('click', (event) => {
                    const features = map.queryRenderedFeatures(event.point, { layers: INTERACTIVE_LAYERS });
                    if (features.length === 0) {
                        if (selected_feature_id_ref.current !== null) clear_selection();
                        return;
                    }
                    const top_feature = features[0];
                    if (top_feature.id == null || !top_feature.source) return;
                    const region = get_region_from_feature(top_feature.source, top_feature.id);
                    if (region) focus_on_region(region);
                });

                set_is_map_ready(true);

            } catch (err) {
                console.error("Frontend: Map Data Load Error", err);
                set_selection_text('Could not load geometry');
            }
        });

        return () => {
            map.remove();
            map_instance_ref.current = null;
        };
    }, []);

    // Control Effects guarded by is_map_ready
    useEffect(() => {
        const map = map_instance_ref.current;
        if (!map || !is_map_ready) return;
        map.setProjection({ type: current_map_projection });
    }, [current_map_projection, is_map_ready]);

    useEffect(() => {
        const map = map_instance_ref.current;
        if (!map || !is_map_ready) return;
        const source = map.getSource('google-raster-base') as maplibregl.RasterTileSource | undefined;
        if (source) source.setTiles([current_map_type === 'satellite' ? TILES_SATELLITE_BASE : TILES_ROADMAP_BASE]);

        const labels_source = map.getSource('google-raster-labels') as maplibregl.RasterTileSource | undefined;
        if (labels_source) labels_source.setTiles([current_map_type === 'satellite' ? TILES_LABELS_WITH_BORDERS : TILES_LABELS_PURE_TEXT]);
    }, [current_map_type, is_map_ready]);

    useEffect(() => {
        const map = map_instance_ref.current;
        if (!map || !is_map_ready || !map.getLayer('google-labels-layer')) return;
        map.setLayoutProperty('google-labels-layer', 'visibility', base_labels_visible ? 'visible' : 'none');
    }, [base_labels_visible, is_map_ready]);

    useEffect(() => {
        const map = map_instance_ref.current;
        if (!map || !is_map_ready) return;
        ['continents-labels', 'countries-labels', 'bd-divisions-labels', 'bd-districts-labels'].forEach((layer_id) => {
            if (map.getLayer(layer_id)) map.setLayoutProperty(layer_id, 'visibility', region_labels_visible ? 'visible' : 'none');
        });
    }, [region_labels_visible, is_map_ready]);

    useEffect(() => {
        const map = map_instance_ref.current;
        if (!map || !is_map_ready) return;

        const continent_layers = ['continents-borders', 'continents-fill', 'continents-labels'];
        const country_layers = ['countries-borders', 'countries-fill', 'countries-labels'];
        const division_layers = ['bd-divisions-borders', 'bd-divisions-fill', 'bd-divisions-labels'];
        const district_layers = ['bd-districts-borders', 'bd-districts-fill', 'bd-districts-labels'];

        const set_lod = (layers: string[], min: number, max: number) => layers.forEach(l => { if (map.getLayer(l)) map.setLayerZoomRange(l, min, max); });
        const set_vis = (layers: string[], vis: 'visible' | 'none') => layers.forEach(l => { if (map.getLayer(l)) map.setLayoutProperty(l, 'visibility', vis); });

        if (border_mode === 'auto') {
            set_lod(continent_layers, 1.0, 3.5); set_lod(country_layers, 3.5, 5.5); set_lod(division_layers, 5.5, 6.5); set_lod(district_layers, 6.5, 22);
            set_vis(continent_layers, 'visible'); set_vis(country_layers, 'visible'); set_vis(division_layers, 'visible'); set_vis(district_layers, 'visible');
        } else if (border_mode === 'off') {
            set_vis(continent_layers, 'none'); set_vis(country_layers, 'none'); set_vis(division_layers, 'none'); set_vis(district_layers, 'none');
        } else {
            set_lod(continent_layers, 0, 22); set_lod(country_layers, 0, 22); set_lod(division_layers, 0, 22); set_lod(district_layers, 0, 22);
            set_vis(continent_layers, border_mode === 'continents' ? 'visible' : 'none');
            set_vis(country_layers, border_mode === 'countries' ? 'visible' : 'none');
            set_vis(division_layers, border_mode === 'divisions' ? 'visible' : 'none');
            set_vis(district_layers, border_mode === 'districts' ? 'visible' : 'none');
        }
    }, [border_mode, is_map_ready]);

    // Autorotate fix with interaction guards
    useEffect(() => {
        let animation_frame = 0;
        const spin_globe = () => {
            const map = map_instance_ref.current;
            if (
                map && auto_rotate_ref.current && current_map_projection === 'globe' &&
                !is_interacting_ref.current && !map.isMoving()
            ) {
                const center = map.getCenter();
                center.lng -= 0.15;
                map.jumpTo({ center });
            }
            animation_frame = requestAnimationFrame(spin_globe);
        }
        animation_frame = requestAnimationFrame(spin_globe);
        return () => cancelAnimationFrame(animation_frame);
    }, [current_map_projection]);

    useEffect(() => {
        const handle_key_down = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            const active_element = document.activeElement;
            if (active_element?.id === 'searchInput') return;
            if (selected_feature_id_ref.current !== null) clear_selection();
        }
        document.addEventListener('keydown', handle_key_down);
        return () => document.removeEventListener('keydown', handle_key_down);
    }, []);

    return (
        <div className="app">
            <div ref={map_container_ref} className="map"></div>
            <div className="header">
                <div className="logo"><h1>Hritu</h1><span /></div>
                <SearchBar
                    regions={region_indexes}
                    value={search_term}
                    onChange={set_search_term}
                    onSelect={focus_on_region}
                    onEscape={() => clear_selection()}
                    placeholder="Search for a region..."
                />
                <button onClick={() => set_left_sidebar_open(prev => !prev)}>Toggle Left</button>
                <button onClick={() => set_right_sidebar_open(prev => !prev)}>Toggle Right</button>
            </div>
            <aside className={`sidebar left ${left_sidebar_open ? "open" : ""}`}>
                <div><strong>Map Controls</strong></div>
                <div style={{ marginTop: 12, marginBottom: 6 }}><strong>Selection</strong></div>
                <div style={{ fontSize: 13, marginBottom: 12 }}>{selection_text}</div>

                <button onClick={() => set_current_map_projection(prev => prev === 'globe' ? 'mercator' : 'globe')}>
                    {current_map_projection === 'globe' ? 'Flat Map' : '3D Globe'}
                </button>
                <button onClick={() => set_current_map_type(prev => prev === 'satellite' ? 'roadmap' : 'satellite')}>
                    {current_map_type === 'satellite' ? 'Roadmap' : 'Satellite'}
                </button>
                <button className={base_labels_visible ? 'active' : ''} onClick={() => set_base_labels_visible(prev => !prev)}>
                    Base Labels: {base_labels_visible ? 'On' : 'Off'}
                </button>
                <button className={region_labels_visible ? 'active' : ''} onClick={() => set_region_labels_visible(prev => !prev)}>
                    Region Labels: {region_labels_visible ? 'On' : 'Off'}
                </button>
                <button className={hover_enabled ? 'active' : ''} onClick={() => {
                    set_hover_enabled(prev => {
                        const next = !prev;
                        if (!next) clear_hover();
                        return next;
                    });
                }}>
                    Hover: {hover_enabled ? 'On' : 'Off'}
                </button>
                <button className={auto_rotate ? 'active' : ''} onClick={() => set_auto_rotate(prev => !prev)}>
                    Rotate: {auto_rotate ? 'On' : 'Off'}
                </button>
            </aside>
            <aside className={`sidebar right ${right_sidebar_open ? "open" : ""}`}>
                Right Sidebar
            </aside>
            <div className="footer">Bottom</div>
        </div>
    );
}
