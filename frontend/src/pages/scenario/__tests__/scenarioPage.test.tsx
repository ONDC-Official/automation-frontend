import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { LoginGate } from "@pages/scenario/LoginGate";
import { SessionFormActions } from "@pages/scenario/SessionFormActions";
import { ManualSessionForm } from "@pages/scenario/ManualSessionForm";
import { ScenarioGuideDialog } from "@pages/scenario/ScenarioGuideDialog";
import { LocationSessionHistory } from "@pages/scenario/LocationSessionHistory";
import type { INewSessionFormValues } from "@pages/scenario/types";

// constants.ts reads import.meta, which Jest cannot parse.
jest.mock("@pages/scenario/constants", () => ({
    getScenarioDomainLabel: (key: string) => key,
    sortedDomainOptions: (domains: { key: string }[]) =>
        domains.map((d) => ({ value: d.key, label: d.key })),
    SESSIONS_PER_PAGE: 4,
}));
jest.mock("@hooks/useLoginLabel", () => ({
    useLoginLabel: () => ({ provider: "ondc", label: "Login via ONDC" }),
}));
let mockUser: object | undefined;
jest.mock("@hooks/useAuth", () => ({ useAuth: () => ({ user: mockUser }) }));
// The organisation the user is working for (normally from the store).
type IMockOrg = { organisationId: string; organisationName: string };
let mockActiveOrg: { organisations: IMockOrg[]; activeOrganisation?: IMockOrg } = {
    organisations: [],
};
jest.mock("@hooks/useActiveOrganisation", () => ({
    useActiveOrganisation: () => ({
        ...mockActiveOrg,
        needsChoice: false,
        setActiveOrganisation: jest.fn(),
    }),
    organisationLabel: (o?: IMockOrg) => (o ? o.organisationName || o.organisationId : ""),
}));
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }));

beforeEach(() => {
    mockUser = undefined;
    mockActiveOrg = { organisations: [] };
    jest.clearAllMocks();
});

describe("LoginGate (logged out)", () => {
    const renderGate = (onLogin = jest.fn()) => {
        render(
            <LoginGate isLoggedOut isLoginRedirecting={false} onLogin={onLogin}>
                {({ isGuest, leaveGuest }) => (
                    <div>
                        <p>the form (guest: {String(isGuest)})</p>
                        <button onClick={leaveGuest}>Cancel</button>
                    </div>
                )}
            </LoginGate>
        );
        return onLogin;
    };

    it("asks to log in to run tests, with a 48px login button", async () => {
        const onLogin = renderGate();

        expect(
            screen.getByRole("heading", { name: "Log in to run your tests" })
        ).toBeInTheDocument();
        const login = screen.getByRole("button", { name: "Login via ONDC" });
        expect(login).toHaveAttribute("data-size", "lg");
        await userEvent.click(login);
        expect(onLogin).toHaveBeenCalled();
        expect(screen.queryByText(/the form/)).not.toBeInTheDocument();
    });

    it("lists what logging in gives, each with its icon", () => {
        renderGate();

        const items = within(screen.getByRole("list", { name: "Why log in" })).getAllByRole(
            "listitem"
        );
        expect(items.map((li) => li.querySelector(".text-body-1")?.textContent)).toEqual([
            "Saved Configs",
            "Sessions & Reports",
            "Reuse Configs",
        ]);
        items.forEach((li) => expect(li.querySelector("svg")).not.toBeNull());
    });

    it("'Continue without login' is a text link that shows the form as a guest", async () => {
        renderGate();

        const link = screen.getByRole("button", { name: "Continue without login" });
        expect(link).not.toHaveAttribute("data-slot", "button");
        expect(link.className).toContain("hover:underline");
        await userEvent.click(link);
        expect(screen.getByText("the form (guest: true)")).toBeInTheDocument();
    });

    it("Cancel takes a guest back to the login prompt", async () => {
        renderGate();
        await userEvent.click(screen.getByRole("button", { name: "Continue without login" }));
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(
            screen.getByRole("heading", { name: "Log in to run your tests" })
        ).toBeInTheDocument();
    });

    it("shows the form straight away when logged in", () => {
        render(
            <LoginGate isLoggedOut={false} isLoginRedirecting={false} onLogin={jest.fn()}>
                {({ isGuest }) => <p>the form (guest: {String(isGuest)})</p>}
            </LoginGate>
        );
        expect(screen.getByText("the form (guest: false)")).toBeInTheDocument();
    });
});

