import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactElement } from "react";
import scenarioDraftSlice from "@store/slices/scenarioDraftSlice";
import type { IDomain } from "@pages/schema-validation/types";
import { ConfigList } from "@pages/scenario/ConfigList";
import { ConfigDetailPanel } from "@pages/scenario/ConfigDetailPanel";
import {
    buildConfigCards,
    configsForOrganisation,
    findMissingFields,
    groupConfigsBySubscriberUrl,
    npPortalConfigsFromUser,
    versionLabel,
} from "@pages/scenario/helpers";
import type { IUser, IUserOrganisationConfig } from "@/types/user";
import type { IScenarioFormData } from "@pages/scenario/types";

// constants.ts reads import.meta, which Jest cannot parse.
jest.mock("@pages/scenario/constants", () => ({
    getScenarioDomainLabel: (key: string) => ({ "ONDC:RET10": "Grocery (RET10)" })[key] ?? key,
    sortedDomainOptions: (domains: { key: string }[]) =>
        domains.map((d) => ({
            value: d.key,
            label: ({ "ONDC:RET10": "Grocery (RET10)" } as Record<string, string>)[d.key] ?? d.key,
        })),
}));
let mockUser: object | undefined;
jest.mock("@hooks/useAuth", () => ({ useAuth: () => ({ user: mockUser }) }));
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }));
jest.mock("@constants/routes", () => ({ ROUTES: { PROFILE_HISTORY: "/profile/history" } }));

const USER = {
    username: "25716",
    organisations: [{ organisationId: "11899", organisationName: "UAT_1 Org" }],
};
const DOMAINS = [
    {
        key: "ONDC:RET10",
        version: [
            { key: "1.2.5", usecase: ["GROCERY", "PHARMACY"] },
            { key: "1.2.0", usecase: ["GROCERY", "PHARMACY"] },
        ],
    },
] as unknown as IDomain[];

const saved = (over: Partial<IScenarioFormData> = {}): IScenarioFormData => ({
    subscriberUrl: "https://buyer.kiranakart.example.com/ondc",
    npType: "BAP",
    domain: "ONDC:RET10",
    version: "1.2.5",
    usecaseId: "GROCERY",
    env: "PRE-PRODUCTION",
    orgId: "11899",
    ...over,
});

// ConfigDetailPanel persists its fill-in draft via Redux; a fresh minimal store
// per render keeps each test isolated (the full app store can't load under Jest).
const renderWithStore = (ui: ReactElement) => {
    const store = configureStore({ reducer: { scenarioDraft: scenarioDraftSlice.reducer } });
    return render(<Provider store={store}>{ui}</Provider>);
};

beforeEach(() => {
    mockUser = USER;
    jest.clearAllMocks();
});

describe("which details a config is missing", () => {
    it("none for a complete, supported config", () => {
        expect(findMissingFields(saved(), DOMAINS)).toEqual([]);
    });

    it.each([
        ["no URL", { subscriberUrl: "" }, ["subscriberUrl"]],
        ["a URL without http(s)", { subscriberUrl: "buyer.example.com" }, ["subscriberUrl"]],
        ["no role", { npType: "" }, ["npType"]],
        ["an unknown domain", { domain: "ONDC:RET99" }, ["domain", "version", "usecaseId"]],
        ["an unknown version", { version: "9.9.9" }, ["version", "usecaseId"]],
        ["an unknown use case", { usecaseId: "PIZZA" }, ["usecaseId"]],
    ])("%s", (_case, over, missing) => {
        expect(findMissingFields(saved(over), DOMAINS)).toEqual(missing);
    });
});

describe("configs and groups", () => {
    it("makes one card per saved config, named after it", () => {
        const cards = buildConfigCards([], { "kiranakart-buyer": saved() }, DOMAINS);

        expect(cards).toEqual([
            expect.objectContaining({
                id: "saved|kiranakart-buyer",
                source: "saved",
                name: "kiranakart-buyer",
            }),
        ]);
    });

    it("puts NP Portal configs first and drops their exact duplicates", () => {
        const np = {
            subscriber_url: "https://np.example.com",
            np_type: "bap",
            domain: "ONDC:RET10",
            version: "1.2.5",
            usecase: "GROCERY",
            org_id: "11899",
        };
        const cards = buildConfigCards([np, { ...np }], { mine: saved() }, DOMAINS);

        expect(cards.map((c) => c.source)).toEqual(["np_portal", "saved"]);
        expect(cards[0].data.npType).toBe("BAP");
    });

    it("groups by subscriber URL (ignoring a trailing slash), in first-seen order", () => {
        const cards = buildConfigCards(
            [],
            {
                a: saved({ subscriberUrl: "https://one.example.com/" }),
                b: saved({ subscriberUrl: "https://two.example.com" }),
                c: saved({ subscriberUrl: "https://one.example.com" }),
            },
            DOMAINS
        );

        expect(
            groupConfigsBySubscriberUrl(cards).map((g) => [g.subscriberUrl, g.items.length])
        ).toEqual([
            ["https://one.example.com", 2],
            ["https://two.example.com", 1],
        ]);
    });
});

