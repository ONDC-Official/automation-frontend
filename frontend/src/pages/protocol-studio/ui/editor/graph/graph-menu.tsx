import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import type {
    GraphMenuItem,
    GraphMenuSection,
    IGraphMenuProps,
} from "@pages/protocol-studio/ui/editor/types";

/** Space kept between the menu and the editor's edges. */
const EDGE_MARGIN = 8;

const matches = (item: GraphMenuItem, section: GraphMenuSection, query: string) =>
    `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""} ${section.title}`
        .toLowerCase()
        .includes(query);

/**
 * The graph's right-click menu, after Blueprint's "All actions" popup: a filter
 * box on top, then grouped rows. Arrow keys move, Enter picks, Esc or a click
 * anywhere else closes it. Positioned inside the editor root, kept on screen.
 */
export const GraphMenu = ({
    anchor,
    title,
    subtitle,
    sections,
    searchable,
    getQueryItems,
    onClose,
}: IGraphMenuProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const [position, setPosition] = useState(anchor);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = q
            ? sections
                  .map((section) => ({
                      ...section,
                      items: section.items.filter((item) => matches(item, section, q)),
                  }))
                  .filter((section) => section.items.length > 0)
            : sections;
        const extra = q && getQueryItems ? getQueryItems(query.trim()) : [];
        return extra.length > 0
            ? [...filtered, { id: "query", title: "Custom", items: extra }]
            : filtered;
    }, [sections, query, getQueryItems]);

    const enabled = useMemo(
        () => visible.flatMap((section) => section.items).filter((item) => !item.disabled),
        [visible]
    );
    const active = enabled[Math.min(activeIndex, enabled.length - 1)];

    // Keep the menu inside the editor and the window (the page may scroll past
    // the editor): flip up / left where it would overflow.
    useLayoutEffect(() => {
        const el = ref.current;
        const parent = el?.offsetParent as HTMLElement | null;
        if (!el || !parent) return;
        const box = parent.getBoundingClientRect();
        const right = Math.min(box.right, window.innerWidth) - box.left;
        const bottom = Math.min(box.bottom, window.innerHeight) - box.top;
        setPosition({
            x: Math.max(EDGE_MARGIN, Math.min(anchor.x, right - el.offsetWidth - EDGE_MARGIN)),
            y: Math.max(EDGE_MARGIN, Math.min(anchor.y, bottom - el.offsetHeight - EDGE_MARGIN)),
        });
    }, [anchor]);

    useEffect(() => {
        (searchable ? inputRef.current : ref.current)?.focus();
    }, [searchable]);

    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            if (!ref.current?.contains(e.target as Node)) onClose();
        };
        const onWheel = (e: WheelEvent) => {
            if (!ref.current?.contains(e.target as Node)) onClose();
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        document.addEventListener("wheel", onWheel, true);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown, true);
            document.removeEventListener("wheel", onWheel, true);
        };
    }, [onClose]);

    useEffect(() => {
        if (!active) return;
        ref.current
            ?.querySelector(`[data-item="${CSS.escape(active.id)}"]`)
            ?.scrollIntoView({ block: "nearest" });
    }, [active]);

    const pick = (item: GraphMenuItem) => {
        if (item.disabled) return;
        onClose();
        item.onSelect();
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            if (query) setQuery("");
            else onClose();
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (enabled.length === 0) return;
            const step = e.key === "ArrowDown" ? 1 : -1;
            const current = active ? enabled.indexOf(active) : -1;
            setActiveIndex((current + step + enabled.length) % enabled.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (active) pick(active);
        }
        // Keep Delete / Backspace in the box from reaching the graph's shortcuts.
        e.stopPropagation();
    };

    return (
        <div
            ref={ref}
            className="studio-glass bp-menu"
            role="menu"
            aria-label={title}
            tabIndex={-1}
            style={{ left: position.x, top: position.y }}
            onKeyDown={onKeyDown}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="bp-menu-head">
                <p className="bp-menu-title">{title}</p>
                {subtitle ? <p className="bp-menu-sub">{subtitle}</p> : null}
            </div>

            {searchable ? (
                <div className="studio-search bp-menu-search">
                    <MagnifyingGlassIcon aria-hidden="true" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="studio-search-input"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActiveIndex(0);
                        }}
                        placeholder="Search nodes, or type an API name"
                        aria-label="Filter the menu"
                        spellCheck={false}
                        autoComplete="off"
                    />
                </div>
            ) : null}

            <div className="bp-menu-body">
                {visible.length === 0 ? (
                    <p className="bp-menu-empty">Nothing matches “{query}”</p>
                ) : (
                    visible.map((section) => (
                        <div key={section.id} className="bp-menu-section" role="group">
                            <p className="bp-menu-section-title">{section.title}</p>
                            {section.items.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    role={
                                        item.checked === undefined ? "menuitem" : "menuitemcheckbox"
                                    }
                                    aria-checked={item.checked}
                                    className="bp-menu-item"
                                    data-item={item.id}
                                    data-tone={item.tone}
                                    data-active={item === active || undefined}
                                    disabled={item.disabled}
                                    tabIndex={-1}
                                    onPointerEnter={() => {
                                        const index = enabled.indexOf(item);
                                        if (index >= 0) setActiveIndex(index);
                                    }}
                                    onClick={() => pick(item)}
                                >
                                    <span className="bp-menu-swatch" aria-hidden="true">
                                        {item.Icon ? <item.Icon /> : null}
                                    </span>
                                    <span className="bp-menu-label">{item.label}</span>
                                    {item.hint ? (
                                        <span className="bp-menu-hint">{item.hint}</span>
                                    ) : null}
                                    {item.checked ? <CheckIcon className="bp-menu-check" /> : null}
                                </button>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GraphMenu;
