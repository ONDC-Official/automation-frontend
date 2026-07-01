import { combineReducers, configureStore } from "@reduxjs/toolkit";
import devGuideApi from "@store/apis/devGuideApi";
import loadTestApi from "@store/apis/loadTestApi";
import mainApi from "@store/apis/mainApi";
import authSlice from "@store/slices/authSlice";
import sessionSlice from "@store/slices/sessionSlice";
import themeSlice from "@store/slices/themeSlice";

const rootReducer = combineReducers({
    [mainApi.reducerPath]: mainApi.reducer,
    [devGuideApi.reducerPath]: devGuideApi.reducer,
    [loadTestApi.reducerPath]: loadTestApi.reducer,
    theme: themeSlice.reducer,
    auth: authSlice.reducer,
    session: sessionSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const createAppStore = (preloadedState?: Partial<RootState>) =>
    configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(
                mainApi.middleware,
                devGuideApi.middleware,
                loadTestApi.middleware
            ),
        devTools: import.meta.env.DEV,
        preloadedState,
    });

export const store = createAppStore();

export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

export const setupStore = (preloadedState?: Partial<RootState>) => createAppStore(preloadedState);
