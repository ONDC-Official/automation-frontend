import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
    persistReducer,
    persistStore,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from "redux-persist";
import { storage } from "@store/storage";
import devGuideApi from "@store/api/developerGuide/devGuideApi";
import loadTestApi from "@store/api/loadTest/loadTestApi";
import mainApi from "@store/api/main/mainApi";
import sessionSlice from "@store/slices/sessionSlice";
import themeSlice from "@store/slices/themeSlice";
import sessionHistorySlice from "@store/slices/sessionHistorySlice";
import supportSessionSlice from "@store/slices/supportSessionSlice";
import uiFlagsSlice from "@store/slices/uiFlagsSlice";
import schemaValidationSlice from "@store/slices/schemaValidationSlice";
import sellerLoadTestSlice from "@store/slices/sellerLoadTestSlice";
import frameworkHealthSlice from "@store/slices/frameworkHealthSlice";
import chatbotSlice from "@store/slices/chatbotSlice";
import cooldownsSlice from "@store/slices/cooldownsSlice";
import aiSlice from "@store/slices/aiSlice";
import devGuideShellSlice from "@store/slices/devGuideShellSlice";
import playgroundConfigsSlice from "@store/slices/playgroundConfigsSlice";
import { listenerMiddleware } from "@store/listenerMiddleware";
import {
    sessionPersistConfig,
    frameworkHealthPersistConfig,
    authPersistConfig,
} from "@store/persistConfig";
import authSlice, { selectAuthToken } from "@store/slices/authSlice";
import { registerAuthTokenReader } from "@store/authTokenReader";

const localPersist = (key: string) => ({ key, storage });

const rootReducer = combineReducers({
    [mainApi.reducerPath]: mainApi.reducer,
    [devGuideApi.reducerPath]: devGuideApi.reducer,
    [loadTestApi.reducerPath]: loadTestApi.reducer,
    theme: persistReducer(localPersist("theme"), themeSlice.reducer),
    auth: persistReducer(authPersistConfig, authSlice.reducer),
    session: persistReducer(sessionPersistConfig, sessionSlice.reducer),
    sessionHistory: persistReducer(localPersist("sessionHistory"), sessionHistorySlice.reducer),
    supportSession: persistReducer(localPersist("supportSession"), supportSessionSlice.reducer),
    uiFlags: persistReducer(localPersist("uiFlags"), uiFlagsSlice.reducer),
    schemaValidation: persistReducer(
        localPersist("schemaValidation"),
        schemaValidationSlice.reducer
    ),
    sellerLoadTest: persistReducer(localPersist("sellerLoadTest"), sellerLoadTestSlice.reducer),
    frameworkHealth: persistReducer(frameworkHealthPersistConfig, frameworkHealthSlice.reducer),
    chatbot: persistReducer(localPersist("chatbot"), chatbotSlice.reducer),
    cooldowns: cooldownsSlice.reducer,
    ai: persistReducer(localPersist("ai"), aiSlice.reducer),
    playgroundConfigs: persistReducer(
        localPersist("playgroundConfigs"),
        playgroundConfigsSlice.reducer
    ),
    devGuideShell: devGuideShellSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const createAppStore = (preloadedState?: Partial<RootState>) =>
    configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
                },
            })
                .prepend(listenerMiddleware.middleware)
                .concat(mainApi.middleware, devGuideApi.middleware, loadTestApi.middleware),
        devTools: import.meta.env.DEV,
        preloadedState,
    });

export const store = createAppStore();

registerAuthTokenReader(() => selectAuthToken(store.getState()));

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

export const setupStore = (preloadedState?: Partial<RootState>) => createAppStore(preloadedState);
