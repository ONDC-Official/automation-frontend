import { useEffect, useMemo, useState } from "react";
import { ChevronDown, FolderOpen, Globe, Plus } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@components/Shadcn/Collapsible/collapsible";
import { Badge } from "@components/Shadcn/Badge";
import { Button } from "@components/Shadcn/Button";
import { SearchField } from "@components/Shadcn/SearchField";
import { Tabs, TabsList, TabsTrigger } from "@components/Shadcn/Tabs";
import { cn } from "@/lib/utils";
import { getScenarioDomainLabel } from "@pages/scenario/constants";
import { groupConfigsBySubscriberUrl, versionLabel } from "@pages/scenario/helpers";
import { IConfigCardItem, IConfigListProps, IConfigRoleFilter } from "@pages/scenario/types";

// "apps" is dropped when the list is too narrow for it (the count stays).
const ROLE_FILTERS: { value: IConfigRoleFilter; label: string; suffix?: string }[] = [
    { value: "all", label: "All" },
    { value: "BAP", label: "Buyer", suffix: " apps" },
    { value: "BPP", label: "Seller", suffix: " apps" },
];

/** Text a config can be found by: its name, URL, domain, version and use case. */
const searchText = (item: IConfigCardItem) =>
    [
        item.name,
        item.data.subscriberUrl,
        item.data.domain,
        item.data.domain ? getScenarioDomainLabel(item.data.domain) : "",
        item.data.version,
        item.data.usecaseId,
    ]
        .join(" ")
        .toLowerCase();

/** "Grocery (RET10) · v1.2.5", or what is missing. */
export const buildLabel = (item: IConfigCardItem) => {
    const domain = item.data.domain ? getScenarioDomainLabel(item.data.domain) : "Domain not set";
    return `${domain}${item.data.version ? ` · ${versionLabel(item.data.version)}` : ""}`;
};

/**
 * Left side of the split view: the user's configs, searchable and filterable by
 * app type, grouped by subscriber URL. Everything here works on data the page
 * already has; nothing is fetched.
 */
