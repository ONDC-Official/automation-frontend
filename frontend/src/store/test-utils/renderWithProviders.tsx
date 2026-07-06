import { render, type RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import type { ReactElement, ReactNode } from "react";
import { setupStore, type RootState } from "@store/index";

interface IExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
    preloadedState?: Partial<RootState>;
}

export const renderWithProviders = (
    ui: ReactElement,
    { preloadedState, ...renderOptions }: IExtendedRenderOptions = {}
) => {
    const store = setupStore(preloadedState);

    const Wrapper = ({ children }: { children: ReactNode }) => (
        <Provider store={store}>{children}</Provider>
    );

    return {
        store,
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    };
};
