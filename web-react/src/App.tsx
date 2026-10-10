import { useEffect, useRef, useState } from "react";
import * as turf from "@turf/turf";
import { MapEngine } from "./features/map/MapEngine";
import SearchBar from "./components/SearchBar";
import type { MapUiState, SearchItem } from "./lib/types";

import AnalyticsPanel from "./components/AnalyticsPanel";
import AnalyticsChart from "./components/AnalyticsChart";
import DropdownSelect from "./components/DropdownSelect";
import type { SelectedRegion } from "./lib/types";
import type { TrendDataResponse } from "./types/api";

const initialState: MapUiState = {
    hoverEnabled: true, autoRotate: false, labelsVisible: false,
    customLabelsVisible: true, baseMap: "satellite", projection: "globe",
    borderMode: "auto", selected: "None", loading: true,
};

const SERIES_COLORS = ["#38BDF8", "#A78BFA", "#FB7185", "#34D399", "#FBBF24", "#2DD4BF", "#FB923C", "#818CF8"];

export default function App() {
    const mapRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<MapEngine | null>(null);
    const [state, setState] = useState<MapUiState>(initialState);
    const [search, setSearch] = useState("");

    const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);
    const [isCompareMode, setIsCompareMode] = useState(false);

    // FIX 1: Tracks how the user interacted to prevent map click camera swoops
    const lastActionRef = useRef<"search" | "click" | null>(null);
    const [searchTick, setSearchTick] = useState(0);

    const [trendData, setTrendData] = useState<TrendDataResponse[] | null>(null);
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const isCompareModeRef = useRef(isCompareMode);
    useEffect(() => { isCompareModeRef.current = isCompareMode; }, [isCompareMode]);

    const prevSelectedRegions = useRef<SelectedRegion[]>([]);

    useEffect(() => {
        if (!mapRef.current) return;
        const engine = new MapEngine(mapRef.current);
        engineRef.current = engine;

        engine.onSelectionChange = (selected) => { setState((s) => ({ ...s, selected })); };
        engine.onLoadingChange = (loading) => { setState((s) => ({ ...s, loading })); };

        engine.onRegionSelect = (region) => {
            lastActionRef.current = "click"; // TIE THE ACTION SOURCE

            if (!region) {
                setSelectedRegions([]);
                setRightSidebarOpen(false);
                setTrendData(null);
                return;
            }

            let wasRemoved = false;

            setSelectedRegions((previous) => {
                if (isCompareModeRef.current) {
                    if (previous.some(r => r.id === region.id)) {
                        wasRemoved = true;
                        return previous.filter(r => r.id !== region.id);
                    }
                    if (previous.length >= 4) return previous;
                    return [...previous, region];
                } else {
                    if (previous.length === 1 && previous[0].id === region.id) {
                        wasRemoved = true;
                        setRightSidebarOpen(false);
                        return [];
                    }
                    return [region];
                }
            });

            if (wasRemoved) {
                setTrendData(prev => {
                    if (!prev) return null;
                    const filtered = prev.filter(d => (d as any).region_id !== region.id);
                    return filtered.length > 0 ? filtered : null;
                });
            } else {
                setRightSidebarOpen(true);
                setTrendData(null);
            }
        };

        engine.load().catch((error) => {
            console.error("Map Data Load Error", error);
            setState((s) => ({ ...s, loading: false, selected: "Geography failed to load" }));
        });

        return () => { engine.destroy(); engineRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // THE BRIDGE: Now fully aware of 'isCompareMode' so it drops the mask instantly
    useEffect(() => {
        if (engineRef.current && !state.loading) {
            const prev = prevSelectedRegions.current;
            const curr = selectedRegions;
            let shouldAnimate = false;

            if (curr.length > prev.length) {
                // FIX 1: Only animate if in single mode, OR if explicitly searched
                if (!isCompareMode || lastActionRef.current === "search") {
                    shouldAnimate = true;
                }
            } else if (curr.length === 1 && prev.length === 1 && curr[0].id !== prev[0].id) {
                shouldAnimate = true;
            }

            // Passes isCompareMode down to the engine
            engineRef.current.updateSelection(curr, SERIES_COLORS, shouldAnimate, isCompareMode);

            prevSelectedRegions.current = curr;
            lastActionRef.current = null; // Reset tracker
        }
    }, [selectedRegions, isCompareMode, state.loading]); // isCompareMode added to dependencies

    const handleRemoveRegion = (id: string | number) => {
        setSelectedRegions(prev => {
            const next = prev.filter(r => r.id !== id);
            if (next.length === 0) setRightSidebarOpen(false);
            return next;
        });

        setTrendData(prev => {
            if (!prev) return null;
            const filtered = prev.filter(d => (d as any).region_id !== id);
            return filtered.length > 0 ? filtered : null;
        });
    };

    useEffect(() => {
        const onEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            const target = event.target as HTMLElement | null;
            if (target?.tagName === "INPUT" || target?.classList.contains("search-input")) return;

            if (state.selected !== "None") {
                engineRef.current?.clearSelection(true);
                setSearch("");
            }
        };
        document.addEventListener("keydown", onEscape);
        return () => document.removeEventListener("keydown", onEscape);
    }, [state.selected]);

    const toggle = <K extends keyof MapUiState>(key: K, value: MapUiState[K]) => {
        setState((s) => ({ ...s, [key]: value }));
    };

    const handleSearchSelect = (item: SearchItem) => {
        lastActionRef.current = "search"; // TIE THE ACTION SOURCE

        (document.querySelector('.search-input') as HTMLInputElement)?.blur();

        let lat = 0; let lon = 0;
        try {
            const centroid = turf.centroid(item.feature);
            if (centroid) [lon, lat] = centroid.geometry.coordinates;
        } catch (e) {
            console.error("Failed to calculate centroid", e);
        }

        const region: SelectedRegion = {
            id: item.id, name: item.name.replace(/ Division$/, ""), type: item.type,
            lat, lon, source: item.source, feature: item.feature,
        };

        let isDuplicate = false;
        setSelectedRegions((prev) => {
            if (isCompareModeRef.current) {
                if (prev.some(r => r.id === region.id)) {
                    isDuplicate = true;
                    return prev;
                }
                if (prev.length >= 4) return prev;
                return [...prev, region];
            } else {
                return [region];
            }
        });

        setRightSidebarOpen(true);

        if (!isDuplicate) {
            setTrendData(null);
            if (!isCompareModeRef.current) {
                setSearchTick(t => t + 1);
            }
        }
    };

    return (
        <div className="app">
            <div ref={mapRef} className={`map ${trendData && trendData.length > 0 ? "dimmed" : ""}`} />

            <div className="header">
                <div className="logo"><h1>Hritu</h1><span /></div>
                <SearchBar items={engineRef.current?.searchIndex ?? []} value={search} onValueChange={setSearch} onSelect={handleSearchSelect} />
            </div>

            <div className={`floating-toolbar ${!leftSidebarOpen ? "visible" : ""}`}>
                <button className="toolbar-btn" onClick={() => setLeftSidebarOpen(true)} title="Map Controls">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                </button>
                <button className={`toolbar-btn ${state.autoRotate ? "active" : ""}`} onClick={() => { const next = !state.autoRotate; engineRef.current?.setAutoRotate(next); toggle("autoRotate", next); }} title="Toggle Auto-Rotation">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </button>
                <button className="toolbar-btn" onClick={() => { engineRef.current?.reset(); setSearch(""); setState((s) => ({ ...s, selected: "None" })); }} title="Reset View">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                </button>
            </div>

            <aside className={`sidebar left ${leftSidebarOpen ? "open" : ""}`}>
                <div className="sidebar-header">
                    <span className="sidebar-title">Map Controls</span>
                    <button className="sidebar-close-btn" onClick={() => setLeftSidebarOpen(false)} title="Close Panel">✕</button>
                </div>
                <div className="sidebar-content">
                    <div className="control-group">
                        <span className="group-title">VIEW & PROJECTION</span>
                        <div className="segmented-control">
                            <button type="button" className={state.projection === "globe" ? "active" : ""} onClick={() => { engineRef.current?.setProjection("globe"); toggle("projection", "globe"); }}>3D Globe</button>
                            <button type="button" className={state.projection === "mercator" ? "active" : ""} onClick={() => { engineRef.current?.setProjection("mercator"); toggle("projection", "mercator"); }}>Flat Map</button>
                        </div>
                        <div className="segmented-control">
                            <button type="button" className={state.baseMap === "satellite" ? "active" : ""} onClick={() => { engineRef.current?.setBaseMap("satellite"); toggle("baseMap", "satellite"); }}>Satellite</button>
                            <button type="button" className={state.baseMap === "roadmap" ? "active" : ""} onClick={() => { engineRef.current?.setBaseMap("roadmap"); toggle("baseMap", "roadmap"); }}>Roadmap</button>
                        </div>
                    </div>
                    <div className="control-group">
                        <span className="group-title">BOUNDARIES & LOD</span>
                        <DropdownSelect value={state.borderMode} options={[{ value: "auto", label: "Auto (Level of Detail)" }, { value: "continents", label: "Continents Only" }, { value: "countries", label: "Countries Only" }, { value: "division", label: "Divisions Only" }, { value: "districts", label: "Districts Only" }, { value: "off", label: "Borders Off" }]} onChange={(val) => { const mode = val as MapUiState["borderMode"]; engineRef.current?.setBorderMode(mode); toggle("borderMode", mode); }} />
                    </div>
                    <div className="control-group">
                        <span className="group-title">OVERLAYS & LABELS</span>
                        <label className="toggle-row"><span>Region Labels</span><input type="checkbox" checked={state.customLabelsVisible} onChange={() => { const next = !state.customLabelsVisible; engineRef.current?.setCustomLabels(next); toggle("customLabelsVisible", next); }} /><span className="switch-slider" /></label>
                        <label className="toggle-row"><span>Base Map Labels</span><input type="checkbox" checked={state.labelsVisible} onChange={() => { const next = !state.labelsVisible; engineRef.current?.setBaseLabels(next); toggle("labelsVisible", next); }} /><span className="switch-slider" /></label>
                    </div>
                    <div className="control-group">
                        <span className="group-title">INTERACTION</span>
                        <label className="toggle-row"><span>Hover Highlight</span><input type="checkbox" checked={state.hoverEnabled} onChange={() => { const next = !state.hoverEnabled; engineRef.current?.setHoverEnabled(next); toggle("hoverEnabled", next); }} /><span className="switch-slider" /></label>
                        <label className="toggle-row"><span>Auto Rotation</span><input type="checkbox" checked={state.autoRotate} onChange={() => { const next = !state.autoRotate; engineRef.current?.setAutoRotate(next); toggle("autoRotate", next); }} /><span className="switch-slider" /></label>
                    </div>
                </div>
                <div className="sidebar-footer">
                    <button className="reset-view-btn" onClick={() => { engineRef.current?.reset(); setSearch(""); setState((s) => ({ ...s, selected: "None" })); }}>⟲ Reset Camera View</button>
                </div>
            </aside>

            {/* Right Sidebar */}
            <aside className={`sidebar right ${rightSidebarOpen ? "open" : ""} ${trendData && trendData.length > 0 ? "expanded" : ""}`}>
                {selectedRegions.length > 0 ? (
                    <div className="analytics-layout">
                        {trendData && trendData.length > 0 && (
                            <div className="analytics-chart-section">
                                <AnalyticsChart data={trendData} />
                            </div>
                        )}
                        <div className="analytics-control-section">
                            <AnalyticsPanel
                                regions={selectedRegions}
                                isCompareMode={isCompareMode}
                                setIsCompareMode={setIsCompareMode}
                                onHideChart={() => setTrendData(null)}
                                onRemoveRegion={handleRemoveRegion}
                                onClose={() => {
                                    setRightSidebarOpen(false);
                                    engineRef.current?.clearSelection(true);
                                    setSelectedRegions([]);
                                    setSearch("");
                                }}
                                onDataLoaded={(data) => setTrendData(data)}
                                trendData={trendData}
                                onLoadingChange={setIsAnalyzing}
                                autoRunTick={searchTick}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="panel-empty-state">
                        <span>Select a region on the map or search to view analytics.</span>
                    </div>
                )}
            </aside>

            <div className="footer">
                <div className="selection-hud">
                    <div className={`hud-status-dot ${state.loading || isAnalyzing ? "loading" : state.selected !== "None" ? "active" : ""}`} />
                    <div className="hud-info">
                        <span className="hud-label">TARGET REGION</span>
                        <span className="hud-value">{state.loading ? "Loading Geography..." : isAnalyzing ? "Analyzing Satellite Data..." : state.selected}</span>
                    </div>
                    {state.selected !== "None" && !state.loading && (
                        <button className="hud-clear-btn" title="Unfocus region (Esc)" onClick={() => { engineRef.current?.clearSelection(true); setSearch(""); }}>✕</button>
                    )}
                </div>
            </div>
        </div>
    );
}
