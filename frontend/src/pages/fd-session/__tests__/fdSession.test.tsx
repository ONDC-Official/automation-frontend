import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { ManualSessionForm } from "@pages/scenario/ManualSessionForm";
import type { INewSessionFormValues } from "@pages/scenario/types";
import { ScenarioText, StatusBadge } from "@pages/fd-session/ui";
import { fdSessionPath, isFdDomain } from "@pages/fd-session/constants";

// constants.ts reads import.meta, which Jest cannot parse.
jest.mock("@pages/scenario/constants", () => ({
    getScenarioDomainLabel: (key: string) => key,
    SESSIONS_PER_PAGE: 4,
}));
jest.mock("@hooks/useAuth", () => ({ useAuth: () => ({ user: undefined }) }));
jest.mock("@hooks/useActiveOrganisation", () => ({
    useActiveOrganisation: () => ({
        organisations: [],
        needsChoice: false,
        setActiveOrganisation: jest.fn(),
    }),
    organisationLabel: () => "",
}));
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));

const Form = ({ domain }: { domain: string }) => {
    const { control, handleSubmit, watch, register, formState } = useForm<INewSessionFormValues>({
        defaultValues: {
            subscriberUrl: "",
            domain,
            version: "",
            usecaseId: "",
            npType: "BPP",
            env: "PRE-PRODUCTION",
            orgId: "",
            config: "",
        },
    });
    return (
        <ManualSessionForm
            domains={[{ key: domain, version: [] }]}
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
            onFormSubmit={jest.fn()}
            onBackToSavedConfigs={jest.fn()}
            onDomainChange={jest.fn()}
            onVersionChange={jest.fn()}
            onConfigChange={jest.fn()}
            onCancel={jest.fn()}
        />
    );
};

describe("the New session form for FD", () => {
    it("asks for the participant's Registry identity and declaration, and names the FD roles", () => {
        render(<Form domain="ONDC:FIS14:FD" />);
        for (const label of [
            /^Subscriber ID/,
            /^Unique key ID/,
            /^Signing public key/,
            /Capability declaration/,
        ]) {
            expect(screen.getByLabelText(label)).toBeInTheDocument();
        }
        expect(screen.getByDisplayValue("Deposit issuer (BPP)")).toBeInTheDocument();
    });

    it("asks nothing extra for a Beckn domain", () => {
        render(<Form domain="ONDC:FIS12" />);
        expect(screen.queryByLabelText(/^Signing public key/)).not.toBeInTheDocument();
        expect(screen.getByDisplayValue("Seller App (BPP)")).toBeInTheDocument();
    });
});

describe("FD session helpers", () => {
    it("opens FD sessions on the FD page", () => {
        expect(isFdDomain("ONDC:FIS14:FD")).toBe(true);
        expect(isFdDomain("ONDC:FIS14")).toBe(false);
        expect(fdSessionPath("a b")).toBe("/fd/session?sessionId=a%20b");
    });

    it("shows scenario Markdown as text, with code marked and links reduced to their text", () => {
        const { container } = render(
            <ScenarioText
                text={"**Five** nominees → `maxItems: 4`; see the [Error Catalogue](../x.md)"}
            />
        );
        expect(container.textContent).toBe("Five nominees → maxItems: 4; see the Error Catalogue");
        expect(container.querySelector("code")?.textContent).toBe("maxItems: 4");
    });

    it("colours a status by its word", () => {
        render(<StatusBadge value="VALID" />);
        expect(screen.getByText("VALID").getAttribute("data-variant")).toBe("success");
    });
});