describe("config list (left side)", () => {
    const renderList = (
        prefs: Record<string, IScenarioFormData>,
        selectedId: string | null = null
    ) => {
        const onSelect = jest.fn();
        const onNewSession = jest.fn();
        render(
            <ConfigList
                items={buildConfigCards([], prefs, DOMAINS)}
                selectedId={selectedId}
                onSelect={onSelect}
                onNewSession={onNewSession}
            />
        );
        return { onSelect, onNewSession };
    };
    const rows = () =>
        screen.getAllByRole("listitem").map((li) => li.querySelector("span span")?.textContent);
    const PREFS = {
        "kiranakart-buyer": saved(),
        "kiranakart-seller": saved({ npType: "BPP" }),
        "other-buyer": saved({ subscriberUrl: "https://two.example.com", usecaseId: "" }),
    };

    it("groups configs under their subscriber URL, with name, build and role", async () => {
        const { onSelect } = renderList(PREFS, "saved|kiranakart-buyer");

        const groups = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
        expect(groups).toEqual([
            "buyer.kiranakart.example.com/ondc, 2 configs",
            "two.example.com, 1 config",
        ]);
        // Only the picked config's URL starts open; the other folds open on click.
        expect(rows()).toEqual(["kiranakart-buyer", "kiranakart-seller"]);
        await userEvent.click(screen.getByRole("button", { name: /two\.example\.com/ }));
        expect(rows()).toEqual(["kiranakart-buyer", "kiranakart-seller", "other-buyer"]);
        expect(screen.getAllByText("Grocery (RET10) · v1.2.5")).toHaveLength(3);
        await userEvent.click(screen.getByRole("button", { name: /two\.example\.com/ }));
        expect(rows()).toEqual(["kiranakart-buyer", "kiranakart-seller"]);
        // Counts sit on the filter tabs, not next to the heading.
        expect(screen.getByTestId("config-count-all")).toHaveTextContent("3");
        expect(screen.getByTestId("config-count-BAP")).toHaveTextContent("2");
        expect(screen.getByTestId("config-count-BPP")).toHaveTextContent("1");
        expect(screen.getByRole("heading", { name: "Your configs" })).toHaveTextContent(
            /^Your configs$/
        );

        const selected = screen.getByRole("button", { name: /kiranakart-buyer/ });
        expect(selected).toHaveAttribute("aria-current", "true");
        await userEvent.click(screen.getByRole("button", { name: /two\.example\.com/ }));
        await userEvent.click(screen.getByRole("button", { name: /other-buyer/ }));
        expect(onSelect).toHaveBeenCalledWith("saved|other-buyer");
    });

    it("filters by Buyer apps / Seller apps", async () => {
        renderList(PREFS);
        for (const name of [/buyer\.kiranakart/, /two\.example\.com/]) {
            await userEvent.click(screen.getByRole("button", { name }));
        }

        await userEvent.click(screen.getByRole("tab", { name: /Seller apps/ }));
        expect(rows()).toEqual(["kiranakart-seller"]);
        expect(screen.getByRole("tab", { name: /Seller apps/ })).toHaveTextContent("Seller apps1");
        await userEvent.click(screen.getByRole("tab", { name: /Buyer apps/ }));
        expect(rows()).toEqual(["kiranakart-buyer", "other-buyer"]);
        await userEvent.click(screen.getByRole("tab", { name: /^All/ }));
        expect(rows()).toHaveLength(3);
    });

    it("tab counts follow the search", async () => {
        renderList(PREFS);
        await userEvent.type(
            screen.getByRole("textbox", { name: "Search configs" }),
            "two.example"
        );
        expect(screen.getByTestId("config-count-all")).toHaveTextContent("1");
        expect(screen.getByTestId("config-count-BAP")).toHaveTextContent("1");
        expect(screen.getByTestId("config-count-BPP")).toHaveTextContent("0");
    });

    it("searches by name, domain or URL, and says when nothing matches", async () => {
        renderList(PREFS);
        const search = screen.getByRole("textbox", { name: "Search configs" });

        await userEvent.type(search, "two.example");
        expect(rows()).toEqual(["other-buyer"]);
        await userEvent.clear(search);
        await userEvent.type(search, "ret10");
        expect(rows()).toHaveLength(3);
        await userEvent.clear(search);
        await userEvent.type(search, "nothing-like-this");
        expect(screen.getByText("No configs match your search.")).toBeInTheDocument();
    });

    it("offers New session when there are no configs", async () => {
        const { onNewSession } = renderList({});

        expect(screen.getByText("No configs yet")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: /New session/ }));
        expect(onNewSession).toHaveBeenCalled();
    });
});

