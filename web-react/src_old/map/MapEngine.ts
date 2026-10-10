import * as maplibregl from "maplibre-gl";
import {
    type GeoJSONSource,
    type Map as MapLibreMap,
    type MapGeoJSONFeature,
} from "maplibre-gl";
import * as turf from "@turf/turf";
import {
    BD_URL,
    CONTINENTS_URL,
    COUNTRIES_URL,
    INITIAL_VIEW,
    STATES_URL,
    TILES_DEFAULT_BASE,
    TILES_LABELS_PURE_TEXT,
    TILES_LABELS_WITH_BORDERS,
    TILES_SATELLITE_BASE,
    THEME,
} from "../mapConfig";
import type {
    MapData,
    RegionCollection,
    RegionFeature,
    SearchItem,
    SourceName,
} from "../types";

const interactiveLayers = [
    "bd-fill",
    "bd-divisions-fill",
    "countries-fill",
    "continents-fill",
    "bd-labels",
    "bd-divisions-labels",
    "countries-labels",
    "continents-labels",
];

const emptyCollection = (): RegionCollection => ({
    type: "FeatureCollection",
    features: [],
});

function makePointCollection(collection: RegionCollection): RegionCollection {
    return {
        type: "FeatureCollection",
        features: collection.features.flatMap((feature, index) => {
            try {
                const point = turf.centroid(feature);
                point.properties = feature.properties ?? {};
                point.id = index;
                return [point];
            } catch {
                return [];
            }
        }),
    } as RegionCollection;
}

function sourceForType(type: SearchItem["type"]): SourceName {
    if (type === "Continent") return "continents-data";
    if (type === "Country") return "countries-data";
    if (type === "Division") return "bd-divisions-data";
    return "bd-data";
}

function getName(feature: RegionFeature, type: SearchItem["type"]): string {
    const p = feature.properties ?? {};
    if (type === "Continent") return String(p.CONTINENT ?? "Unknown");
    if (type === "Country") return String(p.ADMIN ?? p.NAME ?? "Unknown");
    if (type === "Division") return String(p.name ?? p.NAME ?? "Unknown");
    return String(p.ADM2_EN ?? p.NAME_2 ?? p.name ?? "Unknown");
}

export class MapEngine {
    readonly map: MapLibreMap;
    data: MapData | null = null;
    searchIndex: SearchItem[] = [];

    private hoveredStateId: string | number | null = null;
    private hoveredSource: SourceName | null = null;
    private selectedFeatureId: string | number | null = null;
    private selectedSource: SourceName | null = null;
    private hoverEnabled = true;
    private isAnimating = false;
    private userInteracting = false;
    private rotationFrame: number | null = null;
    private autoRotate = false;

    onSelectionChange?: (label: string) => void;
    onLoadingChange?: (loading: boolean) => void;

    constructor(container: HTMLElement) {
        this.map = new maplibregl.Map({
            container,
            attributionControl: false,
            style: {
                version: 8,
                glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
                sources: {
                    "google-raster-base": {
                        type: "raster",
                        tiles: [TILES_SATELLITE_BASE],
                        tileSize: 256,
                    },
                },
                layers: [
                    {
                        id: "google-base-layer",
                        type: "raster",
                        source: "google-raster-base",
                        minzoom: 0,
                        maxzoom: 22,
                    },
                ],
            },
            center: INITIAL_VIEW.center,
            zoom: INITIAL_VIEW.zoom,
            minZoom: 1,
            maxZoom: 14,
            pitch: 0,
            bearing: 0,
            projection: { type: "globe" },
        });

        this.map.addControl(
            new maplibregl.NavigationControl({ showCompass: false }),
            "bottom-right",
        );

        this.map.on("moveend", () => {
            this.isAnimating = false;
        });

        for (const evt of ["mousedown", "dragstart", "touchstart", "zoomstart"]) {
            this.map.on(evt, () => (this.userInteracting = true));
        }
        for (const evt of ["mouseup", "dragend", "touchend", "zoomend"]) {
            this.map.on(evt, () => (this.userInteracting = false));
        }
    }

    async load(): Promise<void> {
        this.onLoadingChange?.(true);
        try {
            const [contRes, countryRes, statesRes, bdRes] = await Promise.all([
                fetch(CONTINENTS_URL),
                fetch(COUNTRIES_URL),
                fetch(STATES_URL),
                fetch(BD_URL),
            ]);
            if (![contRes, countryRes, statesRes, bdRes].every((r) => r.ok)) {
                throw new Error("One or more geography datasets failed to load.");
            }

            const continents = (await contRes.json()) as RegionCollection;
            const countries = (await countryRes.json()) as RegionCollection;
            const rawStates = (await statesRes.json()) as RegionCollection;
            const districts = (await bdRes.json()) as RegionCollection;

            const divisions: RegionCollection = {
                type: "FeatureCollection",
                features: rawStates.features.filter((f) => {
                    const p = f.properties ?? {};
                    return p.adm0_a3 === "BGD" || p.admin === "Bangladesh";
                }),
            };

            this.data = { continents, countries, divisions, districts };
            this.buildSearchIndex();
            this.addSourcesAndLayers();
            this.setupInteractions();
            this.spinGlobe();
        } finally {
            this.onLoadingChange?.(false);
        }
    }

