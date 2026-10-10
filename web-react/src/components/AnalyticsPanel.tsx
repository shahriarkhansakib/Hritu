import { useEffect, useState, useRef } from "react";
import { fetchMetrics, fetchTrendData } from "../api/client";
import type { Metric } from "../types/api";
import type { SelectedRegion } from "../lib/types";
import DropdownSelect from "./DropdownSelect";

interface AnalyticsPanelProps {
    regions: SelectedRegion[];
    isCompareMode: boolean;
    setIsCompareMode: (v: boolean) => void;
    onHideChart: () => void;
    onRemoveRegion: (id: string | number) => void;
    onClose: () => void;
    onDataLoaded: (data: any[]) => void;
    trendData?: any[] | null;
    onLoadingChange?: (loading: boolean) => void;
    autoRunTick?: number;
}

const SERIES_COLORS = ["#38BDF8", "#A78BFA", "#FB7185", "#34D399", "#FBBF24", "#2DD4BF", "#FB923C", "#818CF8"];

function YearStepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
    return (
        <div className="stepper-group">
            <button className="stepper-btn" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
            <input type="number" className="stepper-input" value={value} onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) onChange(Math.min(max, Math.max(min, val)));
            }} />
            <button className="stepper-btn" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
        </div>
    );
}

export default function AnalyticsPanel({
    regions, isCompareMode, setIsCompareMode, onHideChart, onRemoveRegion, onClose, onDataLoaded, trendData, onLoadingChange, autoRunTick
}: AnalyticsPanelProps) {
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
    const [startYear, setStartYear] = useState(1981);
    const [endYear, setEndYear] = useState(2026);
    const [interval, setInterval] = useState("annual");

    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (autoRunTick && autoRunTick > 0) {
            handleAnalyze();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoRunTick]);

    useEffect(() => {
        if (isCompareMode && selectedMetrics.length > 1) {
            setSelectedMetrics([selectedMetrics[0]]);
        }
    }, [isCompareMode, selectedMetrics]);

    useEffect(() => {
        fetchMetrics().then((res) => {
            setMetrics(res);
            if (res.length > 0 && selectedMetrics.length === 0) setSelectedMetrics([res[0].id]);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false); };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const toggleMetric = (id: string) => {
        if (isCompareMode) {
            setSelectedMetrics([id]);
            setDropdownOpen(false);
        } else {
            setSelectedMetrics(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
        }
    };

    const handleAnalyze = async () => {
        if (regions.length === 0 || selectedMetrics.length === 0) return;

        setLoading(true);
        onLoadingChange?.(true);

        try {
            const promises = regions.flatMap(r =>
                selectedMetrics.map(metricId =>
                    fetchTrendData(r.lat, r.lon, metricId, startYear, endYear, interval)
                        .then(res => ({ ...res, region_name: r.name, region_id: r.id }))
                )
            );
            const results = await Promise.all(promises);
            onDataLoaded(results);
        } catch (err: any) {
            console.error("Failed to analyze trend", err);
        } finally {
            setLoading(false);
            onLoadingChange?.(false);
        }
    };

    if (regions.length === 0) return null;
    const primaryRegion = regions[0];

    return (
        <div className="analytics-panel verdicts-list-container">
            <div className="panel-top-bar">
                <span className="panel-title">CLIMATE ANALYTICS</span>
                <button className="panel-close-btn" onClick={onClose}>✕</button>
            </div>

            {!isCompareMode ? (
                <div className="region-meta-card" style={{ position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <div className="region-type-badge">{primaryRegion.type.toUpperCase()}</div>
                            <h2 className="region-title">{primaryRegion.name}</h2>
                        </div>
                        <button
                            onClick={() => setIsCompareMode(true)}
                            style={{ background: "rgba(0,229,255,0.08)", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.3)", borderRadius: "var(--radius-xs)", padding: "0.3rem 0.5rem", fontSize: "0.68rem", cursor: "pointer", transition: "all 0.15s" }}
                        >
                            + Compare
                        </button>
                    </div>
                    <div className="region-divider" />
                    <div className="region-coords">
                        <span>LAT: {primaryRegion.lat.toFixed(4)}</span>
                        <span>LON: {primaryRegion.lon.toFixed(4)}</span>
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: "0.25rem" }}>
                        <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", color: "#777" }}>TARGET REGIONS ({regions.length}/4)</span>
                        <button
                            onClick={() => { setIsCompareMode(false); regions.slice(1).forEach(r => onRemoveRegion(r.id)); }}
                            style={{ background: "none", color: "#94a3b8", border: "none", fontSize: "0.68rem", cursor: "pointer", textDecoration: "underline" }}
                        >
                            Exit Compare
                        </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {regions.map((r, idx) => {
                            const color = SERIES_COLORS[idx % SERIES_COLORS.length];
                            return (
                                <div key={r.id} style={{
                                    display: "flex", alignItems: "center", gap: "0.5rem",
                                    background: `color-mix(in srgb, ${color} 10%, transparent)`,
                                    border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                                    padding: "0.4rem 0.75rem", borderRadius: "var(--radius-xs)",
                                }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span style={{ color: "#fff", fontSize: "0.82rem", fontWeight: 500, lineHeight: 1.2 }}>{r.name}</span>
                                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.62rem", fontFamily: "monospace" }}>{r.lat.toFixed(2)}, {r.lon.toFixed(2)}</span>
                                    </div>
                                    <button onClick={() => onRemoveRegion(r.id)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", marginLeft: "0.25rem", padding: "0.2rem" }}>✕</button>
                                </div>
                            );
                        })}
                        {regions.length < 4 && (
                            <button
                                onClick={onHideChart}
                                style={{ display: "flex", alignItems: "center", border: "1px dashed #334155", background: "none", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-xs)", color: "#64748b", fontSize: "0.75rem", cursor: "pointer", transition: "color 0.15s, border-color 0.15s" }}
                            >
                                + Click map to add
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="analysis-form" style={{ marginTop: "0.5rem" }}>
                <div className="form-group" ref={dropdownRef}>
                    <label className="form-label">
                        {isCompareMode ? "METRIC (1 Allowed for Compare)" : `METRICS (${selectedMetrics.length})`}
                    </label>
                    <div className="custom-select-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '10px' }}>
                            {selectedMetrics.length === 0 ? "Select metrics..." : metrics.filter(m => selectedMetrics.includes(m.id)).map(m => m.label).join(", ")}
                        </span>
                        <span style={{ fontSize: '0.6rem', flexShrink: 0 }}>▼</span>
                    </div>

                    {dropdownOpen && (
                        <div className="custom-select-popover">
                            <div className="custom-select-list">
                                {metrics.map(m => (
                                    <label key={m.id} className="custom-checkbox-row">
                                        <input type="checkbox" checked={selectedMetrics.includes(m.id)} onChange={() => toggleMetric(m.id)} />
                                        <div className="custom-checkbox-box" style={{ borderRadius: isCompareMode ? "50%" : "2px" }}>
                                            {selectedMetrics.includes(m.id) && (
                                                isCompareMode
                                                    ? <span style={{ width: "6px", height: "6px", backgroundColor: "#000", borderRadius: "50%", display: "inline-block" }} />
                                                    : <span>✓</span>
                                            )}
                                        </div>
                                        <span className="custom-checkbox-label">{m.label} <span style={{ opacity: 0.5 }}>({m.unit})</span></span>
                                    </label>
                                ))}
                            </div>
                            {!isCompareMode && (
                                <div className="custom-select-actions">
                                    <button className="select-action-btn clear" onClick={() => setSelectedMetrics([])}>Clear</button>
                                    <button className="select-action-btn done" onClick={() => setDropdownOpen(false)}>Done</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">FROM</label>
                        <YearStepper value={startYear} min={1981} max={endYear} onChange={setStartYear} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">TO</label>
                        <YearStepper value={endYear} min={startYear} max={new Date().getFullYear()} onChange={setEndYear} />
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: "0.25rem" }}>
                    <label className="form-label">INTERVAL</label>
                    <DropdownSelect
                        value={interval}
                        options={[{ value: "annual", label: "Annual" }, { value: "monthly", label: "Monthly" }]}
                        onChange={setInterval}
                    />
                </div>

                <button
                    className={`analyze-action-btn ${loading ? "loading" : ""}`}
                    disabled={loading || selectedMetrics.length === 0}
                    onClick={() => handleAnalyze()}
                    style={{ marginTop: "0.5rem" }}
                >
                    {loading ? "Analyzing..." : "Run Trend Detective"}
                </button>

                {trendData && trendData.length > 0 && (
                    <div style={{ marginTop: "0.5rem", paddingTop: "1.25rem", borderTop: "1px solid hsl(214.3 11.9% 22% / 0.8)" }}>
                        <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", color: "#777", marginBottom: "0.75rem" }}>
                            NASA DATASETS QUERIED
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {Object.entries(
                                trendData.reduce((acc, curr) => {
                                    if (!acc[curr.dataset_id]) acc[curr.dataset_id] = [];
                                    if (!acc[curr.dataset_id].some((i: any) => i.metric === curr.metric)) acc[curr.dataset_id].push(curr);
                                    return acc;
                                }, {} as Record<string, any[]>)
                            ).map(([datasetId, items]) => (
                                <div key={datasetId}>
                                    <div style={{ color: "#94a3b8", fontSize: "0.68rem", fontWeight: 700, marginBottom: "0.4rem", paddingBottom: "0.2rem", borderBottom: "1px dashed #334155" }}>{datasetId}</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                        {/* STRICT TYPING APPLIED HERE */}
                                        {(items as any[]).map((d: any) => (
                                            <div key={d.metric} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ color: "#cbd5e1", fontSize: "0.75rem" }}>{d.metric_label}</span>
                                                <a href={d.source_url} target="_blank" rel="noreferrer" style={{ color: "#00e5ff", textDecoration: "none", fontSize: "0.68rem" }}>JSON ↗</a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
