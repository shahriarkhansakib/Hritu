import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import type { Point, Feature, FeatureCollection, Geometry } from "geojson";

// ==========================================
// TYPES
// ==========================================

export type RegionType = "All" | "Continent" | "Country" | "Division" | "District";
export type SourceName = "continents-data" | "countries-data" | "bd-divisions-data" | "bd-districts-data";
export type RegionProperties = Record<string, unknown>;
export type RegionFeature = Feature<Geometry, RegionProperties> & { id?: string | number };
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
type BorderMode = 'auto' | 'continents' | 'countries' | 'divisions' | 'districts' | 'off';

// ==========================================
// CONFIGURATION & THEME
// ==========================================

const URL_CONTINENTS = "https://gist.githubusercontent.com/hrbrmstr/91ea5cc9474286c72838/raw/continents.json";
const URL_COUNTRIES = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson";
const URL_STATES = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";
const URL_BD_DISTRICTS = "https://raw.githubusercontent.com/mostakimjihad/bd_district_geojson/master/district.json";

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

// ==========================================
// SEARCH HELPERS
// ==========================================

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
    if (!query) return <>{text}</>;
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
        if (query_index < lower_query.length && character.toLowerCase() === lower_query[query_index]) {
            result.push(<span key={i} style={{ color: '#4ade80', fontWeight: 600 }}>{character}</span>);
            ++query_index;
        } else {
            result.push(character);
        }
    }
    return <>{result}</>;
}

// ==========================================
// SEARCH BAR COMPONENT
// ==========================================

