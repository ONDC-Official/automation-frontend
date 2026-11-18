import { act, fireEvent, render, screen } from "@testing-library/react";

import { createJourney } from "@pages/protocol-studio/ui/editor/journeys/derive";
import { StartLiveDialog } from "@pages/protocol-studio/ui/editor/live/start-live-dialog";

const journeys = [createJourney("happy", "Happy", "search")];

const open = (onStart: () => Promise<unknown>, onSignIn = jest.fn()) => {
    render(
        <StartLiveDialog
            open
            journeys={journeys}
            blockers={new Map([["happy", null]])}
            blocked={null}
            container={document.body}
            onClose={jest.fn()}
            onStart={onStart as never}
            onSignIn={onSignIn}
        />
    );
    fireEvent.change(screen.getByLabelText(/subscriber url/i), {
        target: { value: "https://np.example.com" },
    });
    return onSignIn;
};

describe("StartLiveDialog", () => {
    it("asks the user to sign in when starting needs a login", async () => {
        const onSignIn = open(async () => ({ signIn: true }));
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /start session/i }));
        });
        const alert = screen.getByRole("alert");
        expect(alert.textContent).toContain("Sign in to start a live session");
        expect(alert.textContent).not.toContain("backend");
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
        expect(onSignIn).toHaveBeenCalledTimes(1);
    });

    it("shows any other failure as it is", async () => {
        open(async () => "The live session could not be created · is the backend running?");
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /start session/i }));
        });
        expect(screen.getByRole("alert").textContent).toContain("is the backend running?");
        expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
    });
});
