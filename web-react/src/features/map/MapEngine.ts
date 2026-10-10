import maplibregl, {
    type GeoJSONSource, type Map as MapLibreMap,
} from "maplibre-gl";
import * as turf from "@turf/turf";
import { REGIONS, TILES, INITIAL_VIEW, THEME } from "./map.config";
import type {
    MapData, RegionCollection, RegionFeature, SearchItem, SourceName, SelectedRegion,
} from "../../lib/types";

maplibregl.addProtocol("cached-tile", async (params, abortController) => {
    const CACHE_NAME = "hritu-raster-tiles-v1";
    const realUrl = params.url.replace("cached-tile://", "");
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(realUrl);
        if (cachedResponse) return { data: await cachedResponse.arrayBuffer() };

        const response = await fetch(realUrl, { signal: abortController.signal });
        if (response.ok) {
            const clone = response.clone();
            cache.put(realUrl, clone).catch(() => { });
            return { data: await response.arrayBuffer() };
        }
        throw new Error("Tile fetch failed");
    } catch (e) {
        return { data: null };
    }
});

const interactiveLayers = [
    "continents-fill", "countries-fill", "bd-divisions-fill", "bd-districts-fill",
    "continents-labels", "countries-labels", "bd-divisions-labels", "bd-districts-labels",
];

const empty_collection = (): RegionCollection => ({ type: "FeatureCollection", features: [] });

const make_point_collection = (collection: RegionCollection): RegionCollection => {
    return {
        type: "FeatureCollection",
        features: collection.features.flatMap((feature, index) => {
            try {
                const point = turf.centroid(feature);
                point.properties = feature.properties ?? {};
                point.id = index;
                return [point];
            } catch { return []; }
        }),
    } as RegionCollection;
};

const source_for_type = (type: SearchItem["type"]): SourceName => {
    if (type === "Continent") return "continents-data";
    if (type === "Country") return "countries-data";
    if (type === "Division") return "bd-divisions-data";
    return "bd-districts-data";
};

const get_name = (feature: RegionFeature, type: SearchItem["type"]): string => {
    const properties = feature.properties ?? {};
    if (type === "Continent") return String(properties.CONTINENT ?? "Unknown");
    if (type === "Country") return String(properties.ADMIN ?? properties.NAME ?? "Unknown");
    if (type === "Division") return String(properties.name ?? properties.NAME ?? "Unknown");
    return String(properties.ADM2_EN ?? properties.NAME_2 ?? properties.name ?? "Unknown");
};

export class MapEngine {
    readonly map: MapLibreMap;
    data: MapData | null = null;
    searchIndex: SearchItem[] = [];

    private hoveredStateId: string | number | null = null;
    private hoveredSource: SourceName | null = null;
    private activeSelectionKeys = new Set<string>(); // Tracks multiple selections

    private hoverEnabled = true;
    private isAnimating = false;
    private userInteracting = false;
    private rotationFrame: number | null = null;
    private autoRotate = false;

    onSelectionChange?: (label: string) => void;
    onLoadingChange?: (loading: boolean) => void;
    public onRegionSelect?: (region: SelectedRegion | null) => void;

    constructor(container: HTMLElement) {
        this.map = new maplibregl.Map({
            container,
            attributionControl: false,
            maxTileCacheSize: 500,
            style: {
                version: 8,
                glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
                sources: {
                    "google-raster-base": { type: "raster", tiles: [TILES.SATELLITE], tileSize: 256 },
                },
                layers: [
                    { id: "globe-ocean-base", type: "background", paint: { "background-color": "#0a2242" } },
                    { id: "google-base-layer", type: "raster", source: "google-raster-base", minzoom: 0, maxzoom: 22, paint: { "raster-fade-duration": 400 } },
                ],
                projection: { type: "globe" },
                sky: {
                    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 2, 4, 0.8, 6, 0],
                    "sky-color": "#199EF3",
                    "horizon-color": "#ffffff"
                }
            },
            center: [INITIAL_VIEW.center[0] - 90, INITIAL_VIEW.center[1] - 15],
            zoom: 0.5,
            minZoom: 0,
            maxZoom: 10,
            pitch: 0,
            bearing: 0,
        });