function SearchBar({
    regions, value, onChange, onSelect, onEscape, placeholder
}: {
    regions: RegionIndex[]; value: string; onChange: (value: string) => void;
    onSelect: (region: RegionIndex) => void; onEscape: () => void; placeholder?: string;
}) {
    const container_ref = useRef<HTMLDivElement>(null);
    const list_ref = useRef<HTMLDivElement>(null);
    const region_selection_types: RegionType[] = ["All", "Continent", "Country", "Division", "District"];

    const [selected_region_type, set_selected_region_type] = useState<RegionType>('All');
    const [show_dropdown, set_show_dropdown] = useState(false);
    const [active_region_index, set_active_region_index] = useState(-1);

    const filtered_regions = useMemo(() => {
        const query = value.trim();
        return regions
            .filter(r => selected_region_type === 'All' || r.type === selected_region_type)
            .map(region => ({ region, score: get_match_score(region.name, query) }))
            .filter(res => res.score > 0)
            .sort((a, b) => b.score - a.score || a.region.name.localeCompare(b.region.name))
            .map(res => res.region);
    }, [regions, value, selected_region_type]);

    useEffect(() => { set_active_region_index(filtered_regions.length > 0 ? 0 : -1); }, [filtered_regions]);

    useEffect(() => {
        const handle_click_outside = (event: MouseEvent) => {
            if (container_ref.current && !container_ref.current.contains(event.target as Node)) set_show_dropdown(false);
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

    const handle_key_down = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            if (show_dropdown) { set_show_dropdown(false); (event.target as HTMLInputElement).blur(); }
            else onEscape();
            return;
        }
        if (!show_dropdown && event.key === 'ArrowDown') { event.preventDefault(); set_show_dropdown(true); return; }
        if (event.key === 'ArrowDown') { event.preventDefault(); set_active_region_index(prev => Math.min(prev + 1, filtered_regions.length - 1)); }
        if (event.key === 'ArrowUp') { event.preventDefault(); set_active_region_index(prev => Math.max(prev - 1, 0)); }
        if (event.key === 'Enter') {
            event.preventDefault();
            if (active_region_index >= 0 && active_region_index < filtered_regions.length) {
                onChange(filtered_regions[active_region_index].name);
                set_show_dropdown(false);
                onSelect(filtered_regions[active_region_index]);
            }
        }
    };

    return (
        <div ref={container_ref} className="search-container">
            <input id="searchInput" type="text" className="search-input" value={value}
                onChange={(e) => { onChange(e.target.value); set_show_dropdown(true); }}
                onFocus={() => set_show_dropdown(true)} onKeyDown={handle_key_down}
                placeholder={placeholder ?? 'Search'} autoComplete="off" />
            <div className={`search-dropdown ${show_dropdown ? "show" : ""}`}>
                <div className="search-tags">
                    {region_selection_types.map((type) =>
                        <div key={type} className={`search-tag ${selected_region_type === type ? "active" : ""}`}
                            onMouseDown={(e) => { e.preventDefault(); set_selected_region_type(type); set_show_dropdown(true); }}>
                            {type}
                        </div>
                    )}
                </div>
                <div ref={list_ref} className="search-list">
                    {filtered_regions.length === 0 ? (
                        <div className="search-item" style={{ color: '#666', cursor: 'default' }}>No regions found</div>
                    ) : (
                        filtered_regions.map((region, index) =>
                            <div key={`${region.source}-${region.id}`}
                                className={`search-item ${active_region_index === index ? "active" : ""}`}
                                onMouseEnter={() => set_active_region_index(index)}
                                onMouseDown={(e) => { e.preventDefault(); onChange(region.name); set_show_dropdown(false); onSelect(region); }}>
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

// ==========================================
// MAP ENGINE CLASS
// ==========================================

class MapEngine {
    private map: maplibregl.Map;
    private regions: RegionIndex[] = [];

    // State
    private isReady = false;
    private hoverEnabled = true;
    private autoRotate = false;
    private borderMode: BorderMode = 'auto';
    private regionLabelsVisible = true;
    private mapType: MapType = 'satellite';
    private isInteracting = false;
    private animationFrameId = 0;

    // Selections & Hovers
    private hoveredSource: SourceName | null = null;
    private hoveredStateId: string | number | null = null;
    private selectedSource: SourceName | null = null;
    private selectedFeatureId: string | number | null = null;

    // Callbacks to React UI
    private onReady: () => void;
    private onRegionsLoaded: (regions: RegionIndex[]) => void;
    private onSelectionChange: (text: string, searchInput: string) => void;

    constructor(container: HTMLDivElement, callbacks: {
        onReady: () => void,
        onRegionsLoaded: (regions: RegionIndex[]) => void,
        onSelectionChange: (text: string, searchInput: string) => void
    }) {
        this.onReady = callbacks.onReady;
        this.onRegionsLoaded = callbacks.onRegionsLoaded;
        this.onSelectionChange = callbacks.onSelectionChange;

        this.map = new maplibregl.Map({
            container,
            style: {
                version: 8,
                glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
                sources: {
                    'google-raster-base': { type: 'raster', tiles: [TILES_SATELLITE_BASE], tileSize: 256 },
                },
                layers: [{ id: 'google-base-layer', type: 'raster', source: 'google-raster-base', minzoom: 0, maxzoom: 22 }],
            },
            center: [90.4, 23.7],
            zoom: 2.2,
            minZoom: 1,
            maxZoom: 14,
            pitch: 0,
            bearing: 0,
            ...({ projection: { type: 'globe' } } as any)
        });

        this.setupEventListeners();
    }

    private setupEventListeners = () => {
        this.map.on('style.load', () => {
            (this.map as any).setProjection({ type: 'globe' });
        });

        this.map.on('load', this.bootstrapGeography);

        const stopRotate = () => { this.isInteracting = true; };
        const startRotate = () => { this.isInteracting = false; };
        ['mousedown', 'dragstart', 'touchstart', 'zoomstart'].forEach(evt => this.map.on(evt as any, stopRotate));
        ['mouseup', 'dragend', 'touchend', 'zoomend'].forEach(evt => this.map.on(evt as any, startRotate));

        this.map.on('mousemove', this.handleMouseMove);
        this.map.on('mouseout', this.clearHover);
        this.map.on('click', this.handleClick);

        const spin = () => {
            if (this.autoRotate && !this.isInteracting && !this.map.isMoving() && (this.map as any).getProjection().type === 'globe') {
                const center = this.map.getCenter();
                center.lng -= 0.15;
                this.map.jumpTo({ center });
            }
            this.animationFrameId = requestAnimationFrame(spin);
        };
        spin();
    };

    private bootstrapGeography = async () => {
        try {
            this.onSelectionChange("Loading Geography...", "");

            const [rawCont, rawCount, rawStates, rawBd] = await Promise.all([
                fetch(URL_CONTINENTS).then(res => res.json()),
                fetch(URL_COUNTRIES).then(res => res.json()),
                fetch(URL_STATES).then(res => res.json()),
                fetch(URL_BD_DISTRICTS).then(res => res.json()),
            ]);

            const bd_division_features = rawStates.features.filter((f: any) => f.properties.adm0_a3 === 'BGD' || f.properties.admin === 'Bangladesh');
            const bdDivisionsData: RegionCollection = { type: 'FeatureCollection', features: bd_division_features };

            const ptsCont: FeatureCollection<Point, RegionProperties> = { type: 'FeatureCollection', features: [] };
            const ptsCount: FeatureCollection<Point, RegionProperties> = { type: 'FeatureCollection', features: [] };
            const ptsDiv: FeatureCollection<Point, RegionProperties> = { type: 'FeatureCollection', features: [] };
            const ptsDist: FeatureCollection<Point, RegionProperties> = { type: 'FeatureCollection', features: [] };

            const buildIndex = (data: RegionCollection, src: SourceName, type: Exclude<RegionType, 'All'>, ext: (p: any) => string, pts: FeatureCollection<Point, RegionProperties>) => {
                data.features.forEach((f, i) => {
                    f.id = i;
                    const name = ext(f.properties || {}) || 'Unknown';
                    const disp = type === 'Division' ? `${name} Division` : name;
                    this.regions.push({ id: i, source: src, type, name: disp, feature: f as RegionFeature });
                    try {
                        const pt = turf.centroid(f as any) as Feature<Point, RegionProperties>;
                        pt.id = i; pt.properties = f.properties ?? {};
                        pts.features.push(pt);
                    } catch { }
                });
            };

            buildIndex(rawCont, 'continents-data', 'Continent', p => String(p.CONTINENT), ptsCont);
            buildIndex(rawCount, 'countries-data', 'Country', p => String(p.ADMIN ?? p.NAME), ptsCount);
            buildIndex(bdDivisionsData, 'bd-divisions-data', 'Division', p => String(p.name ?? p.NAME), ptsDiv);
            buildIndex(rawBd, 'bd-districts-data', 'District', p => String(p.ADM2_EN ?? p.NAME_2 ?? p.name), ptsDist);

            this.regions.sort((a, b) => a.name.localeCompare(b.name));
            this.onRegionsLoaded(this.regions);
            this.onSelectionChange("None", "");

            this.map.addSource('continents-data', { type: 'geojson', data: rawCont });
            this.map.addSource('countries-data', { type: 'geojson', data: rawCount });
            this.map.addSource('bd-divisions-data', { type: 'geojson', data: bdDivisionsData });
            this.map.addSource('bd-districts-data', { type: 'geojson', data: rawBd });
            this.map.addSource('continents-points', { type: 'geojson', data: ptsCont });
            this.map.addSource('countries-points', { type: 'geojson', data: ptsCount });
            this.map.addSource('bd-divisions-points', { type: 'geojson', data: ptsDiv });
            this.map.addSource('bd-districts-points', { type: 'geojson', data: ptsDist });
            this.map.addSource('selected-data', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
            this.map.addSource('mask-data', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
            this.map.addSource('google-raster-labels', { type: 'raster', tiles: [TILES_LABELS_WITH_BORDERS], tileSize: 256 });

            this.map.addLayer({ id: 'continents-fill', type: 'fill', source: 'continents-data', minzoom: 1.0, maxzoom: 3.5, paint: { 'fill-color': MAP_THEME.hoverFill, 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], MAP_THEME.hoverOpacity, 0.0] } });
            this.map.addLayer({ id: 'countries-fill', type: 'fill', source: 'countries-data', minzoom: 3.5, maxzoom: 5.5, paint: { 'fill-color': MAP_THEME.hoverFill, 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], MAP_THEME.hoverOpacity, 0.0] } });
            this.map.addLayer({ id: 'bd-divisions-fill', type: 'fill', source: 'bd-divisions-data', minzoom: 5.5, maxzoom: 6.5, paint: { 'fill-color': MAP_THEME.hoverFill, 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], MAP_THEME.hoverOpacity, 0.0] } });
            this.map.addLayer({ id: 'bd-districts-fill', type: 'fill', source: 'bd-districts-data', minzoom: 6.5, paint: { 'fill-color': MAP_THEME.hoverFill, 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], MAP_THEME.hoverOpacity, 0.0] } });

            this.map.addLayer({ id: 'continents-borders', type: 'line', source: 'continents-data', minzoom: 1.0, maxzoom: 3.5, paint: { 'line-color': MAP_THEME.continentBorder, 'line-width': ['interpolate', ['linear'], ['zoom'], 1.0, 1, 3.5, 2.5] } });
            this.map.addLayer({ id: 'countries-borders', type: 'line', source: 'countries-data', minzoom: 3.5, maxzoom: 5.5, paint: { 'line-color': MAP_THEME.countryBorder, 'line-width': ['interpolate', ['linear'], ['zoom'], 3.5, 0.5, 5.5, 2.5] } });
            this.map.addLayer({ id: 'bd-divisions-borders', type: 'line', source: 'bd-divisions-data', minzoom: 5.5, maxzoom: 6.5, paint: { 'line-color': MAP_THEME.divisionBorder, 'line-width': ['interpolate', ['linear'], ['zoom'], 5.5, 1, 6.5, 2.5] } });
            this.map.addLayer({ id: 'bd-districts-borders', type: 'line', source: 'bd-districts-data', minzoom: 6.5, paint: { 'line-color': MAP_THEME.bdBorder, 'line-width': ['interpolate', ['linear'], ['zoom'], 6.5, 1, 10, 3.5] } });

            this.map.addLayer({ id: 'mask-layer', type: 'fill', source: 'mask-data', paint: { 'fill-color': '#000000', 'fill-opacity': 0.65 } });
            this.map.addLayer({ id: 'selected-border', type: 'line', source: 'selected-data', paint: { 'line-color': '#00e5ff', 'line-width': 3.5, 'line-opacity': 1.0 } });

            this.map.addLayer({ id: 'continents-labels', type: 'symbol', source: 'continents-points', minzoom: 1.0, maxzoom: 3.5, layout: { 'text-field': ['get', 'CONTINENT'], 'text-font': ['Noto Sans Medium'], 'text-size': ['interpolate', ['linear'], ['zoom'], 1.0, 10, 3.5, 24] }, paint: { 'text-color': MAP_THEME.continentBorder, 'text-halo-color': 'rgba(0,0,0,0.85)', 'text-halo-width': 1.5 } });
            this.map.addLayer({ id: 'countries-labels', type: 'symbol', source: 'countries-points', minzoom: 3.5, maxzoom: 5.5, layout: { 'text-field': ['coalesce', ['get', 'ADMIN'], ['get', 'NAME'], 'Unknown'], 'text-font': ['Noto Sans Medium'], 'text-size': ['interpolate', ['linear'], ['zoom'], 3.5, 11, 5.5, 20] }, paint: { 'text-color': MAP_THEME.countryBorder, 'text-halo-color': 'rgba(0,0,0,0.85)', 'text-halo-width': 1.5 } });
            this.map.addLayer({ id: 'bd-divisions-labels', type: 'symbol', source: 'bd-divisions-points', minzoom: 5.5, maxzoom: 6.5, layout: { 'text-field': ['coalesce', ['get', 'name'], ['get', 'NAME'], 'Unknown'], 'text-font': ['Noto Sans Medium'], 'text-size': ['interpolate', ['linear'], ['zoom'], 5.5, 11, 6.5, 18] }, paint: { 'text-color': MAP_THEME.divisionBorder, 'text-halo-color': 'rgba(0,0,0,0.85)', 'text-halo-width': 1.5 } });
            this.map.addLayer({ id: 'bd-districts-labels', type: 'symbol', source: 'bd-districts-points', minzoom: 6.5, layout: { 'text-field': ['coalesce', ['get', 'ADM2_EN'], ['get', 'NAME_2'], ['get', 'name'], 'Unknown'], 'text-font': ['Noto Sans Medium'], 'text-size': ['interpolate', ['linear'], ['zoom'], 6.5, 12, 10, 22] }, paint: { 'text-color': MAP_THEME.bdBorder, 'text-halo-color': 'rgba(0,0,0,0.85)', 'text-halo-width': 1.5 } });
            this.map.addLayer({ id: 'google-labels-layer', type: 'raster', source: 'google-raster-labels', minzoom: 0, maxzoom: 22, layout: { 'visibility': 'none' } });

            this.isReady = true;
            this.onReady();

        } catch (err) {
            console.error("MapLoadError", err);
            this.onSelectionChange("Failed to load geometry", "");
        }
    };

    private handleMouseMove = (e: maplibregl.MapMouseEvent) => {
        if (!this.hoverEnabled) return this.clearHover();
        const features = this.map.queryRenderedFeatures(e.point, { layers: INTERACTIVE_LAYERS });
        if (features.length === 0) return this.clearHover();

        const top = features[0];
        if (top.id == null || !top.source) return this.clearHover();

        const src = top.source as SourceName;
        if (this.selectedSource === src && String(this.selectedFeatureId) === String(top.id)) return this.clearHover();

        this.map.getCanvas().style.cursor = 'pointer';
        if (this.hoveredStateId !== top.id || this.hoveredSource !== src) {
            this.clearHover();
            this.hoveredStateId = top.id;
            this.hoveredSource = src;
            try { this.map.setFeatureState({ source: src, id: top.id }, { hover: true }); } catch { }
        }
    };

    private clearHover = () => {
        this.map.getCanvas().style.cursor = '';
        if (this.hoveredSource && this.hoveredStateId != null) {
            try { this.map.setFeatureState({ source: this.hoveredSource, id: this.hoveredStateId }, { hover: false }); } catch { }
        }
        this.hoveredSource = null;
        this.hoveredStateId = null;
    };

    private handleClick = (e: maplibregl.MapMouseEvent) => {
        const features = this.map.queryRenderedFeatures(e.point, { layers: INTERACTIVE_LAYERS });
        if (features.length === 0) {
            if (this.selectedFeatureId !== null) this.clearSelection();
            return;
        }
        const top = features[0];
        if (top.id == null || !top.source) return;

        const region = this.regions.find(r => r.source === top.source && String(r.id) === String(top.id));
        if (region) this.focusOnRegion(region);
    };

    public focusOnRegion = (region: RegionIndex) => {
        this.clearHover();
        this.selectedFeatureId = region.id;
        this.selectedSource = region.source;

        this.onSelectionChange(`${region.type}: ${region.name}`, region.name);

        (this.map.getSource('selected-data') as maplibregl.GeoJSONSource)?.setData(region.feature);

        try {
            const worldPolys = turf.polygon([[[179.9, 89.9], [-179.9, 89.9], [-179.9, -89.9], [179.9, -89.9], [179.9, 89.9]]]);
            (this.map.getSource('mask-data') as maplibregl.GeoJSONSource)?.setData(turf.mask(region.feature as any, worldPolys) as any);
        } catch {
            (this.map.getSource('mask-data') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features: [] });
        }

        try {
            const bbox = turf.bbox(region.feature as any);
            const target = this.map.cameraForBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 40 });
            if (!target) return;

            if (region.source === 'continents-data') {
                target.center = turf.centroid(region.feature as any).geometry.coordinates as [number, number];
                target.zoom = (target.zoom ?? 0) + 0.15;
            } else if (region.source === 'countries-data') target.zoom = Math.max(target.zoom ?? 0, 5.0);
            else if (region.source === 'bd-divisions-data') target.zoom = Math.max(target.zoom ?? 0, 6.2);
            else if (region.source === 'bd-districts-data') target.zoom = Math.max(target.zoom ?? 0, 6.8);

            this.map.flyTo({ ...target, duration: 1800, essential: true });
        } catch (e) { console.error(e); }
    };

    public clearSelection = () => {
        this.selectedFeatureId = null;
        this.selectedSource = null;
        this.onSelectionChange('None', '');
        (this.map.getSource('selected-data') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features: [] });
        (this.map.getSource('mask-data') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features: [] });
        this.map.easeTo({ zoom: Math.max(1, this.map.getZoom() - 1.5), duration: 1200, essential: true });
    };

    // Use braces to ensure functions explicitly return 'void' so React useEffects don't panic.
    public setHoverEnabled = (v: boolean) => { this.hoverEnabled = v; if (!v) this.clearHover(); };
    public setAutoRotate = (v: boolean) => { this.autoRotate = v; };
    public setProjection = (v: MapProjection) => { if (this.isReady) (this.map as any).setProjection({ type: v }); };

    public setMapType = (v: MapType) => {
        this.mapType = v;
        if (!this.isReady) return;
        (this.map.getSource('google-raster-base') as maplibregl.RasterTileSource)?.setTiles([v === 'satellite' ? TILES_SATELLITE_BASE : TILES_ROADMAP_BASE]);
        (this.map.getSource('google-raster-labels') as maplibregl.RasterTileSource)?.setTiles([v === 'satellite' ? TILES_LABELS_WITH_BORDERS : TILES_LABELS_PURE_TEXT]);
    };

    public setBaseLabels = (v: boolean) => { if (this.isReady) this.map.setLayoutProperty('google-labels-layer', 'visibility', v ? 'visible' : 'none'); };

    public setBordersAndLabels = (borderMode: BorderMode, labelsVisible: boolean) => {
        this.borderMode = borderMode;
        this.regionLabelsVisible = labelsVisible;
        if (!this.isReady) return;

        const conts = ['continents-borders', 'continents-fill', 'continents-labels'];
        const counts = ['countries-borders', 'countries-fill', 'countries-labels'];
        const divs = ['bd-divisions-borders', 'bd-divisions-fill', 'bd-divisions-labels'];
        const dists = ['bd-districts-borders', 'bd-districts-fill', 'bd-districts-labels'];

        const setLOD = (arr: string[], min: number, max: number) => arr.forEach(l => { if (this.map.getLayer(l)) this.map.setLayerZoomRange(l, min, max); });
        const setVis = (arr: string[], vis: 'visible' | 'none') => arr.forEach(l => {
            if (!this.map.getLayer(l)) return;
            if (l.includes('-labels')) this.map.setLayoutProperty(l, 'visibility', (vis === 'visible' && this.regionLabelsVisible) ? 'visible' : 'none');
            else this.map.setLayoutProperty(l, 'visibility', vis);
        });

        if (this.borderMode === 'auto') {
            setLOD(conts, 1, 3.5); setLOD(counts, 3.5, 5.5); setLOD(divs, 5.5, 6.5); setLOD(dists, 6.5, 22);
            setVis(conts, 'visible'); setVis(counts, 'visible'); setVis(divs, 'visible'); setVis(dists, 'visible');
        } else if (this.borderMode === 'off') {
            setVis(conts, 'none'); setVis(counts, 'none'); setVis(divs, 'none'); setVis(dists, 'none');
        } else {
            setLOD(conts, 0, 22); setLOD(counts, 0, 22); setLOD(divs, 0, 22); setLOD(dists, 0, 22);
            setVis(conts, this.borderMode === 'continents' ? 'visible' : 'none');
            setVis(counts, this.borderMode === 'countries' ? 'visible' : 'none');
            setVis(divs, this.borderMode === 'divisions' ? 'visible' : 'none');
            setVis(dists, this.borderMode === 'districts' ? 'visible' : 'none');
        }
    };

    public cleanup = () => {
        cancelAnimationFrame(this.animationFrameId);
        this.map.remove();
    };
}

