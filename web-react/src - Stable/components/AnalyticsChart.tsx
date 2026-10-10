import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import type { TrendDataResponse } from "../types/api";

interface ChartData extends TrendDataResponse {
    region_name?: string;
    region_id?: string | number;
}

interface AnalyticsChartProps {
    data: ChartData[];
}

const SERIES_COLORS = [
    "#38BDF8", "#A78BFA", "#FB7185", "#34D399",
    "#FBBF24", "#2DD4BF", "#FB923C", "#818CF8"
];

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);
    const [viewMode, setViewMode] = useState<"raw" | "anomaly">("raw");
    const [showInfo, setShowInfo] = useState(false);

    const isComparisonMode = data && data.length > 0 && new Set(data.map(d => d.region_id)).size > 1;

    useEffect(() => {
        if (!chartRef.current) return;
        chartInstance.current = echarts.init(chartRef.current);
        const resizeObserver = new ResizeObserver(() => chartInstance.current?.resize());
        resizeObserver.observe(chartRef.current);

        return () => {
            resizeObserver.disconnect();
            chartInstance.current?.dispose();
        };
    }, []);

    useEffect(() => {
        if (!chartInstance.current || !data || data.length === 0) return;

        const isRaw = viewMode === "raw";
        const years = data[0].annual_series.map((d) => d.year);

        const uniqueUnits = Array.from(new Set(data.map(d => d.metric_unit)));
        const yAxes: echarts.YAXisComponentOption[] = uniqueUnits.map((unit, idx) => {
            const isLeft = idx === 0;
            return {
                type: "value",
                name: isRaw ? unit : `Anomaly (${unit})`,
                nameTextStyle: {
                    color: "#94a3b8",
                    // FIX: Match the text alignment of the unit with the numbers below it
                    align: isLeft ? "right" : "left",
                    // FIX: Shift the unit title precisely by the same amount as the label margin
                    padding: isLeft ? [0, 12, 0, 0] : [0, 0, 0, 12]
                },
                position: isLeft ? "left" : "right",
                offset: isLeft ? 0 : (idx - 1) * 65,
                alignTicks: true,
                splitLine: { show: isLeft, lineStyle: { color: "#1e293b", type: "dashed" } },
                axisLabel: {
                    color: "#94a3b8",
                    fontSize: 11,
                    margin: 12, // Keeps numbers 12px away from the axis line
                    align: isLeft ? "right" : "left" // Strict column alignment
                },
                scale: true
            };
        });

        const series: echarts.SeriesOption[] = [];
        data.forEach((dataset, idx) => {
            const color = SERIES_COLORS[idx % SERIES_COLORS.length];
            const yAxisIndex = uniqueUnits.indexOf(dataset.metric_unit);

            const seriesBaseName = isComparisonMode
                ? (dataset.region_name || "Unknown Region")
                : dataset.metric_label;

            const rawValues = dataset.annual_series.map((d) => d.value);
            const anomalies = dataset.annual_series.map((d) => d.anomaly);

            const slopeMap = new Map(dataset.slope_line.map(s => [s.year, s.fitted]));
            const trendValues = years.map(y => {
                const fitted = slopeMap.get(y);
                if (fitted == null) return null;
                return isRaw ? fitted + dataset.baseline_mean : fitted;
            });

            series.push({
                name: seriesBaseName,
                type: isRaw ? "line" : "bar",
                yAxisIndex,
                data: isRaw ? rawValues : anomalies,
                itemStyle: { color },
                lineStyle: { width: 2.5 },
                showSymbol: false,
            });

            series.push({
                name: `${seriesBaseName} (Trend)`,
                type: "line",
                yAxisIndex,
                data: trendValues,
                itemStyle: { color },
                lineStyle: { width: 1.5, type: "dashed", opacity: 0.8 },
                showSymbol: false,
            });
        });

        const option: echarts.EChartsOption = {
            backgroundColor: "transparent",
            tooltip: {
                trigger: "axis",
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                borderColor: "#334155",
                textStyle: { color: "#e2e8f0", fontSize: 12 },
                axisPointer: { type: 'cross', crossStyle: { color: '#94a3b8' } },
                valueFormatter: (val) => typeof val === 'number' ? val.toFixed(3) : String(val)
            },
            legend: {
                show: data.length > 1,
                bottom: 0,
                textStyle: { color: "#cbd5e1", fontSize: 11 },
                icon: "circle",
                type: "scroll"
            },
            grid: {
                top: 35,
                // Adjusted right margin to dynamically fit the strictly aligned columns
                right: uniqueUnits.length > 1 ? 40 + ((uniqueUnits.length - 1) * 65) : 30,
                bottom: data.length > 1 ? 40 : 25,
                left: 65,
                containLabel: false
            },
            xAxis: {
                type: "category",
                data: years,
                axisLine: { lineStyle: { color: "#475569" } },
                axisLabel: { color: "#94a3b8", fontSize: 11 }
            },
            yAxis: yAxes,
            series: series
        };

        chartInstance.current.setOption(option, true);
    }, [data, viewMode, isComparisonMode]);

    if (!data || data.length === 0) return null;

    const mainTitle = isComparisonMode ? "Comparative Analysis" : "Trend Analysis";
    const subTitle = isComparisonMode
        ? `${data[0].metric_label} • ${data[0].period} • ${data.length} Regions`
        : `${data[0].region_name || "Region"} • ${data[0].period} • ${data.length} Metric${data.length > 1 ? 's' : ''}`;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0, marginBottom: "0.5rem" }}>
                <div>
                    <h3 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 600 }}>{mainTitle}</h3>
                    <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>{subTitle}</p>
                </div>
                <div className="segmented-control" style={{ width: "200px" }}>
                    <button className={viewMode === "raw" ? "active" : ""} onClick={() => setViewMode("raw")}>Raw</button>
                    <button className={viewMode === "anomaly" ? "active" : ""} onClick={() => setViewMode("anomaly")}>Anomalies</button>
                </div>
            </div>

            {/* Chart */}
            <div ref={chartRef} style={{ flex: 1, width: "100%", minHeight: "250px" }} />

            {/* COMPACT METADATA GRID */}
            <div style={{
                flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.75rem",
                marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid hsl(214.3 11.9% 22%)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", position: "relative" }}>
                    <div style={{ color: "#fff", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>VERDICTS & DATA</div>
                    <div onMouseEnter={() => setShowInfo(true)} onMouseLeave={() => setShowInfo(false)} style={{ display: "flex", position: "relative" }}>
                        <button style={{
                            background: "none", border: "1px solid #475569", color: "#94a3b8",
                            borderRadius: "50%", width: "14px", height: "14px", fontSize: "9px",
                            display: "flex", alignItems: "center", justifyContent: "center", cursor: "help"
                        }}>i</button>

                        {showInfo && (
                            <div style={{
                                position: "absolute", bottom: "100%", left: "0", marginBottom: "8px",
                                width: "320px", background: "hsl(from var(--panel-bg) h s 10%)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid #00e5ff", padding: "1rem", borderRadius: "var(--radius-xs)",
                                zIndex: 100, boxShadow: "0 10px 25px rgba(0,0,0,0.5)", pointerEvents: "none"
                            }}>
                                <div style={{ color: "#00e5ff", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.6rem", letterSpacing: "0.05em" }}>HOW TO READ THIS</div>
                                <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.75rem", color: "#cbd5e1", lineHeight: "1.5", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <li><strong>Verdict:</strong> Uses the <em>Modified Mann-Kendall test</em> to detect non-random changes. "REAL TREND" implies statistical significance.</li>
                                    <li><strong>p-value:</strong> Probability the trend is by pure chance. Must be &lt; 0.05 (5%) to be a real trend.</li>
                                    <li><strong>Slope:</strong> Uses the <em>Theil-Sen estimator</em> to calculate change per decade.</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div className="verdicts-list-container" style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem",
                    maxHeight: "125px", overflowY: "auto", paddingRight: "0.5rem"
                }}>
                    {data.map((d, idx) => {
                        const verdictTitle = isComparisonMode ? d.region_name : d.metric_label;
                        return (
                            <div key={`${d.region_id}-${d.metric}`} style={{
                                background: "hsl(from var(--panel-bg) h s 14%)", padding: "0.5rem 0.75rem",
                                borderRadius: "var(--radius-xs)", borderLeft: `3px solid ${SERIES_COLORS[idx % SERIES_COLORS.length]}`
                            }}>
                                <div style={{ fontSize: "0.68rem", color: "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.25rem" }}>
                                    {verdictTitle} • <a href={d.source_url} target="_blank" rel="noreferrer" style={{ color: "#00e5ff", textDecoration: "none" }}>Raw Data</a>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <span style={{ color: d.verdict === "REAL_TREND" ? "#4ade80" : "#facc15", fontWeight: 700, fontSize: "0.85rem" }}>
                                        {d.verdict.replace("_", " ")}
                                    </span>
                                    <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                                        p={d.p_value.toFixed(4)} | <span style={{ color: "#fff", fontSize: "1rem", fontWeight: 500 }}>{d.slope_per_decade > 0 ? "+" : ""}{d.slope_per_decade.toFixed(3)}/dec</span>
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