    private buildSearchIndex() {
        if (!this.data) return;
        const entries: SearchItem[] = [];

        const groups: Array<[RegionCollection, SearchItem["type"]]> = [
            [this.data.continents, "Continent"],
            [this.data.countries, "Country"],
            [this.data.divisions, "Division"],
            [this.data.districts, "District"],
        ];

        for (const [collection, type] of groups) {
            collection.features.forEach((feature, index) => {
                feature.id = index;
                const name = getName(feature, type);
                entries.push({
                    id: index,
                    source: sourceForType(type),
                    type,
                    name: type === "Division" ? `${name} Division` : name,
                    feature,
                });
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
        this.map.addSource("bd-data", { type: "geojson", data: districts });

        this.map.addSource("continents-points", {
            type: "geojson",
            data: makePointCollection(continents),
        });
        this.map.addSource("countries-points", {
            type: "geojson",
            data: makePointCollection(countries),
        });
        this.map.addSource("bd-divisions-points", {
            type: "geojson",
            data: makePointCollection(divisions),
        });
        this.map.addSource("bd-points", {
            type: "geojson",
            data: makePointCollection(districts),
        });

        this.map.addSource("selected-data", { type: "geojson", data: emptyCollection() });
        this.map.addSource("mask-data", { type: "geojson", data: emptyCollection() });

        this.addLayers();
    }

    private addLayers() {
        const hoverOpacity = THEME.hoverOpacity;
        const hoverPaint = {
            "fill-color": THEME.hoverFill,
            "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                hoverOpacity,
                0,
            ] as maplibregl.ExpressionSpecification,
        };

        this.map.addLayer({
            id: "continents-fill",
            type: "fill",
            source: "continents-data",
            minzoom: 1,
            maxzoom: 3.5,
            paint: hoverPaint,
        });
        this.map.addLayer({
            id: "countries-fill",
            type: "fill",
            source: "countries-data",
            minzoom: 3.5,
            maxzoom: 5.5,
            paint: hoverPaint,
        });
        this.map.addLayer({
            id: "bd-divisions-fill",
            type: "fill",
            source: "bd-divisions-data",
            minzoom: 5.5,
            maxzoom: 6.5,
            paint: hoverPaint,
        });
        this.map.addLayer({
            id: "bd-fill",
            type: "fill",
            source: "bd-data",
            minzoom: 6.5,
            paint: hoverPaint,
        });

        this.map.addLayer({
            id: "continents-borders",
            type: "line",
            source: "continents-data",
            minzoom: 1,
            maxzoom: 3.5,
            paint: {
                "line-color": THEME.continentBorder,
                "line-width": ["interpolate", ["linear"], ["zoom"], 1, 1, 3.5, 2.5],
            },
        });
        this.map.addLayer({
            id: "countries-borders",
            type: "line",
            source: "countries-data",
            minzoom: 3.5,
            maxzoom: 5.5,
            paint: {
                "line-color": THEME.countryBorder,
                "line-width": ["interpolate", ["linear"], ["zoom"], 3.5, 0.5, 5.5, 2.5],
            },
        });
        this.map.addLayer({
            id: "bd-divisions-borders",
            type: "line",
            source: "bd-divisions-data",
            minzoom: 5.5,
            maxzoom: 6.5,
            paint: {
                "line-color": THEME.divisionBorder,
                "line-width": ["interpolate", ["linear"], ["zoom"], 5.5, 1, 6.5, 2.5],
            },
        });
        this.map.addLayer({
            id: "bd-borders",
            type: "line",
            source: "bd-data",
            minzoom: 6.5,
            paint: {
                "line-color": THEME.bdBorder,
                "line-width": ["interpolate", ["linear"], ["zoom"], 6.5, 1, 10, 3.5],
            },
        });

        this.map.addLayer({
            id: "mask-layer",
            type: "fill",
            source: "mask-data",
            paint: { "fill-color": "#000000", "fill-opacity": 0.65 },
        });
        this.map.addLayer({
            id: "selected-border",
            type: "line",
            source: "selected-data",
            paint: {
                "line-color": "#00e5ff",
                "line-width": 3.5,
                "line-opacity": 1,
            },
        });

        const labels = [
            {
                id: "continents-labels",
                source: "continents-points",
                minzoom: 1,
                maxzoom: 3.5,
                text: ["get", "CONTINENT"],
                color: THEME.continentBorder,
                size: ["interpolate", ["linear"], ["zoom"], 1, 10, 3.5, 24],
            },
            {
                id: "countries-labels",
                source: "countries-points",
                minzoom: 3.5,
                maxzoom: 5.5,
                text: ["coalesce", ["get", "ADMIN"], ["get", "NAME"], "Unknown"],
                color: THEME.countryBorder,
                size: ["interpolate", ["linear"], ["zoom"], 3.5, 11, 5.5, 20],
            },
            {
                id: "bd-divisions-labels",
                source: "bd-divisions-points",
                minzoom: 5.5,
                maxzoom: 6.5,
                text: ["coalesce", ["get", "name"], ["get", "NAME"], "Unknown"],
                color: THEME.divisionBorder,
                size: ["interpolate", ["linear"], ["zoom"], 5.5, 11, 6.5, 18],
            },
            {
                id: "bd-labels",
                source: "bd-points",
                minzoom: 6.5,
                text: ["coalesce", ["get", "ADM2_EN"], ["get", "NAME_2"], ["get", "name"], "Unknown"],
                color: THEME.bdBorder,
                size: ["interpolate", ["linear"], ["zoom"], 6.5, 12, 10, 22],
            },
        ] as const;

        for (const label of labels) {
            this.map.addLayer({
                id: label.id,
                type: "symbol",
                source: label.source,
                minzoom: label.minzoom,
                ...(label.maxzoom ? { maxzoom: label.maxzoom } : {}),
                layout: {
                    "text-field": label.text,
                    "text-font": ["Noto Sans Medium"],
                    "text-size": label.size,
                    visibility: "visible",
                },
                paint: {
                    "text-color": label.color,
                    "text-halo-color": "rgba(0,0,0,0.85)",
                    "text-halo-width": 1.5,
                },
            });
        }

        this.map.addSource("google-raster-labels", {
            type: "raster",
            tiles: [TILES_LABELS_WITH_BORDERS],
            tileSize: 256,
        });
        this.map.addLayer({
            id: "google-labels-layer",
            type: "raster",
            source: "google-raster-labels",
            minzoom: 0,
            maxzoom: 22,
            layout: { visibility: "none" },
        });
    }

    private setupInteractions() {
        this.map.on("mousemove", (e) => {
            if (!this.hoverEnabled) return;
            const features = this.map.queryRenderedFeatures(e.point, {
                layers: interactiveLayers,
            });
            if (!features.length) {
                this.clearHover();
                return;
            }

            const feature = features[0];
            const source = feature.source.replace("-points", "-data") as SourceName;
            const id = feature.id;

            if (id == null) return;
            if (id === this.selectedFeatureId && source === this.selectedSource) {
                this.clearHover();
                return;
            }

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
            const features = this.map.queryRenderedFeatures(e.point, {
                layers: interactiveLayers,
            });

            if (!features.length) {
                if (this.selectedFeatureId !== null) this.clearSelection(true);
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
                "bd-data": [this.data.districts, "District"],
            };

            const [collection, type] = lookup[source];
            const feature = collection.features[Number(id)] as RegionFeature | undefined;
            if (!feature) return;

            const name = getName(feature, type);
            this.focusOnFeature(feature, source, id, `${type}: ${name}`);
        });
    }

    private clearHover() {
        this.map.getCanvas().style.cursor = "";
        if (this.hoveredStateId !== null && this.hoveredSource !== null) {
            this.map.setFeatureState(
                { source: this.hoveredSource, id: this.hoveredStateId },
                { hover: false },
            );
        }
        this.hoveredStateId = null;
        this.hoveredSource = null;
    }

    focusOnFeature(feature: RegionFeature, source: SourceName, id: string | number, label: string) {
        this.clearHover();
        this.selectedFeatureId = id;
        this.selectedSource = source;

        const selected = this.map.getSource("selected-data") as GeoJSONSource;
        const maskSource = this.map.getSource("mask-data") as GeoJSONSource;
        selected.setData(feature as never);

        try {
            const world = turf.polygon([[
                [179.9, 89.9],
                [-179.9, 89.9],
                [-179.9, -89.9],
                [179.9, -89.9],
                [179.9, 89.9],
            ]]);
            maskSource.setData(turf.mask(feature, world) as never);
        } catch {
            maskSource.setData(emptyCollection() as never);
        }

        const bbox = turf.bbox(feature);
        const camera = this.map.cameraForBounds(
            [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
            { padding: 40 },
        );

        if (camera) {
            if (source === "continents-data") {
                try {
                    camera.center = turf.centroid(feature).geometry.coordinates as [number, number];
                    camera.zoom += 0.15;
                } catch { }
            } else if (source === "countries-data") {
                camera.zoom = Math.max(camera.zoom, 5);
            } else if (source === "bd-divisions-data") {
                camera.zoom = Math.max(camera.zoom, 6.2);
            } else if (source === "bd-data") {
                camera.zoom = Math.max(camera.zoom, 6.8);
            }

            this.isAnimating = true;
            this.map.flyTo({ ...camera, duration: 1800, essential: true });
        }

        this.onSelectionChange?.(label);
    }

    clearSelection(zoomOut = false) {
        this.selectedFeatureId = null;
        this.selectedSource = null;
        (this.map.getSource("selected-data") as GeoJSONSource | undefined)?.setData(emptyCollection() as never);
        (this.map.getSource("mask-data") as GeoJSONSource | undefined)?.setData(emptyCollection() as never);
        this.onSelectionChange?.("None");

        if (zoomOut) {
            this.isAnimating = true;
            this.map.easeTo({
                zoom: Math.max(1, this.map.getZoom() - 1.5),
                duration: 1200,
                essential: true,
            });
        }
    }

    setHoverEnabled(enabled: boolean) {
        this.hoverEnabled = enabled;
        if (!enabled) this.clearHover();
    }

    setAutoRotate(enabled: boolean) {
        this.autoRotate = enabled;
    }

    private spinGlobe() {
        if (
            this.autoRotate &&
            !this.userInteracting &&
            !this.isAnimating &&
            this.map.getProjection().type === "globe"
        ) {
            const center = this.map.getCenter();
            center.lng -= 0.15;
            this.map.jumpTo({ center });
        }
        this.rotationFrame = requestAnimationFrame(() => this.spinGlobe());
    }

    setProjection(projection: "globe" | "mercator") {
        this.map.setProjection({ type: projection });
    }

    setBaseMap(baseMap: "default" | "satellite") {
        const base = this.map.getSource("google-raster-base") as maplibregl.RasterTileSource;
        base.setTiles([baseMap === "satellite" ? TILES_SATELLITE_BASE : TILES_DEFAULT_BASE]);

        const labels = this.map.getSource("google-raster-labels") as maplibregl.RasterTileSource;
        labels?.setTiles([
            baseMap === "satellite" ? TILES_LABELS_WITH_BORDERS : TILES_LABELS_PURE_TEXT,
        ]);
    }

    setBaseLabels(visible: boolean) {
        if (this.map.getLayer("google-labels-layer")) {
            this.map.setLayoutProperty(
                "google-labels-layer",
                "visibility",
                visible ? "visible" : "none",
            );
        }
    }

    setCustomLabels(visible: boolean) {
        const ids = [
            "continents-labels",
            "countries-labels",
            "bd-divisions-labels",
            "bd-labels",
        ];
        for (const id of ids) {
            if (this.map.getLayer(id)) {
                this.map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
            }
        }
    }

    setBorderMode(mode: "auto" | "continents" | "countries" | "division" | "districts" | "off") {
        const groups = {
            continents: ["continents-borders", "continents-fill", "continents-labels"],
            countries: ["countries-borders", "countries-fill", "countries-labels"],
            division: ["bd-divisions-borders", "bd-divisions-fill", "bd-divisions-labels"],
            districts: ["bd-borders", "bd-fill", "bd-labels"],
        };

        const setVisibility = (ids: string[], visibility: "visible" | "none") => {
            ids.forEach((id) => {
                if (this.map.getLayer(id)) this.map.setLayoutProperty(id, "visibility", visibility);
            });
        };
        const setZoom = (ids: string[], min: number, max: number) => {
            ids.forEach((id) => {
                if (this.map.getLayer(id)) this.map.setLayerZoomRange(id, min, max);
            });
        };

        if (mode === "auto") {
            setZoom(groups.continents, 1, 3.5);
            setZoom(groups.countries, 3.5, 5.5);
            setZoom(groups.division, 5.5, 6.5);
            setZoom(groups.districts, 6.5, 22);
            Object.values(groups).forEach((g) => setVisibility(g, "visible"));
            return;
        }

        if (mode === "off") {
            Object.values(groups).forEach((g) => setVisibility(g, "none"));
            return;
        }

        Object.values(groups).forEach((g) => setZoom(g, 0, 22));
        (Object.entries(groups) as Array<[keyof typeof groups, string[]]>).forEach(([key, ids]) => {
            setVisibility(ids, key === mode ? "visible" : "none");
        });
    }

    reset() {
        this.clearSelection();
        this.isAnimating = true;
        this.map.flyTo({
            center: INITIAL_VIEW.center,
            zoom: INITIAL_VIEW.zoom,
            pitch: 0,
            bearing: 0,
            duration: 2000,
            essential: true,
        });
    }

    destroy() {
        if (this.rotationFrame !== null) cancelAnimationFrame(this.rotationFrame);
        this.map.remove();
    }
}