describe("LoginGate (page-controlled guest state)", () => {
    it("asks the page to open and close the guest form, and follows what it says", async () => {
        const onContinueWithoutLogin = jest.fn();
        const onLeaveGuest = jest.fn();
        const gate = (isGuest: boolean) => (
            <LoginGate
                isLoggedOut
                isLoginRedirecting={false}
                onLogin={jest.fn()}
                isGuest={isGuest}
                onContinueWithoutLogin={onContinueWithoutLogin}
                onLeaveGuest={onLeaveGuest}
            >
                {({ isGuest: guest, leaveGuest }) => (
                    <div>
                        <p>the form (guest: {String(guest)})</p>
                        <button onClick={leaveGuest}>Cancel</button>
                    </div>
                )}
            </LoginGate>
        );
        const { rerender } = render(gate(false));
        await userEvent.click(screen.getByRole("button", { name: "Continue without login" }));
        expect(onContinueWithoutLogin).toHaveBeenCalled();
        expect(screen.queryByText(/the form/)).not.toBeInTheDocument(); // the page decides

        rerender(gate(true));
        expect(screen.getByText("the form (guest: true)")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onLeaveGuest).toHaveBeenCalled();
    });
});

describe("Form buttons", () => {
    it("puts Cancel left of a 48px Submit, both on the right", () => {
        render(<SessionFormActions isSubmitting={false} onCancel={jest.fn()} />);

        const buttons = screen.getAllByRole("button").map((b) => b.textContent);
        expect(buttons).toEqual(["Cancel", "Submit"]);
        expect(screen.getByRole("button", { name: "Submit" })).toHaveAttribute("data-size", "lg");
        expect(screen.getByRole("button", { name: "Cancel" }).parentElement?.className).toContain(
            "justify-end"
        );
    });

    it("has no Cancel when nobody handles it", () => {
        render(<SessionFormActions isSubmitting={false} />);
        expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    });
});

describe("Create new session form", () => {
    const Form = ({ onCancel = jest.fn(), onFormSubmit = jest.fn() }) => {
        const { control, handleSubmit, watch, register, formState } =
            useForm<INewSessionFormValues>({
                defaultValues: {
                    subscriberUrl: "",
                    domain: "",
                    version: "",
                    usecaseId: "",
                    npType: "BAP",
                    env: "PRE-PRODUCTION",
                    orgId: "",
                    config: "",
                },
            });
        return (
            <ManualSessionForm
                domains={[]}
                hasSavedPrefs={false}
                isLoggedIn={false}
                isSubmitting={false}
                control={control}
                register={register}
                errors={formState.errors}
                handleSubmit={handleSubmit}
                watch={watch}
                versionOptions={[]}
                usecaseOptions={[]}
                onFormSubmit={onFormSubmit}
                onBackToSavedConfigs={jest.fn()}
                onDomainChange={jest.fn()}
                onVersionChange={jest.fn()}
                onConfigChange={jest.fn()}
                onCancel={onCancel}
            />
        );
    };

    it("lays the fields out two per row, an odd last field taking the whole row", () => {
        render(<Form />);

        const group = screen.getByLabelText(/^Subscriber URL/).closest("[data-slot=field-group]");
        expect(group?.className).toContain("sm:grid-cols-2");
        expect(group?.className).toContain("[&>*:last-child:nth-child(odd)]:col-span-2");
        expect(group?.children).toHaveLength(5);
        expect(screen.queryByText(/Environment/)).not.toBeInTheDocument();
    });

    it("puts each label inside its 52px box, with the help 'i' inside on the right", () => {
        render(<Form />);

        const url = screen.getByLabelText(/^Subscriber URL/);
        expect(url.className).toContain("h-13");
        for (const label of ["Subscriber URL", "Domain", "Version", "Use case", "Your role"]) {
            expect(screen.getByRole("button", { name: `About ${label}` })).toBeInTheDocument();
        }
        // The label comes right after its input, inside the same box.
        expect(url.nextElementSibling?.tagName).toBe("LABEL");
    });

    it("has no Past Report button", () => {
        mockUser = { username: "25716" };
        render(<Form />);
        expect(screen.queryByRole("button", { name: "Past Report" })).not.toBeInTheDocument();
    });

    it("shows the organisation being worked for as text (name only), not a field", () => {
        const uat = { organisationId: "11899", organisationName: "UAT_1 Org" };
        mockActiveOrg = { organisations: [uat], activeOrganisation: uat };
        render(<Form />);

        expect(screen.getByTestId("current-organisation")).toHaveTextContent(
            /^Organisation: UAT_1 Org$/
        );
        expect(screen.queryByRole("combobox", { name: /^Organisation/ })).not.toBeInTheDocument();
        expect(screen.queryByText(/11899/)).not.toBeInTheDocument();
    });

    it("shows the picked organisation for users with several (no extra hint)", () => {
        const uat = { organisationId: "11899", organisationName: "UAT_1 Org" };
        const second = { organisationId: "99001", organisationName: "UAT_2 Test Org" };
        mockActiveOrg = { organisations: [uat, second], activeOrganisation: second };
        render(<Form />);

        expect(screen.getByTestId("current-organisation")).toHaveTextContent(
            /^Organisation: UAT_2 Test Org$/
        );
    });

    it("shows no organisation when logged out", () => {
        render(<Form />);
        expect(screen.queryByTestId("current-organisation")).not.toBeInTheDocument();
    });

    it("has no Create profile config button, and Cancel calls back", async () => {
        const onCancel = jest.fn();
        render(<Form onCancel={onCancel} />);

        expect(
            screen.queryByRole("button", { name: /Create profile config/ })
        ).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onCancel).toHaveBeenCalled();
    });
});