        this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
        this.map.on("moveend", () => { this.isAnimating = false; });

        for (const evt of ["mousedown", "dragstart", "touchstart", "zoomstart"]) {
            this.map.on(evt, () => (this.userInteracting = true));
        }
        for (const evt of ["mouseup", "dragend", "touchend", "zoomend"]) {
            this.map.on(evt, () => (this.userInteracting = false));
        }
    }

    private async fetchWithCache(url: string): Promise<any> {
        const CACHE_NAME = "hritu-geo-cache-v1";
        try {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(url);
            if (cachedResponse) return await cachedResponse.json();
            const response = await fetch(url);
            if (response.ok) await cache.put(url, response.clone());
            return await response.json();
        } catch (e) {
            return await (await fetch(url)).json();
        }
    }

    async load(): Promise<void> {
        this.onLoadingChange?.(true);
        try {
            const [continents, countries, rawStates, districts] = await Promise.all([
                this.fetchWithCache(REGIONS.CONTINENT.url),
                this.fetchWithCache(REGIONS.COUNTRY.url),
                this.fetchWithCache(REGIONS.DIVISION.url),
                this.fetchWithCache(REGIONS.DISTRICT.url),
            ]);

            const divisions: RegionCollection = {
                type: "FeatureCollection",
                features: rawStates.features.filter((f: any) => {
                    const p = f.properties ?? {};
                    return p.adm0_a3 === "BGD" || p.admin === "Bangladesh";
                }),
            };

            [continents, countries, divisions, districts].forEach(collection => {
                collection.features.forEach((f, i) => { f.id = i; });
            });

            this.data = { continents, countries, divisions, districts };
            this.addSourcesAndLayers();
            this.setupInteractions();
            this.onLoadingChange?.(false);

            setTimeout(() => {
                this.isAnimating = true;
                this.map.flyTo({ center: INITIAL_VIEW.center, zoom: INITIAL_VIEW.zoom, duration: 3500, curve: 1.2, essential: true });
                this.map.once("moveend", () => { this.isAnimating = false; });
                this.spinGlobe();
            }, 100);

            setTimeout(() => {
                this.buildSearchIndex();
                this.onLoadingChange?.(false);
            }, 100);
        } catch (error) {
            console.error("Map Data Load Error", error);
            this.onLoadingChange?.(false);
        }
    }

    private buildSearchIndex() {
        if (!this.data) return;
        const entries: SearchItem[] = [];
        const groups: Array<[RegionCollection, SearchItem["type"]]> = [
            [this.data.continents, "Continent"], [this.data.countries, "Country"],
            [this.data.divisions, "Division"], [this.data.districts, "District"],
        ];

        for (const [collection, type] of groups) {
            collection.features.forEach((feature, index) => {
                feature.id = index;
                const name = get_name(feature, type);
                entries.push({ id: index, source: source_for_type(type), type, name: type === "Division" ? `${name} Division` : name, feature });
            });
        }
        entries.sort((a, b) => a.name.localeCompare(b.name));
        this.searchIndex = entries;
    }

    private addSourcesAndLayers() {
        if (!this.data) return;
        const { continents, countries, divisions, districts } = this.data;

        this.map.addSource("continents-data", { type: "geojson", data: continents });
        this.map.addSource("countries-data", { type: "geojson", data: countries });
        this.map.addSource("bd-divisions-data", { type: "geojson", data: divisions });
        this.map.addSource("bd-districts-data", { type: "geojson", data: districts });

        this.map.addSource("continents-points", { type: "geojson", data: make_point_collection(continents) });
        this.map.addSource("countries-points", { type: "geojson", data: make_point_collection(countries) });
        this.map.addSource("bd-divisions-points", { type: "geojson", data: make_point_collection(divisions) });
        this.map.addSource("bd-districts-points", { type: "geojson", data: make_point_collection(districts) });

        this.map.addSource("selected-data", { type: "geojson", data: empty_collection() });
        this.map.addSource("mask-data", { type: "geojson", data: empty_collection() });

        this.addLayers();
    }

    private addLayers() {
        const hoverPaint = {
            "fill-color": THEME.hoverFill,
            "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], THEME.hoverOpacity, 0] as maplibregl.ExpressionSpecification,
        };

        this.map.addLayer({ id: "continents-fill", type: "fill", source: "continents-data", minzoom: REGIONS.CONTINENT.zoom.min, maxzoom: REGIONS.CONTINENT.zoom.max, paint: hoverPaint });
        this.map.addLayer({ id: "countries-fill", type: "fill", source: "countries-data", minzoom: REGIONS.COUNTRY.zoom.min, maxzoom: REGIONS.COUNTRY.zoom.max, paint: hoverPaint });
        this.map.addLayer({ id: "bd-divisions-fill", type: "fill", source: "bd-divisions-data", minzoom: REGIONS.DIVISION.zoom.min, maxzoom: REGIONS.DIVISION.zoom.max, paint: hoverPaint });
        this.map.addLayer({ id: "bd-districts-fill", type: "fill", source: "bd-districts-data", minzoom: REGIONS.DISTRICT.zoom.min, paint: hoverPaint });

        this.map.addLayer({ id: "continents-borders", type: "line", source: "continents-data", minzoom: REGIONS.CONTINENT.zoom.min, maxzoom: REGIONS.CONTINENT.zoom.max, paint: { "line-color": REGIONS.CONTINENT.color, "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.5, 3.5, 1.5], "line-opacity": 0.35 } });
        this.map.addLayer({ id: "countries-borders", type: "line", source: "countries-data", minzoom: REGIONS.COUNTRY.zoom.min, maxzoom: REGIONS.COUNTRY.zoom.max, paint: { "line-color": REGIONS.COUNTRY.color, "line-width": ["interpolate", ["linear"], ["zoom"], 3.5, 0.5, 5.5, 1.5], "line-opacity": 0.5 } });
        this.map.addLayer({ id: "bd-divisions-borders", type: "line", source: "bd-divisions-data", minzoom: REGIONS.DIVISION.zoom.min, maxzoom: REGIONS.DIVISION.zoom.max, paint: { "line-color": REGIONS.DIVISION.color, "line-width": ["interpolate", ["linear"], ["zoom"], 5.5, 0.75, 6.5, 1.5], "line-opacity": 1, "line-dasharray": [3, 2] } });
        this.map.addLayer({ id: "bd-borders", type: "line", source: "bd-districts-data", minzoom: REGIONS.DISTRICT.zoom.min, paint: { "line-color": REGIONS.DISTRICT.color, "line-width": ["interpolate", ["linear"], ["zoom"], 6.5, 0.75, 10, 2], "line-opacity": 1, "line-dasharray": [2, 2] } });

        this.map.addLayer({ id: "mask-layer", type: "fill", source: "mask-data", paint: { "fill-color": "#000000", "fill-opacity": 0.65 } });

        // NEW FIX: Fill regions with colors (Highly visible in Compare Mode)
        this.map.addLayer({
            id: "selected-fill",
            type: "fill",
            source: "selected-data",
            paint: {
                "fill-color": ["coalesce", ["get", "highlightColor"], "#00e5ff"],
                "fill-opacity": 0.25,
            },
        });

        // Dynamically colors the border based on the region badge!
        this.map.addLayer({
            id: "selected-border",
            type: "line",
            source: "selected-data",
            paint: {
                "line-color": ["coalesce", ["get", "highlightColor"], "#00e5ff"],
                "line-width": 2.5,
                "line-opacity": 1,
            },
        });

        const labels = [
            { id: "continents-labels", source: "continents-points", minzoom: REGIONS.CONTINENT.zoom.min, maxzoom: REGIONS.CONTINENT.zoom.max, text: ["get", "CONTINENT"], color: REGIONS.CONTINENT.color, size: ["interpolate", ["linear"], ["zoom"], 1, 10, 3.5, 24] },
            { id: "countries-labels", source: "countries-points", minzoom: REGIONS.COUNTRY.zoom.min, maxzoom: REGIONS.COUNTRY.zoom.max, text: ["coalesce", ["get", "ADMIN"], ["get", "NAME"], "Unknown"], color: REGIONS.COUNTRY.color, size: ["interpolate", ["linear"], ["zoom"], 3.5, 11, 5.5, 20] },
            { id: "bd-divisions-labels", source: "bd-divisions-points", minzoom: REGIONS.DIVISION.zoom.min, maxzoom: REGIONS.DIVISION.zoom.max, text: ["coalesce", ["get", "name"], ["get", "NAME"], "Unknown"], color: REGIONS.DIVISION.color, size: ["interpolate", ["linear"], ["zoom"], 5.5, 11, 6.5, 18] },
            { id: "bd-districts-labels", source: "bd-districts-points", minzoom: REGIONS.DISTRICT.zoom.min, text: ["coalesce", ["get", "ADM2_EN"], ["get", "NAME_2"], ["get", "name"], "Unknown"], color: REGIONS.DISTRICT.color, size: ["interpolate", ["linear"], ["zoom"], 6.5, 12, 10, 22] },
        ] as const;

        for (const label of labels) {
            this.map.addLayer({
                id: label.id, type: "symbol", source: label.source, minzoom: label.minzoom, ...(label.maxzoom ? { maxzoom: label.maxzoom } : {}),
                layout: { "text-field": label.text, "text-font": ["Noto Sans Medium"], "text-size": label.size, visibility: "visible" },
                paint: { "text-color": label.color, "text-halo-color": "rgba(0,0,0,0.65)", "text-halo-width": 1.5 },
            });
        }

        this.map.addSource("google-raster-labels", { type: "raster", tiles: [`cached-tile://${TILES.LABELS_BORDERS}`], tileSize: 256 });
        this.map.addLayer({ id: "google-labels-layer", type: "raster", source: "google-raster-labels", minzoom: 0, maxzoom: 22, layout: { visibility: "none" }, paint: { "raster-fade-duration": 400 } });
    }

    private setupInteractions() {
        this.map.on("mousemove", (e) => {
            if (!this.hoverEnabled) return;
            const features = this.map.queryRenderedFeatures(e.point, { layers: interactiveLayers });
            if (!features.length) { this.clearHover(); return; }

            const feature = features[0];
            const source = feature.source.replace("-points", "-data") as SourceName;
            const id = feature.id;

            if (id == null) return;
            if (this.activeSelectionKeys.has(`${source}-${id}`)) { this.clearHover(); return; }

            this.map.getCanvas().style.cursor = "pointer";
            if (id !== this.hoveredStateId || source !== this.hoveredSource) {
                this.clearHover();
                this.hoveredStateId = id;
                this.hoveredSource = source;
                this.map.setFeatureState({ source, id }, { hover: true });
            }
        });

        this.map.on("mouseout", () => this.clearHover());

        this.map.on("click", (e) => {
            const features = this.map.queryRenderedFeatures(e.point, { layers: interactiveLayers });

            if (!features.length) {
                if (this.activeSelectionKeys.size > 0) this.clearSelection(true);
                return;
            }

            const top = features[0];
            const id = top.id;
            const source = top.source.replace("-points", "-data") as SourceName;
            if (id == null || !this.data) return;

            const lookup: Record<SourceName, [RegionCollection, SearchItem["type"]]> = {
                "continents-data": [this.data.continents, "Continent"],
                "countries-data": [this.data.countries, "Country"],
                "bd-divisions-data": [this.data.divisions, "Division"],
                "bd-districts-data": [this.data.districts, "District"],
            };

            const [collection, type] = lookup[source];
            const feature = collection.features[Number(id)] as RegionFeature | undefined;
            if (!feature) return;

            let lat = 0; let lon = 0;
            try {
                const centroid = turf.centroid(feature);
                [lon, lat] = centroid.geometry.coordinates;
            } catch { }

            this.clearHover();
            this.onRegionSelect?.({
                id, name: get_name(feature, type), type, lat, lon, source, feature,
            });
        });
    }

    private clearHover() {
        this.map.getCanvas().style.cursor = "";
        if (this.hoveredStateId !== null && this.hoveredSource !== null) {
            this.map.setFeatureState({ source: this.hoveredSource, id: this.hoveredStateId }, { hover: false });
        }
        this.hoveredStateId = null;
        this.hoveredSource = null;
    }

    // Handles the core drawing and camera logic safely
    public updateSelection(regions: SelectedRegion[], colors: string[], isNewRegionAdded: boolean) {
        this.activeSelectionKeys = new Set(regions.map(r => `${r.source}-${r.id}`));

        const selected = this.map.getSource("selected-data") as GeoJSONSource | undefined;
        const maskSource = this.map.getSource("mask-data") as GeoJSONSource | undefined;
        if (!selected || !maskSource) return;

        if (regions.length === 0) {
            selected.setData(empty_collection() as never);
            maskSource.setData(empty_collection() as never);
            if (this.map.getLayer("selected-fill")) {
                this.map.setPaintProperty("selected-fill", "fill-opacity", 0);
            }
            this.onSelectionChange?.("None");
            return;
        }

        // Apply UI colors to map borders
        const features = regions.map((r, i) => {
            const f = { ...r.feature };
            f.properties = { ...f.properties, highlightColor: colors[i % colors.length] };
            return f;
        });
        selected.setData({ type: "FeatureCollection", features } as never);

        // FIX: Toggle fill opacity based on mode. Invisible for single (mask handles it), visible for compare!
        if (this.map.getLayer("selected-fill")) {
            this.map.setPaintProperty("selected-fill", "fill-opacity", regions.length > 1 ? 0.25 : 0);
        }

        // ORIGINAL MASK LOGIC (Only when 1 region is selected to prevent graphic glitching)
        if (regions.length === 1) {
            const feature = features[0];
            try {
                const worldRing = [[180, 90], [180, -90], [-180, -90], [-180, 90], [180, 90]];
                const coordinates: number[][][] = [worldRing];
                if (feature.geometry.type === "Polygon") {
                    coordinates.push(...feature.geometry.coordinates as number[][][]);
                } else if (feature.geometry.type === "MultiPolygon") {
                    feature.geometry.coordinates.forEach((poly: any) => coordinates.push(...poly));
                }
                maskSource.setData({ type: "Feature", geometry: { type: "Polygon", coordinates }, properties: {} } as never);
            } catch {
                maskSource.setData(empty_collection() as never);
            }
        } else {
            maskSource.setData(empty_collection() as never);
        }

        // ORIGINAL CAMERA MATH (Only flies if a NEW region was just added)
        if (isNewRegionAdded && regions.length > 0) {
            const latest = regions[regions.length - 1];
            const bbox = turf.bbox(latest.feature);
            const camera = this.map.cameraForBounds(
                [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
                { padding: 60 }
            );

            if (camera) {
                if (latest.source === "continents-data") {
                    try {
                        const centroid = turf.centroid(latest.feature);
                        camera.center = centroid.geometry.coordinates as [number, number];
                        camera.zoom += 0.15;
                    } catch { }
                }
                this.isAnimating = true;
                this.map.flyTo({ ...camera, duration: 1800, essential: true });
            }
        }

        if (regions.length === 1) this.onSelectionChange?.(`${regions[0].type}: ${regions[0].name}`);
        else this.onSelectionChange?.(`Comparing ${regions.length} Regions`);
    }

    clearSelection(zoomOut = false) {
        if (zoomOut && this.activeSelectionKeys.size > 0) {
            this.isAnimating = true;
            this.map.easeTo({
                zoom: Math.max(INITIAL_VIEW.zoom, this.map.getZoom() - 1.5),
                duration: 1200,
                essential: true,
            });
        }
        this.onRegionSelect?.(null);
    }

    setHoverEnabled(enabled: boolean) { this.hoverEnabled = enabled; if (!enabled) this.clearHover(); }
    setAutoRotate(enabled: boolean) { this.autoRotate = enabled; }
    private spinGlobe() {
        if (this.autoRotate && !this.userInteracting && !this.isAnimating && this.activeSelectionKeys.size === 0 && this.map.getProjection().type === "globe") {
            const center = this.map.getCenter();
            center.lng -= 0.1;
            this.map.jumpTo({ center });
        }
        this.rotationFrame = requestAnimationFrame(() => this.spinGlobe());
    }

    setProjection(projection: "globe" | "mercator") { this.map.setProjection({ type: projection }); }
    setBaseMap(baseMap: "roadmap" | "satellite") {
        const base = this.map.getSource("google-raster-base") as maplibregl.RasterTileSource;
        base.setTiles([`cached-tile://${baseMap === "satellite" ? TILES.SATELLITE : TILES.ROADMAP}`]);
        const labels = this.map.getSource("google-raster-labels") as maplibregl.RasterTileSource;
        labels?.setTiles([`cached-tile://${baseMap === "satellite" ? TILES.LABELS_BORDERS : TILES.LABELS_TEXT}`]);
    }
    setBaseLabels(visible: boolean) { if (this.map.getLayer("google-labels-layer")) this.map.setLayoutProperty("google-labels-layer", "visibility", visible ? "visible" : "none"); }
    setCustomLabels(visible: boolean) {
        const ids = ["continents-labels", "countries-labels", "bd-divisions-labels", "bd-districts-labels"];
        for (const id of ids) { if (this.map.getLayer(id)) this.map.setLayoutProperty(id, "visibility", visible ? "visible" : "none"); }
    }

    setBorderMode(mode: "auto" | "continents" | "countries" | "division" | "districts" | "off") {
        const groups = {
            continents: ["continents-borders", "continents-fill", "continents-labels"], countries: ["countries-borders", "countries-fill", "countries-labels"],
            division: ["bd-divisions-borders", "bd-divisions-fill", "bd-divisions-labels"], districts: ["bd-borders", "bd-districts-fill", "bd-districts-labels"],
        };
        const setVisibility = (ids: string[], visibility: "visible" | "none") => { ids.forEach((id) => { if (this.map.getLayer(id)) this.map.setLayoutProperty(id, "visibility", visibility); }); };
        const setZoom = (ids: string[], min: number, max: number) => { ids.forEach((id) => { if (this.map.getLayer(id)) this.map.setLayerZoomRange(id, min, max); }); };
        if (mode === "auto") {
            setZoom(groups.continents, REGIONS.CONTINENT.zoom.min, REGIONS.CONTINENT.zoom.max); setZoom(groups.countries, REGIONS.COUNTRY.zoom.min, REGIONS.COUNTRY.zoom.max);
            setZoom(groups.division, REGIONS.DIVISION.zoom.min, REGIONS.DIVISION.zoom.max); setZoom(groups.districts, REGIONS.DISTRICT.zoom.min, REGIONS.DISTRICT.zoom.max);
            Object.values(groups).forEach((g) => setVisibility(g, "visible")); return;
        }
        if (mode === "off") { Object.values(groups).forEach((g) => setVisibility(g, "none")); return; }
        Object.values(groups).forEach((g) => setZoom(g, 0, 22));
        (Object.entries(groups) as Array<[keyof typeof groups, string[]]>).forEach(([key, ids]) => { setVisibility(ids, key === mode ? "visible" : "none"); });
    }

    reset() {
        this.clearSelection();
        this.isAnimating = true;
        this.map.flyTo({ center: INITIAL_VIEW.center, zoom: INITIAL_VIEW.zoom, pitch: 0, bearing: 0, duration: 2000, essential: true });
    }

    destroy() {
        if (this.rotationFrame !== null) cancelAnimationFrame(this.rotationFrame);
        this.map.remove();
    }
}