describe("config details (right side)", () => {
    const renderPanel = (data = saved(), source: "saved" | "np_portal" = "saved") => {
        const onLaunch = jest.fn().mockResolvedValue(undefined);
        const [item] =
            source === "saved"
                ? buildConfigCards([], { "kiranakart-buyer": data }, DOMAINS)
                : buildConfigCards(
                      [
                          {
                              subscriber_url: data.subscriberUrl,
                              np_type: data.npType,
                              domain: data.domain,
                              version: data.version,
                              usecase: data.usecaseId,
                              org_id: data.orgId,
                          },
                      ],
                      {},
                      DOMAINS
                  );
        renderWithStore(
            <ConfigDetailPanel
                item={item}
                domains={DOMAINS}
                isSubmitting={false}
                onLaunch={onLaunch}
            />
        );
        return onLaunch;
    };

    it("shows a complete config, Ready to launch, with version and use case prefilled", () => {
        renderPanel();

        // Title is the friendly domain label (with code), not the saved name.
        expect(screen.getByRole("heading", { name: "Grocery (RET10)" })).toBeInTheDocument();
        // The exact domain code sits next to the title.
        expect(screen.getByText("ONDC:RET10")).toBeInTheDocument();
        expect(screen.getByText("Ready to launch")).toBeInTheDocument();
        // Header facts: subscriber URL and role (organisation is not repeated here).
        expect(screen.getAllByTestId("locked-row")).toHaveLength(2);
        expect(screen.getAllByText("Buyer App").length).toBeGreaterThan(0);
        // Version and use case are always inputs now, prefilled from the config.
        expect(screen.getByRole("combobox", { name: /^Version/ })).toHaveValue("1.2.5");
        expect(screen.getByRole("combobox", { name: /^Use case/ })).toHaveValue("GROCERY");
        expect(screen.getByRole("button", { name: "Launch" })).toBeEnabled();
    });

    it("has View report at the top and Launch at the bottom, and no Edit or last-run card", async () => {
        renderPanel();

        const viewReport = screen.getByRole("button", { name: "View report" });
        const launch = screen.getByRole("button", { name: "Launch" });
        expect(screen.queryByText(/Edit|Last run/)).not.toBeInTheDocument();
        // View report sits above Launch.
        expect(
            viewReport.compareDocumentPosition(launch) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
        await userEvent.click(viewReport);
        expect(mockNavigate).toHaveBeenCalledWith("/profile/history");
    });

    it.each(["saved", "np_portal"] as const)(
        "does not label where a %s config came from",
        (source) => {
            renderPanel(saved(), source);
            expect(screen.queryByText(/From NP Portal|Saved config/)).not.toBeInTheDocument();
        }
    );

    it("launches with the config's details", async () => {
        const onLaunch = renderPanel();
        await userEvent.click(screen.getByRole("button", { name: "Launch" }));

        await waitFor(() =>
            expect(onLaunch).toHaveBeenCalledWith(expect.objectContaining(saved()))
        );
    });

    it("asks only for what is missing, and only enables Launch once it is filled", async () => {
        const onLaunch = renderPanel(saved({ usecaseId: "" }));

        expect(screen.getByText("1 detail to fill before launch")).toBeInTheDocument();
        expect(screen.getByText("Use case")).toBeInTheDocument();
        // Header facts: subscriber URL and role (organisation is not repeated here).
        expect(screen.getAllByTestId("locked-row")).toHaveLength(2);
        expect(screen.getByRole("button", { name: "Launch" })).toBeDisabled();

        await userEvent.click(screen.getByRole("combobox", { name: /^Use case/ }));
        await userEvent.click(await screen.findByRole("option", { name: "GROCERY" }));
        expect(await screen.findByText("Ready to launch")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Launch" }));
        await waitFor(() =>
            expect(onLaunch).toHaveBeenCalledWith(expect.objectContaining({ usecaseId: "GROCERY" }))
        );
    });

    it("auto-fills and locks a field that has only one option, with no dropdown arrow", async () => {
        const single = [
            { key: "ONDC:RET10", version: [{ key: "1.2.5", usecase: ["GROCERY"] }] },
        ] as unknown as IDomain[];
        const [item] = buildConfigCards(
            [],
            { c: saved({ version: "9.9.9", usecaseId: "PIZZA" }) },
            single
        );
        renderWithStore(
            <ConfigDetailPanel
                item={item}
                domains={single}
                isSubmitting={false}
                onLaunch={jest.fn()}
            />
        );

        // The one version and one use case fill themselves in — nothing left to pick.
        expect(await screen.findByText("Ready to launch")).toBeInTheDocument();
        const version = screen.getByRole("combobox", { name: /^Version/ });
        expect(version).toBeDisabled();
        expect(version).toHaveValue("1.2.5");
        // A locked single-value field shows no dropdown arrow.
        expect(
            version
                .closest("[data-slot=input-group]")
                ?.querySelector("[data-slot=combobox-trigger-icon]")
        ).toBeNull();
    });

    it("uses the user's only organisation when the config's isn't theirs, without asking", async () => {
        const onLaunch = renderPanel(saved({ orgId: "99001" }));

        expect(screen.queryByText("Select Organisation")).not.toBeInTheDocument();
        expect(screen.getByText("Ready to launch")).toBeInTheDocument();
        // The organisation isn't shown on the card, but it is used on launch.
        await userEvent.click(screen.getByRole("button", { name: "Launch" }));
        await waitFor(() =>
            expect(onLaunch).toHaveBeenCalledWith(expect.objectContaining({ orgId: "11899" }))
        );
    });

    it("puts the version and use case inputs after the known facts", () => {
        renderPanel(saved({ usecaseId: "" }));

        const fillIn = screen.getByTestId("fill-in-section");
        expect(within(fillIn).getByRole("combobox", { name: /^Version/ })).toBeInTheDocument();
        expect(within(fillIn).getByRole("combobox", { name: /^Use case/ })).toBeInTheDocument();
        expect(within(fillIn).queryByTestId("locked-row")).not.toBeInTheDocument();
        const known = screen.getAllByTestId("locked-row");
        // The inputs come after the known facts.
        expect(
            known[known.length - 1].compareDocumentPosition(fillIn) &
                Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
    });

    it("always shows the version and use case inputs, even for a complete config", () => {
        renderPanel();
        const fillIn = screen.getByTestId("fill-in-section");
        expect(within(fillIn).getByRole("combobox", { name: /^Version/ })).toBeInTheDocument();
        expect(within(fillIn).getByRole("combobox", { name: /^Use case/ })).toBeInTheDocument();
    });

    it("says how many details are missing, with no extra line", () => {
        renderPanel(saved({ usecaseId: "" }));
        expect(screen.getByRole("alert")).toHaveTextContent(/^1 detail to fill before launch$/);
    });

    it("asks which organisation when the config's isn't one of the user's (several orgs)", () => {
        mockUser = {
            username: "1",
            organisations: [
                { organisationId: "11899", organisationName: "UAT_1 Org" },
                { organisationId: "22222", organisationName: "Other Org" },
            ],
        };
        renderPanel(saved({ orgId: "99001" }));

        expect(screen.getByText("Select Organisation")).toBeInTheDocument();
        expect(within(document.body).queryByText(/99001/)).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Launch" })).toBeDisabled();
    });
});

describe("NP Portal configs from SSO", () => {
    // Shaped like the real UAT SSO reply (19 Nov 2026), via /auth/api/me.
    const sso = (over: Partial<IUserOrganisationConfig> = {}): IUserOrganisationConfig => ({
        environmentAccessId: "5128",
        environment: "Pre-Prod",
        status: "Subscribed",
        requestType: "Update Request",
        subscriberId: "newuattet22442.com",
        subscriberUrl: "https://newuattet22442.com/",
        npType: "BPP",
        domain: "ONDC:RET10",
        version: "1.2.5",
        useCase: "GROCERY",
        ...over,
    });
    const userWith = (...orgs: { id: string; configs?: IUserOrganisationConfig[] }[]) =>
        ({
            username: "25716",
            organisations: orgs.map((o) => ({
                organisationId: o.id,
                organisationName: `Org ${o.id}`,
                networkStatus: "3",
                npType: "Admin",
                isRepresentative: true,
                status: 1,
                subscriberIds: [],
                configs: o.configs,
            })),
        }) as unknown as IUser;
    const DOMAINS_WITH_LOG = [
        ...DOMAINS,
        { key: "ONDC:LOG10", version: [{ key: "1.2.5", usecase: ["Logistics (P2P)"] }] },
    ] as unknown as IDomain[];

    it("reads every organisation's configs, tagged with that organisation", () => {
        const configs = npPortalConfigsFromUser(
            userWith(
                { id: "11899", configs: [sso()] },
                { id: "22222", configs: [sso({ npType: "BAP" })] }
            )
        );
        expect(configs).toEqual([
            {
                subscriber_url: "https://newuattet22442.com/",
                np_type: "BPP",
                domain: "ONDC:RET10",
                version: "1.2.5",
                usecase: "GROCERY",
                org_id: "11899",
            },
            expect.objectContaining({ np_type: "BAP", org_id: "22222" }),
        ]);
    });

    it.each([
        ["no user (logged out)", undefined],
        ["a GitHub user (no organisations)", { username: "octo" } as IUser],
        ["an organisation without configs", userWith({ id: "1" })],
        ["an organisation with an empty list", userWith({ id: "1", configs: [] })],
    ])("gives no configs for %s", (_case, user) => {
        expect(npPortalConfigsFromUser(user)).toEqual([]);
    });

    it("makes one card per URL + role + domain + version + use case, and drops exact repeats", () => {
        const configs = npPortalConfigsFromUser(
            userWith({
                id: "11899",
                configs: [
                    sso(),
                    sso({ environmentAccessId: "999" }), // same five details: a repeat
                    sso({ npType: "BAP" }),
                    sso({ domain: "ONDC:LOG10", useCase: "Logistics (P2P)" }),
                    sso({ subscriberUrl: "https://other.example.com" }),
                ],
            })
        );
        const cards = buildConfigCards(configs, {}, DOMAINS_WITH_LOG);

        expect(cards).toHaveLength(4);
        expect(cards.every((c) => c.source === "np_portal" && !c.name)).toBe(true);
        const groups = groupConfigsBySubscriberUrl(cards);
        expect(groups.map((g) => [g.subscriberUrl, g.items.length])).toEqual([
            ["https://newuattet22442.com", 3],
            ["https://other.example.com", 1],
        ]);
    });

    it("never uses NP Portal's version or use case; uses URL, role and domain as sent", () => {
        const cards = buildConfigCards(
            npPortalConfigsFromUser(
                userWith({
                    id: "11899",
                    configs: [
                        sso(), // even exact Workbench values are not used
                        sso({ npType: "Admin" }),
                        sso({ subscriberUrl: "" }),
                    ],
                })
            ),
            {},
            DOMAINS
        );
        expect(cards.map((c) => [c.data.version, c.data.usecaseId])).toEqual([
            ["", ""],
            ["", ""],
            ["", ""],
        ]);
        expect(cards.map((c) => c.missingFields)).toEqual([
            ["version", "usecaseId"],
            ["npType", "version", "usecaseId"],
            ["subscriberUrl", "version", "usecaseId"],
        ]);
    });

    it("drops an NP Portal config whose domain Workbench has no flows for at all", () => {
        const cards = buildConfigCards(
            npPortalConfigsFromUser(
                userWith({
                    id: "11899",
                    configs: [
                        sso(), // ONDC:RET10, supported — kept
                        sso({ domain: "ONDC:RET1A" }), // not in DOMAINS — dropped
                        sso({ domain: "ONDC:RET1B", npType: "BAP" }), // also dropped
                    ],
                })
            ),
            {},
            DOMAINS
        );
        // Only the supported-domain config becomes a card; the unsupported ones
        // are left out entirely rather than shown asking the user to pick a domain.
        expect(cards).toHaveLength(1);
        expect(cards[0].data.domain).toBe("ONDC:RET10");
    });

    it("keeps a saved config even when its domain isn't in Workbench's current list", () => {
        // Saved configs are never dropped: the user picked this domain from
        // Workbench's own list when they saved it, so it's trusted as-is.
        const cards = buildConfigCards(
            [],
            { "old-config": saved({ domain: "ONDC:RET1A" }) },
            DOMAINS
        );
        expect(cards).toHaveLength(1);
        expect(cards[0].data.domain).toBe("ONDC:RET1A");
        expect(cards[0].missingFields).toContain("domain");
    });

    it("treats configs that differ only by version or use case as one", () => {
        const cards = buildConfigCards(
            npPortalConfigsFromUser(
                userWith({
                    id: "11899",
                    configs: [
                        sso({ version: "v 1.2", useCase: "Grocery" }),
                        sso({ version: "v 2.0.0", useCase: "Something else" }),
                    ],
                })
            ),
            {},
            DOMAINS
        );
        expect(cards).toHaveLength(1);
    });

    it("shows NP Portal and saved configs together", () => {
        const cards = buildConfigCards(
            npPortalConfigsFromUser(userWith({ id: "11899", configs: [sso()] })),
            { mine: saved() },
            DOMAINS
        );
        expect(cards.map((c) => c.source)).toEqual(["np_portal", "saved"]);
    });

    it("never writes a version as 'vv'", () => {
        expect(versionLabel("1.2.5")).toBe("v1.2.5");
        expect(versionLabel("v 1.2")).toBe("v 1.2");
        expect(versionLabel("V2.0.0")).toBe("V2.0.0");
        expect(versionLabel("")).toBe("");
        expect(versionLabel(undefined)).toBe("");
    });

    it("lists an NP Portal config by its domain, asking for version and use case at launch", () => {
        const cards = buildConfigCards(
            npPortalConfigsFromUser(
                userWith({ id: "11899", configs: [sso({ version: "v 1.2" })] })
            ),
            {},
            DOMAINS
        );
        render(
            <ConfigList
                items={cards}
                selectedId={cards[0].id}
                onSelect={jest.fn()}
                onNewSession={jest.fn()}
            />
        );
        expect(screen.getByText("Grocery (RET10)")).toBeInTheDocument();
        expect(screen.getByText("ONDC:RET10")).toBeInTheDocument();
        expect(screen.queryByText(/v 1\.2|vv/)).not.toBeInTheDocument();
    });

    it("names each row's organisation when the user has more than one", () => {
        const cards = buildConfigCards(
            npPortalConfigsFromUser(
                userWith({ id: "11899", configs: [sso()] }, { id: "99001", configs: [sso()] })
            ),
            {},
            DOMAINS
        );
        expect(cards).toHaveLength(2); // same five details, different organisations
        const { rerender } = render(
            <ConfigList
                items={cards}
                selectedId={cards[0].id}
                onSelect={jest.fn()}
                onNewSession={jest.fn()}
                organisationNames={{ "11899": "UAT_1 Org", "99001": "Second Org" }}
            />
        );
        expect(screen.getByText("ONDC:RET10 · UAT_1 Org")).toBeInTheDocument();
        expect(screen.getByText("ONDC:RET10 · Second Org")).toBeInTheDocument();

        rerender(
            <ConfigList
                items={cards}
                selectedId={cards[0].id}
                onSelect={jest.fn()}
                onNewSession={jest.fn()}
            />
        );
        expect(screen.queryByText(/UAT_1 Org|Second Org/)).not.toBeInTheDocument();
    });

    describe("details of an NP Portal config", () => {
        const renderSso = (config: IUserOrganisationConfig) => {
            const onLaunch = jest.fn().mockResolvedValue(undefined);
            const [item] = buildConfigCards(
                npPortalConfigsFromUser(userWith({ id: "11899", configs: [config] })),
                {},
                DOMAINS
            );
            renderWithStore(
                <ConfigDetailPanel
                    item={item}
                    domains={DOMAINS}
                    isSubmitting={false}
                    onLaunch={onLaunch}
                />
            );
            return onLaunch;
        };

        it("always asks for version and use case, then launches with the picked ones and its organisation", async () => {
            const onLaunch = renderSso(sso()); // even exact Workbench values from NP Portal
            expect(screen.getByText("2 details to fill before launch")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Launch" })).toBeDisabled();
            const fillIn = screen.getByTestId("fill-in-section");
            expect(within(fillIn).getByRole("combobox", { name: /^Version/ })).toBeInTheDocument();
            expect(within(fillIn).getByRole("combobox", { name: /^Use case/ })).toBeDisabled();

            await userEvent.click(screen.getByRole("combobox", { name: /^Version/ }));
            await userEvent.click(await screen.findByRole("option", { name: "1.2.5" }));
            expect(screen.getByText("1 detail to fill before launch")).toBeInTheDocument();
            await userEvent.click(screen.getByRole("combobox", { name: /^Use case/ }));
            await userEvent.click(await screen.findByRole("option", { name: "GROCERY" }));
            expect(await screen.findByText("Ready to launch")).toBeInTheDocument();

            await userEvent.click(screen.getByRole("button", { name: "Launch" }));
            await waitFor(() =>
                expect(onLaunch).toHaveBeenCalledWith(
                    expect.objectContaining({
                        subscriberUrl: "https://newuattet22442.com/",
                        npType: "BPP",
                        domain: "ONDC:RET10",
                        version: "1.2.5",
                        usecaseId: "GROCERY",
                        orgId: "11899",
                    })
                )
            );
        });

        it("doesn't show NP Portal's version or use case anywhere", () => {
            renderSso(sso({ version: "v 1.2", useCase: "Grocery" }));
            expect(screen.queryByText(/v 1\.2/)).not.toBeInTheDocument();
            expect(screen.queryByText("Grocery")).not.toBeInTheDocument();
            expect(screen.getByRole("heading", { name: "Grocery (RET10)" })).toBeInTheDocument();
        });

        it("shows no 'NP Portal sent' notes for a saved config whose domain Workbench doesn't have", () => {
            // An NP Portal config with an unsupported domain is dropped before this
            // panel ever renders (see buildConfigCards); a saved config isn't, so
            // this is the one path where the "unsupported domain" detail view still
            // has to work.
            const onLaunch = jest.fn().mockResolvedValue(undefined);
            const [item] = buildConfigCards(
                [],
                { "old-config": saved({ domain: "ONDC:RET1A" }) },
                DOMAINS
            );
            renderWithStore(
                <ConfigDetailPanel
                    item={item}
                    domains={DOMAINS}
                    isSubmitting={false}
                    onLaunch={onLaunch}
                />
            );
            expect(screen.queryByText(/NP Portal sent/)).not.toBeInTheDocument();
            expect(screen.queryByTestId("sent-value")).not.toBeInTheDocument();
            expect(screen.getByRole("combobox", { name: /^Domain/ })).toBeInTheDocument();
        });

        it("clears the use case when the version changes", async () => {
            renderSso(sso());
            await userEvent.click(screen.getByRole("combobox", { name: /^Version/ }));
            await userEvent.click(await screen.findByRole("option", { name: "1.2.5" }));
            await userEvent.click(screen.getByRole("combobox", { name: /^Use case/ }));
            await userEvent.click(await screen.findByRole("option", { name: "GROCERY" }));
            expect(await screen.findByText("Ready to launch")).toBeInTheDocument();
            await userEvent.click(screen.getByRole("combobox", { name: /^Version/ }));
            await userEvent.click(await screen.findByRole("option", { name: "1.2.5" }));
            expect(screen.getByText("1 detail to fill before launch")).toBeInTheDocument();
        });
    });
});

describe("configs for the organisation the user is working for", () => {
    const np = (org: string) => ({
        subscriber_url: `https://${org}.example.com`,
        np_type: "BAP",
        domain: "ONDC:RET10",
        org_id: org,
    });
    const prefs = {
        "for-11899": saved({ orgId: "11899" }),
        "for-99001": saved({ orgId: "99001" }),
        "no-org": saved({ orgId: undefined }),
    };

    it("keeps only that organisation's NP Portal configs and saved configs (plus ones with no organisation)", () => {
        const out = configsForOrganisation([np("11899"), np("99001")], prefs, "99001");
        expect(out.npPortalConfigs.map((c) => c.org_id)).toEqual(["99001"]);
        expect(Object.keys(out.savedPreferences)).toEqual(["for-99001", "no-org"]);
    });

    it("hides nothing when there is no organisation", () => {
        const out = configsForOrganisation([np("11899"), np("99001")], prefs, undefined);
        expect(out.npPortalConfigs).toHaveLength(2);
        expect(Object.keys(out.savedPreferences)).toHaveLength(3);
    });
});
