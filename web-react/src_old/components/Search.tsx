import { useEffect, useMemo, useRef, useState } from "react";
import type { RegionType, SearchItem } from "../types";

interface Props {
    items: SearchItem[];
    onSelect: (item: SearchItem) => void;
    value: string;
    onValueChange: (value: string) => void;
}

const types: RegionType[] = ["All", "Continent", "Country", "Division", "District"];

function fuzzyMatch(str: string, query: string) {
    if (!query) return true;
    let si = 0;
    let qi = 0;
    while (si < str.length && qi < query.length) {
        if (str[si] === query[qi]) qi++;
        si++;
    }
    return qi === query.length;
}

function score(name: string, query: string) {
    const q = query.toLowerCase().trim();
    const n = name.toLowerCase();
    if (!q) return 1;
    if (n === q) return 100;
    if (n.startsWith(q)) return 80;
    if (n.includes(q)) return 40;
    if (fuzzyMatch(n, q)) return 20;
    return -1;
}

function Highlight({ text, query }: { text: string; query: string }) {
    const q = query.toLowerCase().trim();
    if (!q) return <>{text}</>;
    const start = text.toLowerCase().indexOf(q);
    if (start >= 0) {
        return (
            <>
                {text.slice(0, start)}
                <span className="search-match">{text.slice(start, start + q.length)}</span>
                {text.slice(start + q.length)}
            </>
        );
    }

    let qi = 0;
    return (
        <>
            {Array.from(text).map((char, i) => {
                const hit = qi < q.length && char.toLowerCase() === q[qi];
                if (hit) qi++;
                return <span className={hit ? "search-match" : undefined} key={`${char}-${i}`}>{char}</span>;
            })}
        </>
    );
}

export default function Search({ items, onSelect, value, onValueChange }: Props) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<RegionType>("All");
    const [active, setActive] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);

    const results = useMemo(() => {
        return items
            .map((item) => ({
                item,
                score: type !== "All" && item.type !== type ? -1 : score(item.name, value),
            }))
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
            .map((x) => x.item);
    }, [items, type, value]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);

    useEffect(() => setActive(0), [value, type]);

    const select = (item: SearchItem) => {
        onValueChange(item.name);
        setOpen(false);
        onSelect(item);
    };

    return (
        <div className="search-container" ref={rootRef}>
            <input
                className="search-input"
                value={value}
                placeholder="Search for a region..."
                autoComplete="off"
                onFocus={() => setOpen(true)}
                onChange={(e) => {
                    onValueChange(e.target.value);
                    setOpen(true);
                }}
                onKeyDown={(e) => {
                    if (!open && e.key === "ArrowDown") {
                        setOpen(true);
                        return;
                    }
                    if (!open) return;
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
                    } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setActive((i) => Math.max(i - 1, 0));
                    } else if (e.key === "Enter") {
                        e.preventDefault();
                        const item = results[active];
                        if (item) select(item);
                    } else if (e.key === "Escape") {
                        setOpen(false);
                    }
                }}
            />

            {open && (
                <div className="search-dropdown">
                    <div className="search-tags">
                        {types.map((t) => (
                            <button
                                key={t}
                                className={`search-tag ${type === t ? "active" : ""}`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setType(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="search-list">
                        {results.length === 0 ? (
                            <div className="search-item no-results">No regions found</div>
                        ) : (
                            results.map((item, index) => (
                                <button
                                    className={`search-item ${index === active ? "active" : ""}`}
                                    key={`${item.source}-${item.id}`}
                                    onMouseEnter={() => setActive(index)}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => select(item)}
                                >
                                    <strong><Highlight text={item.name} query={value} /></strong>
                                    <span>{item.type}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
