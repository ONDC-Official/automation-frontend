import { configureStore } from "@reduxjs/toolkit";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import authSlice, {
    clearAuth,
    setActiveOrgId,
    setToken,
    type IAuthState,
} from "@store/slices/authSlice";
import { OrganisationPickerDialog, OrganisationSwitcher } from "@components/OrganisationPicker";

let mockUser: object | undefined;
let mockAuthLoading = false;
jest.mock("@hooks/useAuth", () => ({
    useAuth: () => ({ user: mockUser, isAuthLoading: mockAuthLoading }),
}));
let mockSearch = "";
jest.mock("react-router-dom", () => ({ useLocation: () => ({ search: mockSearch }) }));

const UAT = { organisationId: "11899", organisationName: "UAT_1 Org" };
const SECOND = { organisationId: "99001", organisationName: "UAT_2 Test Org" };
const userWith = (...organisations: object[]) => ({ username: "25716", organisations });

const renderWithStore = (ui: React.ReactElement, auth: Partial<IAuthState> = {}) => {
    const store = configureStore({
        reducer: { auth: authSlice.reducer },
        preloadedState: {
            auth: {
                token: "t",
                isLoginPending: false,
                postLoginRedirect: null,
                activeOrgId: null,
                ...auth,
            },
        },
    });
    render(<Provider store={store}>{ui}</Provider>);
    return store;
};

beforeEach(() => {
    mockUser = undefined;
    mockAuthLoading = false;
    mockSearch = "";
    document.body.style.pointerEvents = "";
});

describe("active organisation in the login store", () => {
    const state = (over: Partial<IAuthState> = {}): IAuthState => ({
        token: "old",
        isLoginPending: false,
        postLoginRedirect: null,
        activeOrgId: "99001",
        ...over,
    });

    it("is cleared by a new login, so the user picks again", () => {
        expect(authSlice.reducer(state(), setToken("new")).activeOrgId).toBeNull();
    });

    it("is kept when the same token is set again", () => {
        expect(authSlice.reducer(state(), setToken("old")).activeOrgId).toBe("99001");
    });

    it("is cleared on logout and can be set", () => {
        expect(authSlice.reducer(state(), clearAuth()).activeOrgId).toBeNull();
        expect(authSlice.reducer(state(), setActiveOrgId("11899")).activeOrgId).toBe("11899");
    });
});

describe("organisation picker after login", () => {
    it("asks a user with several organisations to pick one, and can't be skipped", async () => {
        mockUser = userWith(UAT, SECOND);
        const store = renderWithStore(<OrganisationPickerDialog />);

        expect(
            screen.getByRole("dialog", { name: "Choose your organisation" })
        ).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
        await userEvent.keyboard("{Escape}");
        expect(screen.getByRole("dialog")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /UAT_2 Test Org/ }));
        expect(store.getState().auth.activeOrgId).toBe("99001");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it.each([
        ["one organisation", userWith(UAT)],
        ["no organisations (GitHub login)", { username: "octo" }],
        ["logged out", undefined],
    ])("doesn't ask with %s", (_case, user) => {
        mockUser = user;
        renderWithStore(<OrganisationPickerDialog />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("waits until the login has settled before asking", () => {
        mockUser = userWith(UAT, SECOND);
        mockSearch = "?code=abc";
        renderWithStore(<OrganisationPickerDialog />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("leaves the page clickable after a pick", async () => {
        jest.useFakeTimers();
        mockUser = userWith(UAT, SECOND);
        renderWithStore(<OrganisationPickerDialog />);
        document.body.style.pointerEvents = "none"; // what a stuck pop-up leaves behind
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        await user.click(screen.getByRole("button", { name: /UAT_1 Org/ }));
        act(() => {
            jest.advanceTimersByTime(500);
        });
        expect(document.body.style.pointerEvents).toBe("");
        jest.useRealTimers();
    });

    it("doesn't ask again once picked", () => {
        mockUser = userWith(UAT, SECOND);
        renderWithStore(<OrganisationPickerDialog />, { activeOrgId: "11899" });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});

describe("organisation in the top bar", () => {
    it("is plain text with one organisation", () => {
        mockUser = userWith(UAT);
        renderWithStore(<OrganisationSwitcher />);
        expect(screen.getByText("UAT_1 Org")).toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("switches between several organisations", async () => {
        mockUser = userWith(UAT, SECOND);
        const store = renderWithStore(<OrganisationSwitcher />, { activeOrgId: "11899" });

        const trigger = screen.getByRole("button", { name: /Organisation: UAT_1 Org/ });
        await userEvent.click(trigger);
        await userEvent.click(await screen.findByRole("menuitem", { name: /UAT_2 Test Org/ }));
        expect(store.getState().auth.activeOrgId).toBe("99001");
    });

    it("shows nothing for a login without organisations", () => {
        mockUser = { username: "octo" };
        const { container } = render(
            <Provider store={configureStore({ reducer: { auth: authSlice.reducer } })}>
                <OrganisationSwitcher />
            </Provider>
        );
        expect(container).toBeEmptyDOMElement();
    });
});
