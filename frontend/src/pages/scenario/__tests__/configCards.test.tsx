import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { IDomain } from "@pages/schema-validation/types";
import { ConfigList } from "@pages/scenario/ConfigList";
import { ConfigDetailPanel } from "@pages/scenario/ConfigDetailPanel";
import {
    buildConfigCards,
    findMissingFields,
    groupConfigsBySubscriberUrl,
} from "@pages/scenario/helpers";
import type { IScenarioFormData } from "@pages/scenario/types";

// constants.ts reads import.meta, which Jest cannot parse.
jest.mock("@pages/scenario/constants", () => ({
    getScenarioDomainLabel: (key: string) => ({ "ONDC:RET10": "Grocery (RET10)" })[key] ?? key,
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
    { key: "ONDC:RET10", version: [{ key: "1.2.5", usecase: ["GROCERY"] }] },
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

    it("groups configs under their subscriber URL, with name, build, role and a status dot", async () => {
        const { onSelect } = renderList(PREFS, "saved|kiranakart-buyer");

        const groups = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
        expect(groups).toEqual(["buyer.kiranakart.example.com/ondc· 2", "two.example.com· 1"]);
        // Only the picked config's URL starts open; the other folds open on click.
        expect(rows()).toEqual(["kiranakart-buyer", "kiranakart-seller"]);
        await userEvent.click(screen.getByRole("button", { name: /two\.example\.com/ }));
        expect(rows()).toEqual(["kiranakart-buyer", "kiranakart-seller", "other-buyer"]);
        expect(screen.getAllByText("Grocery (RET10) · v1.2.5")).toHaveLength(3);
        expect(screen.getAllByText("Ready to launch")).toHaveLength(2);
        expect(screen.getByText("Needs input")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: /two\.example\.com/ }));
        expect(rows()).toEqual(["kiranakart-buyer", "kiranakart-seller"]);
        expect(screen.getByTestId("config-count")).toHaveTextContent("3");

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

        await userEvent.click(screen.getByRole("tab", { name: "Seller apps" }));
        expect(rows()).toEqual(["kiranakart-seller"]);
        expect(screen.getByTestId("config-count")).toHaveTextContent("1");
        await userEvent.click(screen.getByRole("tab", { name: "Buyer apps" }));
        expect(rows()).toEqual(["kiranakart-buyer", "other-buyer"]);
        await userEvent.click(screen.getByRole("tab", { name: "All" }));
        expect(rows()).toHaveLength(3);
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
        render(
            <ConfigDetailPanel
                item={item}
                domains={DOMAINS}
                isSubmitting={false}
                onLaunch={onLaunch}
            />
        );
        return onLaunch;
    };

    it("shows a complete config read-only, 2 per row, as Ready to launch", () => {
        renderPanel();

        expect(screen.getByRole("heading", { name: "kiranakart-buyer" })).toBeInTheDocument();
        expect(screen.getByText("Ready to launch")).toBeInTheDocument();
        expect(screen.getAllByTestId("locked-row")).toHaveLength(6);
        expect(screen.getAllByTestId("locked-row")[0].parentElement?.className).toContain(
            "sm:grid-cols-2"
        );
        expect(screen.getByText("UAT_1 Org (11899)")).toBeInTheDocument();
        expect(screen.getAllByText("Buyer App (BAP)").length).toBeGreaterThan(0);
        expect(screen.getByRole("button", { name: "Launch" })).toBeEnabled();
    });

    it("has Launch and View report at the top, and no Edit or last-run card", async () => {
        renderPanel();

        const buttons = screen.getAllByRole("button").map((b) => b.textContent);
        expect(buttons).toEqual(["Launch", "View report"]);
        expect(screen.queryByText(/Edit|Last run/)).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "View report" }));
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
        expect(screen.getAllByTestId("locked-row")).toHaveLength(5);
        expect(screen.getByRole("button", { name: "Launch" })).toBeDisabled();

        await userEvent.click(screen.getByPlaceholderText("Select use case"));
        await userEvent.click(await screen.findByRole("option", { name: "GROCERY" }));
        expect(await screen.findByText("Ready to launch")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Launch" }));
        await waitFor(() =>
            expect(onLaunch).toHaveBeenCalledWith(expect.objectContaining({ usecaseId: "GROCERY" }))
        );
    });

    it("uses the user's only organisation when the config's isn't theirs, without asking", async () => {
        const onLaunch = renderPanel(saved({ orgId: "99001" }));

        expect(screen.queryByText("Select Organisation")).not.toBeInTheDocument();
        expect(screen.getByText("UAT_1 Org (11899)")).toBeInTheDocument();
        expect(screen.getByText("Ready to launch")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Launch" }));
        await waitFor(() =>
            expect(onLaunch).toHaveBeenCalledWith(expect.objectContaining({ orgId: "11899" }))
        );
    });

    it("puts the missing details in their own section below the known ones", () => {
        renderPanel(saved({ usecaseId: "" }));

        const fillIn = screen.getByTestId("fill-in-section");
        expect(within(fillIn).getByText("Fill in to launch")).toBeInTheDocument();
        expect(within(fillIn).getByPlaceholderText("Select use case")).toBeInTheDocument();
        expect(within(fillIn).queryByTestId("locked-row")).not.toBeInTheDocument();
        const known = screen.getAllByTestId("locked-row");
        expect(known.map((r) => r.firstChild?.textContent)).not.toContain("Use case");
        // The fill-in section comes after the known details.
        expect(
            known[known.length - 1].compareDocumentPosition(fillIn) &
                Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
    });

    it("has no fill-in section when nothing is missing", () => {
        renderPanel();
        expect(screen.queryByTestId("fill-in-section")).not.toBeInTheDocument();
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
        expect(within(document.body).queryByText("99001")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Launch" })).toBeDisabled();
    });
});