export const ConfigList = ({
    items,
    selectedId,
    onSelect,
    onNewSession,
    organisationNames,
}: IConfigListProps) => {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<IConfigRoleFilter>("all");

    // Configs matching the search; each tab counts these, so the numbers follow the search.
    const searched = useMemo(() => {
        const query = search.trim().toLowerCase();
        return query ? items.filter((item) => searchText(item).includes(query)) : items;
    }, [items, search]);
    const roleCounts: Record<IConfigRoleFilter, number> = {
        all: searched.length,
        BAP: searched.filter((item) => item.data.npType === "BAP").length,
        BPP: searched.filter((item) => item.data.npType === "BPP").length,
    };
    const visible = useMemo(
        () =>
            roleFilter === "all"
                ? searched
                : searched.filter((item) => item.data.npType === roleFilter),
        [searched, roleFilter]
    );
    const groups = useMemo(() => groupConfigsBySubscriberUrl(visible), [visible]);

    // Each subscriber URL folds open to show its configs. Only the picked config's
    // URL starts open; while searching, every matching URL is open.
    const groupKeyOf = (id: string | null) =>
        groupConfigsBySubscriberUrl(items).find((g) => g.items.some((i) => i.id === id))
            ?.subscriberUrl;
    const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
        const key = groupKeyOf(selectedId);
        return new Set(key !== undefined ? [key] : []);
    });
    useEffect(() => {
        const key = groupKeyOf(selectedId);
        if (key !== undefined)
            setOpenGroups((open) => (open.has(key) ? open : new Set(open).add(key)));
    }, [selectedId]);
    const isSearching = search.trim() !== "";
    const toggleGroup = (key: string, isOpen: boolean) =>
        setOpenGroups((open) => {
            const next = new Set(open);
            if (isOpen) next.add(key);
            else next.delete(key);
            return next;
        });

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                <FolderOpen className="size-8 text-text-secondary" aria-hidden="true" />
                <div>
                    <p className="text-body-1 font-semibold text-text-primary">No configs yet</p>
                    <p className="text-body-2 text-text-secondary">
                        Start a new session by filling the form yourself.
                    </p>
                </div>
                <Button onClick={onNewSession} className="gap-2">
                    <Plus className="size-4" aria-hidden="true" />
                    New session
                </Button>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-3 border-b border-n-30 px-5 pb-1 pt-5 dark:border-border-default">
                <h2 className="text-body-1 font-bold text-text-primary">Your configs</h2>
                <SearchField
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, domain or URL"
                    aria-label="Search configs"
                    containerClassName="min-w-0"
                    className="h-10"
                />
                <Tabs
                    className="@container/tabs"
                    value={roleFilter}
                    onValueChange={(value) => setRoleFilter(value as IConfigRoleFilter)}
                >
                    <TabsList aria-label="Filter by app type">
                        {ROLE_FILTERS.map((filter) => (
                            <TabsTrigger
                                key={filter.value}
                                value={filter.value}
                                aria-label={`${filter.label}${filter.suffix ?? ""}, ${roleCounts[filter.value]} configs`}
                                className="flex-auto gap-1 px-1.5"
                            >
                                <span>
                                    {filter.label}
                                    {filter.suffix ? (
                                        <span className="hidden @[21rem]/tabs:inline">
                                            {filter.suffix}
                                        </span>
                                    ) : null}
                                </span>
                                <Badge
                                    variant={roleFilter === filter.value ? "info" : "outline"}
                                    data-testid={`config-count-${filter.value}`}
                                    className="px-1.5"
                                >
                                    {roleCounts[filter.value]}
                                </Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-3">
                {groups.length === 0 ? (
                    <p className="px-4 py-10 text-center text-body-2 text-text-secondary">
                        No configs match your search.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {groups.map((group) => (
                            <Collapsible
                                key={group.subscriberUrl || "none"}
                                open={isSearching || openGroups.has(group.subscriberUrl)}
                                onOpenChange={(isOpen) => toggleGroup(group.subscriberUrl, isOpen)}
                                asChild
                            >
                                <section className="overflow-hidden rounded-xl border border-n-30 bg-n-0 dark:border-border-default dark:bg-surface-elevated">
                                    <h3>
                                        <CollapsibleTrigger className="group/trigger flex w-full min-w-0 items-center gap-2.5 px-4 py-3 text-left text-body-1 text-text-primary transition-colors hover:bg-brand-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-normal/50 dark:hover:bg-surface-muted">
                                            <Globe
                                                className="size-4 shrink-0 text-text-secondary"
                                                aria-hidden="true"
                                            />
                                            <span
                                                className="min-w-0 truncate"
                                                title={group.subscriberUrl}
                                            >
                                                {group.subscriberUrl.replace(/^https?:\/\//, "") ||
                                                    "No subscriber URL"}
                                            </span>
                                            <span className="sr-only">
                                                , {group.items.length}{" "}
                                                {group.items.length === 1 ? "config" : "configs"}
                                            </span>
                                            <ChevronDown
                                                className="ml-auto size-4 shrink-0 text-text-secondary transition-transform group-data-[state=open]/trigger:rotate-180"
                                                aria-hidden="true"
                                            />
                                        </CollapsibleTrigger>
                                    </h3>
                                    <CollapsibleContent className="border-t border-n-30 dark:border-border-default">
                                        <ul className="space-y-1 p-2">
                                            {group.items.map((item) => {
                                                const isSelected = item.id === selectedId;
                                                return (
                                                    <li key={item.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => onSelect(item.id)}
                                                            aria-current={
                                                                isSelected ? "true" : undefined
                                                            }
                                                            className={cn(
                                                                "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-normal/50",
                                                                isSelected
                                                                    ? "border-brand-light-active bg-brand-light dark:border-brand-normal/40 dark:bg-brand-normal/15"
                                                                    : "border-transparent hover:bg-brand-light/40 dark:hover:bg-surface-muted"
                                                            )}
                                                        >
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-body-2 font-semibold text-text-primary">
                                                                    {item.name ||
                                                                        (item.data.domain
                                                                            ? getScenarioDomainLabel(
                                                                                  item.data.domain
                                                                              )
                                                                            : "Domain not set")}
                                                                </span>
                                                                <span className="block truncate text-caption-1 text-text-secondary">
                                                                    {item.name
                                                                        ? buildLabel(item)
                                                                        : item.data.domain}
                                                                    {organisationNames &&
                                                                    item.data.orgId
                                                                        ? ` · ${organisationNames[item.data.orgId] ?? item.data.orgId}`
                                                                        : null}
                                                                </span>
                                                            </span>
                                                            {item.data.npType ? (
                                                                <Badge variant="outline">
                                                                    {item.data.npType}
                                                                </Badge>
                                                            ) : null}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </CollapsibleContent>
                                </section>
                            </Collapsible>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