describe("How it works", () => {
    // jsdom has no PointerEvent; a MouseEvent that carries pointerType is enough here.
    beforeAll(() => {
        if (!("PointerEvent" in window)) {
            class FakePointerEvent extends MouseEvent {
                pointerType: string;
                constructor(type: string, init: PointerEventInit = {}) {
                    super(type, init);
                    this.pointerType = init.pointerType ?? "mouse";
                }
            }
            Object.assign(window, { PointerEvent: FakePointerEvent });
        }
    });
    const renderGuide = (open = true) => {
        const onOpenChange = jest.fn();
        const view = render(<ScenarioGuideDialog open={open} onOpenChange={onOpenChange} />);
        return { ...view, onOpenChange };
    };
    const slides = () => screen.getAllByRole("group", { hidden: true });
    const shownSlide = () => slides().find((s) => s.getAttribute("aria-hidden") === "false");
    const counter = () => screen.getByText(/^\d of 3$/);
    // Wide screens show a second set of arrows/dots beside the pop-up; use the first set.
    const next = () => screen.getAllByRole("button", { name: "Next slide" })[0];
    const prev = () => screen.getAllByRole("button", { name: "Previous slide" })[0];

    it("opens on slide 1 with the intro, its four features and the safe-place tip", () => {
        renderGuide();

        expect(screen.getByRole("dialog", { name: "How it works" })).toBeInTheDocument();
        expect(counter()).toHaveTextContent("1 of 3");
        expect(slides()).toHaveLength(3);
        const slide = shownSlide()!;
        expect(slide).toHaveAccessibleName("1 of 3: What Workbench is");
        expect(within(slide).getByRole("heading", { name: "ONDC Workbench" })).toBeInTheDocument();
        expect(within(slide).getByText("A safe place to test")).toBeInTheDocument();
        expect(slide).toHaveTextContent("a dedicated testing suite called Scenario Testing");
        for (const title of [
            "Run scenarios",
            "Identify & fix issues",
            "Check responses",
            "Test multiple scenarios",
        ]) {
            expect(within(slide).getAllByText(title).length).toBeGreaterThan(0);
        }
        expect(within(slide).getByTestId("feature-connectors")).toBeInTheDocument();
    });

    it("only the shown slide can be read or focused", () => {
        renderGuide();
        const hidden = slides().filter((s) => s !== shownSlide());
        expect(hidden).toHaveLength(2);
        hidden.forEach((s) => expect(s).toHaveAttribute("inert"));
    });

    it("moves with the arrows, and they stop at the ends", async () => {
        renderGuide();
        expect(prev()).toBeDisabled();

        await userEvent.click(next());
        expect(counter()).toHaveTextContent("2 of 3");
        const domain = shownSlide()!;
        expect(within(domain).getByRole("heading", { name: "Your Domain" })).toBeInTheDocument();
        expect(within(domain).getByText("Workbench will act as a Buyer")).toBeInTheDocument();
        expect(within(domain).getByText("Workbench will act as a Seller")).toBeInTheDocument();
        // Each role box centres its icon and text top-to-bottom.
        for (const title of ["Workbench will act as a Buyer", "Workbench will act as a Seller"]) {
            expect(within(domain).getByText(title).closest(".rounded-2xl")?.className).toContain(
                "items-center"
            );
        }
        for (const action of ["Search", "Select", "Init", "Return", "Refund", "Status"]) {
            expect(within(domain).getByText(action)).toBeInTheDocument();
        }

        await userEvent.click(next());
        expect(counter()).toHaveTextContent("3 of 3");
        expect(next()).toBeDisabled();
        const network = shownSlide()!;
        expect(
            within(network).getByRole("heading", { name: "Transact On ONDC Network" })
        ).toBeInTheDocument();
        expect(within(network).getAllByText("checked")).toHaveLength(5);
        expect(
            within(network).getByRole("figure", { name: "Sample search request" })
        ).toHaveTextContent('"domain": "ONDC:RET10"');

        await userEvent.click(prev());
        expect(counter()).toHaveTextContent("2 of 3");
    });

    it("jumps with the dots and marks the current one", async () => {
        renderGuide();
        const dot3 = screen.getAllByRole("button", { name: /Go to slide 3/ })[0];

        await userEvent.click(dot3);
        expect(counter()).toHaveTextContent("3 of 3");
        expect(dot3).toHaveAttribute("aria-current", "step");
        expect(screen.getAllByRole("button", { name: /Go to slide 1/ })[0]).not.toHaveAttribute(
            "aria-current"
        );
    });

    it("moves with the keyboard's left and right keys", async () => {
        renderGuide();
        await userEvent.keyboard("{ArrowRight}");
        expect(counter()).toHaveTextContent("2 of 3");
        await userEvent.keyboard("{ArrowRight}{ArrowRight}");
        expect(counter()).toHaveTextContent("3 of 3");
        await userEvent.keyboard("{ArrowLeft}");
        expect(counter()).toHaveTextContent("2 of 3");
    });

    it("moves with a swipe on touch screens, but not a short drag or a mouse", () => {
        renderGuide();
        const area = screen.getByRole("region", { name: "How Scenario Testing works" });
        const swipe = (from: number, to: number, pointerType = "touch") => {
            fireEvent.pointerDown(area, { clientX: from, pointerType });
            fireEvent.pointerUp(area, { clientX: to, pointerType });
        };

        swipe(300, 200);
        expect(counter()).toHaveTextContent("2 of 3");
        swipe(300, 280);
        expect(counter()).toHaveTextContent("2 of 3");
        swipe(300, 100, "mouse");
        expect(counter()).toHaveTextContent("2 of 3");
        swipe(100, 300);
        expect(counter()).toHaveTextContent("1 of 3");
    });

    it("starts again from slide 1 when reopened", async () => {
        const { rerender } = renderGuide();
        await userEvent.click(next());
        rerender(<ScenarioGuideDialog open={false} onOpenChange={jest.fn()} />);
        rerender(<ScenarioGuideDialog open onOpenChange={jest.fn()} />);
        expect(counter()).toHaveTextContent("1 of 3");
    });

    it("closes with the close button", async () => {
        const { onOpenChange } = renderGuide();
        await userEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});

describe("Local Session History", () => {
    const sessions = [
        {
            sessionId: "sess-a",
            subscriberUrl: "https://a.example",
            role: "BAP",
            timestamp: "2026-11-18T10:00:00Z",
        },
        {
            sessionId: "sess-b",
            subscriberUrl: "https://b.example",
            role: "BPP",
            timestamp: "2026-11-18T09:00:00Z",
        },
    ];

    it("starts collapsed with the saved count, and opens and closes on click", async () => {
        render(<LocationSessionHistory sessions={sessions as never} onOpenSession={jest.fn()} />);

        const toggle = screen.getByRole("button", { name: /Local Session History/ });
        expect(toggle).toHaveAttribute("aria-expanded", "false");
        expect(toggle).toHaveTextContent("2");
        expect(screen.queryByText("https://a.example")).not.toBeInTheDocument();

        await userEvent.click(toggle);
        expect(toggle).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByText("https://a.example")).toBeInTheDocument();

        await userEvent.click(toggle);
        expect(screen.queryByText("https://a.example")).not.toBeInTheDocument();
    });
});
