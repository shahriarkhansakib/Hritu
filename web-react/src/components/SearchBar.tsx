import { useEffect, useMemo, useRef, useState } from "react";
import type { RegionType, SearchItem } from "../lib/types";
import "./SearchBar.css";

interface SearchBarProps {
    items: SearchItem[];
    onSelect: (item: SearchItem) => void;
    value: string;
    onValueChange: (value: string) => void;
}

const region_selection_types: RegionType[] = ["All", "Continent", "Country", "Division", "District"];

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
    return -1;
}

function HighlightMatch({
    text, query
}: {
    text: string;
    query: string;
}) {
    if (!query) return <>{text}</>;

    const lower_text = text.toLowerCase();
    const lower_query = query.toLowerCase();

    // prefer substring match
    const substring_index = lower_text.indexOf(lower_query);

    if (substring_index !== -1) {
        return (
            <>
                {text.substring(0, substring_index)}
                <span style={{color: '#4ade80'}}>
                    {text.substring(substring_index, substring_index + query.length)}
                </span>
                {text.substring(substring_index + query.length)}
            </>
        );
    }

    // fuzzy character match
    const result: React.ReactNode[] = [];

    let query_index = 0;
    for (let i = 0; i < text.length; ++i) {
        const character = text[i];
        if (
            query_index < lower_query.length &&
            character.toLowerCase() === lower_query[query_index]
        ) {
            result.push(
                <span key={i} style={{color: '#4ade80'}}>
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

export default function SearchBar({ items, onSelect, value, onValueChange }: SearchBarProps) {
    const [dropdown_open, set_dropdown_open] = useState(false);
    const [selected_region_type, set_selected_region_type] = useState<RegionType>("All");
    const [active_region_index, set_active_region_index] = useState(0);

    const search_container_ref = useRef<HTMLDivElement>(null);
    const search_input_ref = useRef<HTMLInputElement>(null);
    const search_list_ref = useRef<HTMLDivElement>(null);

    const results = useMemo(() => {
        return items
            .map((item) => ({
                item,
                get_match_score: selected_region_type !== "All" && item.type !== selected_region_type
                                 ? -1 : get_match_score(item.name, value),
            }))
            .filter((x) => x.get_match_score > 0)
            .sort((a, b) => b.get_match_score - a.get_match_score || a.item.name.localeCompare(b.item.name))
            .map((x) => x.item);
    }, [items, selected_region_type, value]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!search_container_ref.current?.contains(event.target as Node)) set_dropdown_open(false);
        };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);

    useEffect(() => {
        set_active_region_index(0)
    }, [value, selected_region_type]);

    useEffect(() => {
        if (active_region_index >= 0 && search_list_ref.current) {
            const active_element =
                search_list_ref.current.children[active_region_index] as HTMLElement | undefined;

            active_element?.scrollIntoView({ block: 'nearest' });
        }
    }, [active_region_index]);

    const select = (item: SearchItem) => {
        onValueChange(item.name);
        set_dropdown_open(false);
        search_input_ref.current?.blur();
        onSelect(item);
    };

    return (
        <div ref={search_container_ref} className="search-container">
            <input
                ref={search_input_ref}
                className="search-input"
                value={value}
                placeholder="Search for a region..."
                autoComplete="off"
                onFocus={() => set_dropdown_open(true)}
                onChange={(e) => {
                    onValueChange(e.target.value);
                    set_dropdown_open(true);
                }}
                onKeyDown={(e) => {
                    if (!dropdown_open && e.key === "ArrowDown") {
                        set_dropdown_open(true);
                        return;
                    }
                    if (!dropdown_open) return;
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        set_active_region_index((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
                    } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        set_active_region_index((i) => Math.max(i - 1, 0));
                    } else if (e.key === "Enter") {
                        e.preventDefault();
                        const item = results[active_region_index];
                        if (item) select(item);
                    } else if (e.key === "Escape") {
                        e.preventDefault();
                        set_dropdown_open(false);
                        onValueChange('');
                        search_input_ref.current?.blur();
                    }
                }}
            />

            <div className={`search-dropdown ${dropdown_open ? "show" : ""}`}>
                <div className="search-tags">
                    {region_selection_types.map((region_type) => (
                        <button
                            key={region_type}
                            className={`search-tag ${selected_region_type === region_type ? "active" : ""}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => set_selected_region_type(region_type)}
                        >
                            {region_type}
                        </button>
                    ))}
                </div>

                <div ref={search_list_ref} className="search-list">
                    {results.length === 0 ? (
                        <div className="search-item" style={{ color: '#666', cursor: 'default' }}>
                            No regions found
                        </div>
                    ) : (
                        results.map((item, index) => (
                            <div
                                className={`search-item ${index === active_region_index ? "active" : ""}`}
                                key={`${item.source}-${item.id}`}
                                onMouseEnter={() => set_active_region_index(index)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => select(item)}
                            >
                                <span>
                                    <HighlightMatch text={item.name} query={value} />
                                </span>

                                <span style={{ fontSize: '11px', color: '#888' }}>
                                    {item.type}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                <div className="search-help">
                    <span className="hint-item">
                        <span className="hint-label">Navigate</span>
                        <kbd className="hint-key">↑</kbd>
                        <kbd className="hint-key">↓</kbd>
                    </span>
                    <span className="hint-item">
                        <span className="hint-label">Select</span>
                        <kbd className="hint-key">↵</kbd>
                    </span>
                    <span className="hint-item">
                        <span className="hint-label">Close</span>
                        <kbd className="hint-key">Esc</kbd>
                    </span>
                </div>
            </div>
        </div>
    );
}
