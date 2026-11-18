import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";

import { useStudioContracts } from "@pages/protocol-studio/hooks/use-studio-contracts";
import studioContractsSlice, { importContractSet } from "@store/slices/studioContractsSlice";

/** What the GitHub read of the imported commit gives back, per test. */
const mockBase = {
    data: undefined as unknown,
    isError: false,
    error: undefined as unknown,
    isLoading: false,
    isFetching: false,
    refetch: jest.fn(),
};

jest.mock("@store/api", () => ({
    useGetSpecQuery: () => ({ data: undefined, isLoading: false, isError: false }),
    useGetSpecContractsQuery: () => mockBase,
    useGetSpecRepoRefsQuery: () => ({ data: undefined, isFetching: false, refetch: jest.fn() }),
    useLazyGetSpecContractsQuery: () => [jest.fn(), { isFetching: false }],
}));

const DOMAIN = "ONDC:TRV11";
const VERSION = "2.1.0";

const setup = () => {
    const store = configureStore({ reducer: { studioContracts: studioContractsSlice.reducer } });
    store.dispatch(
        importContractSet({
            domain: DOMAIN,
            version: VERSION,
            source: {
                kind: "github",
                repo: "ONDC-Official/automation-specifications",
                branch: "draft-TRV11-2.1.0",
                sha: "abc1234",
                importedAt: "2026-11-18T00:00:00.000Z",
            },
            files: {
                validations: {
                    path: "config/validations/index.yaml",
                    baseHash: "x",
                    baseSize: 10,
                },
            },
        })
    );
    const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider store={store}>{children}</Provider>
    );
    return renderHook(() => useStudioContracts(DOMAIN, VERSION, new Map()), { wrapper });
};

describe("useStudioContracts: re-reading the imported files", () => {
    beforeEach(() => {
        mockBase.refetch.mockReset();
        Object.assign(mockBase, {
            data: undefined,
            isError: false,
            error: undefined,
            isLoading: false,
            isFetching: false,
        });
    });

    it("says a file couldn't load, and why, and retries the read", () => {
        Object.assign(mockBase, {
            isError: true,
            error: { status: "CUSTOM_ERROR", error: "GitHub's rate limit is used up" },
        });
        const { result } = setup();
        const view = result.current.files.validations;
        expect(view.text).toBeUndefined();
        expect(view.loading).toBe(false);
        expect(view.error).toBe("GitHub's rate limit is used up");
        // Files the set doesn't have aren't failures.
        expect(result.current.files.actions.error).toBeUndefined();
        expect(result.current.summary.failed).toEqual(["validations"]);
        expect(result.current.loadError).toBe("GitHub's rate limit is used up");

        act(() => result.current.retry());
        expect(mockBase.refetch).toHaveBeenCalledTimes(1);
    });

    it("reports nothing while the read is fine", () => {
        Object.assign(mockBase, { isFetching: true });
        const { result } = setup();
        expect(result.current.files.validations.loading).toBe(true);
        expect(result.current.files.validations.error).toBeUndefined();
        expect(result.current.summary.failed).toEqual([]);
    });
});