// ==========================================
// REACT UI SHELL
// ==========================================

export default function App2() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const engine = useRef<MapEngine | null>(null);

    // UI States
    const [regions, setRegions] = useState<RegionIndex[]>([]);
    const [selectionText, setSelectionText] = useState('Initializing Map...');
    const [searchTerm, setSearchTerm] = useState('');

    // Layout Toggles
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(false);

    // Map States
    const [proj, setProj] = useState<MapProjection>('globe');
    const [mapType, setMapType] = useState<MapType>('satellite');
    const [baseLabels, setBaseLabels] = useState(false);
    const [regionLabels, setRegionLabels] = useState(true);
    const [hover, setHover] = useState(true);
    const [rotate, setRotate] = useState(false);
    const [borderMode, setBorderMode] = useState<BorderMode>('auto');

    useEffect(() => {
        if (!mapContainer.current || engine.current) return;

        engine.current = new MapEngine(mapContainer.current, {
            onReady: () => {
                engine.current?.setBordersAndLabels(borderMode, regionLabels);
            },
            onRegionsLoaded: (loaded) => setRegions(loaded),
            onSelectionChange: (text, input) => {
                setSelectionText(text);
                if (input !== undefined) setSearchTerm(input);
            }
        });

        return () => {
            engine.current?.cleanup();
            engine.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Wrapped inside `{}` to ensure nothing but 'void' is returned to the useEffect
    useEffect(() => { engine.current?.setProjection(proj); }, [proj]);
    useEffect(() => { engine.current?.setMapType(mapType); }, [mapType]);
    useEffect(() => { engine.current?.setBaseLabels(baseLabels); }, [baseLabels]);
    useEffect(() => { engine.current?.setHoverEnabled(hover); }, [hover]);
    useEffect(() => { engine.current?.setAutoRotate(rotate); }, [rotate]);
    useEffect(() => { engine.current?.setBordersAndLabels(borderMode, regionLabels); }, [borderMode, regionLabels]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && document.activeElement?.id !== 'searchInput') engine.current?.clearSelection();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <div className="app" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <div ref={mapContainer} style={{ flex: 1, position: 'absolute', inset: 0, zIndex: 0 }} />

            <div className="header" style={{ position: 'relative', zIndex: 10, display: 'flex', padding: 12, background: '#111', gap: 12 }}>
                <div className="logo" style={{ color: 'white' }}><h1>Hritu</h1></div>
                <SearchBar
                    regions={regions}
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSelect={(r) => engine.current?.focusOnRegion(r)}
                    onEscape={() => engine.current?.clearSelection()}
                    placeholder="Search for a region..."
                />
                <button onClick={() => setLeftOpen(p => !p)}>Toggle Left</button>
                <button onClick={() => setRightOpen(p => !p)}>Toggle Right</button>
            </div>

            <aside className={`sidebar left ${leftOpen ? "open" : ""}`} style={{ position: 'absolute', left: leftOpen ? 0 : -300, top: 60, width: 250, background: '#222', padding: 15, zIndex: 10, color: 'white', transition: 'left 0.3s' }}>
                <div><strong>Map Controls</strong></div>
                <div style={{ marginTop: 12, marginBottom: 6 }}><strong>Selection</strong></div>
                <div style={{ fontSize: 13, marginBottom: 12, color: '#00e5ff' }}>{selectionText}</div>

                <div style={{ marginTop: 12, marginBottom: 6 }}><strong>Borders</strong></div>
                <select value={borderMode} onChange={(e) => setBorderMode(e.target.value as BorderMode)}
                    style={{ width: '100%', padding: '6px', background: '#333', color: '#ddd', border: '1px solid #555', borderRadius: '4px', marginBottom: '12px' }}>
                    <option value="auto">Borders: Auto (LOD)</option>
                    <option value="continents">Borders: Continents</option>
                    <option value="countries">Borders: Countries</option>
                    <option value="divisions">Borders: Divisions</option>
                    <option value="districts">Borders: Districts</option>
                    <option value="off">Borders: All Off</option>
                </select>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button onClick={() => setProj(p => p === 'globe' ? 'mercator' : 'globe')}>
                        {proj === 'globe' ? 'Flat Map' : '3D Globe'}
                    </button>
                    <button onClick={() => setMapType(p => p === 'satellite' ? 'roadmap' : 'satellite')}>
                        {mapType === 'satellite' ? 'Roadmap' : 'Satellite'}
                    </button>
                    <button style={{ background: baseLabels ? '#00e5ff' : '#333', color: baseLabels ? '#000' : '#fff' }} onClick={() => setBaseLabels(p => !p)}>
                        Base Labels: {baseLabels ? 'On' : 'Off'}
                    </button>
                    <button style={{ background: regionLabels ? '#00e5ff' : '#333', color: regionLabels ? '#000' : '#fff' }} onClick={() => setRegionLabels(p => !p)}>
                        Region Labels: {regionLabels ? 'On' : 'Off'}
                    </button>
                    <button style={{ background: hover ? '#00e5ff' : '#333', color: hover ? '#000' : '#fff' }} onClick={() => setHover(p => !p)}>
                        Hover: {hover ? 'On' : 'Off'}
                    </button>
                    <button style={{ background: rotate ? '#00e5ff' : '#333', color: rotate ? '#000' : '#fff' }} onClick={() => setRotate(p => !p)}>
                        Rotate: {rotate ? 'On' : 'Off'}
                    </button>
                </div>
            </aside>
            <aside className={`sidebar right ${rightOpen ? "open" : ""}`} style={{ position: 'absolute', right: rightOpen ? 0 : -300, top: 60, width: 250, background: '#222', padding: 15, zIndex: 10, color: 'white', transition: 'right 0.3s' }}>
                Right Sidebar
            </aside>
        </div>
    );
}
