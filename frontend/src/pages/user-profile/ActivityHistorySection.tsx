import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import { AuthContext } from "@/context/authContext";
import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import { getSessions, getReport, getSubscriberUrls } from "@utils/request-utils";
import { openReportInNewTab } from "@utils/generic-utils";
import { IDomain } from "@pages/schema-validation/types";
import { Button } from "@/components/Shadcn/Button/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Shadcn/Card/card";
import Spinner from "@/components/Shadcn/Spinner";
import { Input } from "@/components/Shadcn/TextField/input";
import { cn } from "@/lib/utils";
import { ActivityHistoryAccordion } from "@pages/user-profile/components/ActivityHistoryAccordion";
import { HistoryFilterComboBox } from "@pages/user-profile/components/HistoryFilterComboBox";
import { HistorySubscriberComboBox } from "@pages/user-profile/components/HistorySubscriberComboBox";
import { ProfilePageHeader } from "@pages/user-profile/ProfilePageHeader";
import { useProfileShell } from "@pages/user-profile/ProfileShellContext";
import { PROFILE_PAGE_COPY } from "@pages/user-profile/constants";
import type { Session } from "@pages/user-profile/types";

export const ActivityHistorySection = () => {
    const { user } = useContext(AuthContext);
    const { setCounts } = useProfileShell();
    const [subscriberId, setSubscriberId] = useState("");
    const [subscriberOptions, setSubscriberOptions] = useState<string[]>([]);
    const [loadingSubscribers, setLoadingSubscribers] = useState(false);
    const [npType, setNpType] = useState("BAP");
    const [domains, setDomains] = useState<IDomain[]>([]);
    const [selectedDomain, setSelectedDomain] = useState("");
    const [selectedVersion, setSelectedVersion] = useState("");
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [viewingId, setViewingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | undefined>();

    const versionOptions = domains.find((d) => d.key === selectedDomain)?.version ?? [];
    const copy = PROFILE_PAGE_COPY.history;
    const domainItems = domains.map((d) => d.key);
    const versionItems = versionOptions.map((v) => v.key);
    const npTypeItems = ["BAP", "BPP"];
    const isLoggedIn = Boolean(user);
    const subscriberFieldClassName =
        "flex-1 min-w-48 w-full rounded-xl border-border-default bg-surface-elevated text-body-2 text-text-primary";

    useEffect(() => {
        setCounts((prev) => ({
            ...prev,
            history: sessions.length,
        }));
    }, [sessions.length, setCounts]);

    useEffect(() => {
        const fetchSubscribers = async () => {
            if (!user?.username) return;
            setLoadingSubscribers(true);
            try {
                const urls = await getSubscriberUrls(user?.username);
                setSubscriberOptions(urls);
            } catch {
                setSubscriberOptions([]);
            } finally {
                setLoadingSubscribers(false);
            }
        };
        const fetchDomains = async () => {
            try {
                const res = await apiClient.get<{ domain: IDomain[] }>(
                    API_ROUTES.CONFIG.SCENARIO_FORM_DATA
                );
                setDomains(res.data.domain ?? []);
            } catch {
                setDomains([]);
            }
        };
        fetchSubscribers();
        fetchDomains();
    }, [user?.username]);

    const handleDomainChange = (domain: string) => {
        setSelectedDomain(domain);
        setSelectedVersion("");
    };

    const handleFetchSessions = async () => {
        if (!subscriberId.trim()) return;
        setLoading(true);
        setSessions([]);
        setExpandedId(undefined);
        try {
            const response = await getSessions(
                subscriberId,
                npType,
                selectedDomain || undefined,
                selectedVersion || undefined
            );
            setSessions(
                (response.sessions as Session[])
                    .slice()
                    .sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
            );
        } catch (e) {
            console.error("error while fetching sessions", e);
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
            setHasFetched(true);
        }
    };

    const viewReport = async (sessionId: string) => {
        setViewingId(sessionId);
        try {
            const report = await getReport(sessionId);
            if (!report?.data) {
                toast.error("Report not available");
                return;
            }
            openReportInNewTab(report.data, sessionId);
        } catch (e) {
            console.error("error while fetching report", e);
            toast.error("Report not available");
        } finally {
            setViewingId(null);
        }
    };

    return (
        <div className="min-w-0 flex-1 min-h-full px-5 py-6">
            <ProfilePageHeader
                title={copy.title}
                subtitle={copy.subtitle}
                badgeCount={sessions.length}
            />

            <Card className="mb-6 px-5 py-5">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-h6 pb-4 font-semibold tracking-wider">
                        {copy.searchLabel}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                    <div className="flex gap-2.5 items-center flex-wrap">
                        {isLoggedIn ? (
                            <HistorySubscriberComboBox
                                items={subscriberOptions}
                                value={subscriberId}
                                onValueChange={setSubscriberId}
                                onEnter={handleFetchSessions}
                                placeholder={
                                    loadingSubscribers
                                        ? "Loading subscribers…"
                                        : "Select or type a Subscriber URL"
                                }
                                disabled={loadingSubscribers}
                                className={subscriberFieldClassName}
                            />
                        ) : (
                            <Input
                                value={subscriberId}
                                onChange={(e) => setSubscriberId(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleFetchSessions();
                                }}
                                placeholder="Type a Subscriber URL"
                                className={cn(subscriberFieldClassName, "h-9")}
                            />
                        )}
                        <HistoryFilterComboBox
                            items={domainItems}
                            value={selectedDomain}
                            onValueChange={handleDomainChange}
                            placeholder="Select domain"
                        />
                        <HistoryFilterComboBox
                            items={versionItems}
                            value={selectedVersion}
                            onValueChange={setSelectedVersion}
                            placeholder="Select version"
                            disabled={!selectedDomain}
                        />
                        <HistoryFilterComboBox
                            items={npTypeItems}
                            value={npType}
                            onValueChange={setNpType}
                            placeholder="Select NP type"
                        />
                        <Button
                            type="button"
                            onClick={handleFetchSessions}
                            disabled={
                                loading ||
                                !subscriberId.trim() ||
                                !selectedDomain ||
                                !selectedVersion
                            }
                            className="gap-1.5 whitespace-nowrap"
                        >
                            {loading ? (
                                <Spinner className="size-4" />
                            ) : (
                                <MagnifyingGlassIcon className="size-4" />
                            )}
                            Fetch Sessions
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
                    <Spinner className="size-8 mb-3" />
                    <p className="text-body-2 font-medium">Fetching sessions…</p>
                </div>
            ) : hasFetched && sessions.length === 0 ? (
                <div className="text-center py-16 text-text-secondary">
                    <p className="text-body-2 font-semibold">No sessions found.</p>
                    <p className="text-caption-1 mt-1">
                        No past sessions found for this subscriber.
                    </p>
                </div>
            ) : sessions.length > 0 ? (
                <ActivityHistoryAccordion
                    sessions={sessions}
                    expandedId={expandedId}
                    onExpandedChange={setExpandedId}
                    onViewReport={viewReport}
                    viewingId={viewingId}
                    subscriberUrl={subscriberId}
                    npType={npType}
                />
            ) : null}
        </div>
    );
};

export default ActivityHistorySection;
