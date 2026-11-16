import { render, screen } from "@testing-library/react";

import { LiveSidePanel } from "@pages/protocol-studio/live/live-side-panel";

const props = {
    onTab: () => undefined,
    selection: null,
    step: null,
    status: null,
};

const tabNames = () => screen.getAllByRole("tab").map((tab) => tab.textContent);

describe("LiveSidePanel · Advanced mode", () => {
    it("hides the Session and Log tabs unless Advanced mode is on", () => {
        render(<LiveSidePanel {...props} tab="Request" advanced={false} />);
        expect(tabNames()).toEqual(["Request", "Response", "Checks"]);
    });

    it("shows them in Advanced mode", () => {
        render(<LiveSidePanel {...props} tab="Log" advanced />);
        expect(tabNames()).toEqual(["Request", "Response", "Checks", "Session", "Log"]);
        expect(screen.getByRole("tab", { name: "Log" }).getAttribute("aria-selected")).toBe("true");
    });

    it("falls back to Request when the open tab is hidden", () => {
        render(<LiveSidePanel {...props} tab="Session" advanced={false} />);
        expect(screen.getByRole("tab", { name: "Request" }).getAttribute("aria-selected")).toBe(
            "true"
        );
    });
});
