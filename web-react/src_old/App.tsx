import { useEffect, useRef, useState } from "react";
import { MapEngine } from "./map/MapEngine";
import Search from "./components/Search";
import type { MapUiState, SearchItem } from "./types";

const initialState: MapUiState = {
    hoverEnabled: true,
    autoRotate: false,
    labelsVisible: false,
    customLabelsVisible: true,
    baseMap: "satellite",
    projection: "globe",
    borderMode: "auto",
    selected: "None",
    loading: true,
};

export default function App() {
    const mapRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<MapEngine | null>(null);
    const [state, setState] = useState<MapUiState>(initialState);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!mapRef.current) return;
        const engine = new MapEngine(mapRef.current);
        engineRef.current = engine;

        engine.onSelectionChange = (selected) => {
            setState((s) => ({ ...s, selected }));
        };
        engine.onLoadingChange = (loading) => {
            setState((s) => ({ ...s, loading }));
        };

        engine.load().catch((error) => {
            console.error("Data Load Error", error);
            setState((s) => ({ ...s, loading: false, selected: "Geography failed to load" }));
        });

        const onEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            if (search) setSearch("");
            else if (state.selected !== "None") engine.clearSelection(true);
        };
        document.addEventListener("keydown", onEscape);

        return () => {
            document.removeEventListener("keydown", onEscape);
            engine.destroy();
            engineRef.current = null;
        };
        // Engine intentionally mounts once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const engine = engineRef.current;

    const toggle = <K extends keyof MapUiState>(key: K, value: MapUiState[K]) => {
        setState((s) => ({ ...s, [key]: value }));
    };

    const handleSearchSelect = (item: SearchItem) => {
        engineRef.current?.focusOnFeature(
            item.feature,
            item.source,
            item.id,
            `${item.type}: ${item.name.replace(/ Division$/, "")}`,
        );
    };

    return (
        <div className="app">
            <header className="controls">
                <h3 className="title">NASA Trend Detective</h3>

                <Search
                    items={engine?.searchIndex ?? []}
                    value={search}
                    onValueChange={setSearch}
                    onSelect={handleSearchSelect}
                />

                <div className="btn-group">
                    <button
                        className={`control-btn ${state.projection === "mercator" ? "active" : ""}`}
                        onClick={() => {
                            engine?.setProjection("mercator");
                            toggle("projection", "mercator");
                        }}
                    >
                        Flat Map
                    </button>
                    <button
                        className={`control-btn ${state.projection === "globe" ? "active" : ""}`}
                        onClick={() => {
                            engine?.setProjection("globe");
                            toggle("projection", "globe");
                        }}
                    >
                        3D Globe
                    </button>
                </div>

                <div className="btn-group">
                    <button
                        className={`control-btn ${state.baseMap === "default" ? "active" : ""}`}
                        onClick={() => {
                            engine?.setBaseMap("default");
                            toggle("baseMap", "default");
                        }}
                    >
                        Default
                    </button>
                    <button
                        className={`control-btn ${state.baseMap === "satellite" ? "active" : ""}`}
                        onClick={() => {
                            engine?.setBaseMap("satellite");
                            toggle("baseMap", "satellite");
                        }}
                    >
                        Satellite
                    </button>
                </div>

                <div className="btn-group">
                    <button
                        className={`control-btn ${state.labelsVisible ? "active" : ""}`}
                        onClick={() => {
                            const next = !state.labelsVisible;
                            engine?.setBaseLabels(next);
                            toggle("labelsVisible", next);
                        }}
                    >
                        Base Labels: {state.labelsVisible ? "On" : "Off"}
                    </button>
                    <button
                        className={`control-btn ${state.customLabelsVisible ? "active" : ""}`}
                        onClick={() => {
                            const next = !state.customLabelsVisible;
                            engine?.setCustomLabels(next);
                            toggle("customLabelsVisible", next);
                        }}
                    >
                        Region Labels: {state.customLabelsVisible ? "On" : "Off"}
                    </button>
                </div>

                <select
                    className="control-select"
                    value={state.borderMode}
                    onChange={(e) => {
                        const mode = e.target.value as MapUiState["borderMode"];
                        engine?.setBorderMode(mode);
                        toggle("borderMode", mode);
                    }}
                >
                    <option value="auto">Borders: Auto (LOD)</option>
                    <option value="continents">Borders: Continents</option>
                    <option value="countries">Borders: Countries</option>
                    <option value="division">Borders: Division</option>
                    <option value="districts">Borders: Districts</option>
                    <option value="off">Borders: All Off</option>
                </select>

                <div className="btn-group">
                    <button
                        className={`control-btn ${state.hoverEnabled ? "active" : ""}`}
                        onClick={() => {
                            const next = !state.hoverEnabled;
                            engine?.setHoverEnabled(next);
                            toggle("hoverEnabled", next);
                        }}
                    >
                        Hover: {state.hoverEnabled ? "On" : "Off"}
                    </button>
                    <button
                        className={`control-btn ${state.autoRotate ? "active" : ""}`}
                        onClick={() => {
                            const next = !state.autoRotate;
                            engine?.setAutoRotate(next);
                            toggle("autoRotate", next);
                        }}
                    >
                        Rotate: {state.autoRotate ? "On" : "Off"}
                    </button>
                </div>

                <button
                    className="control-btn reset-btn"
                    onClick={() => {
                        engine?.reset();
                        setSearch("");
                        setState((s) => ({ ...s, selected: "None" }));
                    }}
                >
                    Reset View
                </button>
            </header>

            <main className="map-shell">
                <div ref={mapRef} className="map" />

                <div className="info-panel">
                    <div>
                        Region Selected: <span>{state.loading ? "Loading Geography..." : state.selected}</span>
                    </div>
                    {state.selected !== "None" && !state.loading && (
                        <button
                            className="clear-focus"
                            onClick={() => {
                                engine?.clearSelection(true);
                                setSearch("");
                            }}
                        >
                            ✕ Unfocus
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
