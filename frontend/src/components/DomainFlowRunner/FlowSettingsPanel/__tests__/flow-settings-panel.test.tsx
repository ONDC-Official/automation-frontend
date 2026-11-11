import { render, screen } from "@testing-library/react";

import FlowSettingsPanel from "@components/DomainFlowRunner/FlowSettingsPanel";

const props = {
    autoScrollEnabled: true,
    onAutoScrollChange: () => undefined,
    experimentalMode: false,
    onExperimentalModeChange: () => undefined,
    sessionDifficulty: { protocolValidations: true },
    onSessionDifficultyChange: () => undefined,
};

describe("FlowSettingsPanel", () => {
    it("shows Experimental Mode by default, as v1's pages expect", () => {
        render(<FlowSettingsPanel {...props} />);
        expect(screen.getByText("Experimental Mode")).toBeTruthy();
        expect(screen.getByText("Auto-scroll")).toBeTruthy();
    });

    it("hides Experimental Mode when a page asks it to", () => {
        render(<FlowSettingsPanel {...props} showExperimentalMode={false} />);
        expect(screen.queryByText("Experimental Mode")).toBeNull();
        expect(screen.getByText("Auto-scroll")).toBeTruthy();
    });

    it("names the switch for what it does on a page that asks", () => {
        render(<FlowSettingsPanel {...props} experimentalLabel="Step through" />);
        expect(screen.getByText("Step through")).toBeTruthy();
        expect(screen.queryByText("Experimental Mode")).toBeNull();
    });
});
