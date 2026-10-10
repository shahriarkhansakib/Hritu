import { useState, useRef, useEffect } from "react";

interface DropdownSelectProps {
    value: string;
    options: { value: string; label: string }[];
    onChange: (val: string) => void;
}

export default function DropdownSelect({ value, options, onChange }: DropdownSelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const selectedLabel = options.find((o) => o.value === value)?.label || "";

    return (
        <div style={{ position: "relative" }} ref={ref}>
            <div className="custom-select-trigger" onClick={() => setOpen(!open)}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedLabel}
                </span>
                <span style={{ fontSize: "0.6rem", flexShrink: 0 }}>▼</span>
            </div>
            {open && (
                <div className="custom-select-popover">
                    <div className="custom-select-list">
                        {options.map((opt) => (
                            <div
                                key={opt.value}
                                className={`custom-select-option ${value === opt.value ? "selected" : ""}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
