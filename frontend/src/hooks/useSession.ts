import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
    SessionCache,
    SessionMetadata,
    SessionPayloadData,
    SessionSideView,
} from "@/types/session-types";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { store } from "@store/index";
import {
    setSessionId as setSessionIdAction,
    setActiveFlowId as setActiveFlowIdAction,
    setSessionData as setSessionDataAction,
    setSelectedTab as setSelectedTabAction,
    setRequestData as setRequestDataAction,
    setResponseData as setResponseDataAction,
    setSideView as setSideViewAction,
    setMetadata as setMetadataAction,
    setActiveCallClickedToggle as setActiveCallClickedToggleAction,
    setAutoScrollEnabled as setAutoScrollEnabledAction,
    setExperimentalMode as setExperimentalModeAction,
    acquireFlowFormDialogLock as acquireFlowFormDialogLockAction,
    releaseFlowFormDialogLock as releaseFlowFormDialogLockAction,
    selectIsFlowFormDialogOpen,
    type SessionTab,
} from "@store/slices/sessionSlice";

export interface UseSessionResult {
    sessionId: string;
    setSessionId: Dispatch<SetStateAction<string>>;
    activeFlowId: string | null;
    setActiveFlowId: Dispatch<SetStateAction<string | null>>;
    sessionData: SessionCache | null;
    setSessionData: Dispatch<SetStateAction<SessionCache | null>>;
    selectedTab: SessionTab;
    setSelectedTab: Dispatch<SetStateAction<SessionTab>>;
    requestData: SessionPayloadData;
    setRequestData: Dispatch<SetStateAction<SessionPayloadData>>;
    responseData: SessionPayloadData;
    setResponseData: Dispatch<SetStateAction<SessionPayloadData>>;
    sideView: SessionSideView;
    setSideView: Dispatch<SetStateAction<SessionSideView>>;
    metadata: SessionMetadata;
    setMetadata: Dispatch<SetStateAction<SessionMetadata>>;
    setActiveCallClickedToggle: Dispatch<SetStateAction<boolean>>;
    activeCallClickedToggle: boolean;
    autoScrollEnabled: boolean;
    setAutoScrollEnabled: Dispatch<SetStateAction<boolean>>;
    experimentalMode: boolean;
    setExperimentalMode: Dispatch<SetStateAction<boolean>>;
    isFlowFormDialogOpen: boolean;
    acquireFlowFormDialogLock: () => void;
    releaseFlowFormDialogLock: () => void;
}

/** Flow session state — backed by global `sessionSlice` (Option A: single runtime slot). */
export const useSession = (): UseSessionResult => {
    const dispatch = useAppDispatch();

    const sessionId = useAppSelector((state) => state.session.sessionId);
    const activeFlowId = useAppSelector((state) => state.session.activeFlowId);
    const sessionData = useAppSelector((state) => state.session.sessionData);
    const selectedTab = useAppSelector((state) => state.session.selectedTab);
    const requestData = useAppSelector((state) => state.session.requestData);
    const responseData = useAppSelector((state) => state.session.responseData);
    const sideView = useAppSelector((state) => state.session.sideView);
    const metadata = useAppSelector((state) => state.session.metadata);
    const activeCallClickedToggle = useAppSelector(
        (state) => state.session.activeCallClickedToggle
    );
    const autoScrollEnabled = useAppSelector((state) => state.session.autoScrollEnabled);
    const experimentalMode = useAppSelector((state) => state.session.experimentalMode);
    const isFlowFormDialogOpen = useAppSelector(selectIsFlowFormDialogOpen);

    const setSessionId = useCallback(
        (value: SetStateAction<string>) => {
            const current = store.getState().session.sessionId;
            const next = typeof value === "function" ? value(current) : value;
            if (next !== current) dispatch(setSessionIdAction(next));
        },
        [dispatch]
    );

    const setActiveFlowId = useCallback(
        (value: SetStateAction<string | null>) => {
            const current = store.getState().session.activeFlowId;
            const next = typeof value === "function" ? value(current) : value;
            if (next !== current) dispatch(setActiveFlowIdAction(next));
        },
        [dispatch]
    );

    const setSessionData = useCallback(
        (value: SetStateAction<SessionCache | null>) => {
            const current = store.getState().session.sessionData;
            const next = typeof value === "function" ? value(current) : value;
            if (Object.is(next, current)) return;
            dispatch(setSessionDataAction(next));
        },
        [dispatch]
    );

    const setSelectedTab = useCallback(
        (value: SetStateAction<SessionTab>) => {
            const current = store.getState().session.selectedTab;
            const next = typeof value === "function" ? value(current) : value;
            if (next !== current) dispatch(setSelectedTabAction(next));
        },
        [dispatch]
    );

    const setRequestData = useCallback(
        (value: SetStateAction<SessionPayloadData>) => {
            const current = store.getState().session.requestData;
            const next = typeof value === "function" ? value(current) : value;
            if (Object.is(next, current)) return;
            dispatch(setRequestDataAction(next));
        },
        [dispatch]
    );

    const setResponseData = useCallback(
        (value: SetStateAction<SessionPayloadData>) => {
            const current = store.getState().session.responseData;
            const next = typeof value === "function" ? value(current) : value;
            if (Object.is(next, current)) return;
            dispatch(setResponseDataAction(next));
        },
        [dispatch]
    );

    const setSideView = useCallback(
        (value: SetStateAction<SessionSideView>) => {
            const current = store.getState().session.sideView;
            const next = typeof value === "function" ? value(current) : value;
            if (Object.is(next, current)) return;
            dispatch(setSideViewAction(next));
        },
        [dispatch]
    );

    const setMetadata = useCallback(
        (value: SetStateAction<SessionMetadata>) => {
            const current = store.getState().session.metadata;
            const next = typeof value === "function" ? value(current) : value;
            if (Object.is(next, current)) return;
            dispatch(setMetadataAction(next));
        },
        [dispatch]
    );

    const setActiveCallClickedToggle = useCallback(
        (value: SetStateAction<boolean>) => {
            const current = store.getState().session.activeCallClickedToggle;
            const next = typeof value === "function" ? value(current) : value;
            if (next === current) return;
            dispatch(setActiveCallClickedToggleAction(next));
        },
        [dispatch]
    );

    const setAutoScrollEnabled = useCallback(
        (value: SetStateAction<boolean>) => {
            const current = store.getState().session.autoScrollEnabled;
            const next = typeof value === "function" ? value(current) : value;
            if (next === current) return;
            dispatch(setAutoScrollEnabledAction(next));
        },
        [dispatch]
    );

    const setExperimentalMode = useCallback(
        (value: SetStateAction<boolean>) => {
            const current = store.getState().session.experimentalMode;
            const next = typeof value === "function" ? value(current) : value;
            if (next === current) return;
            dispatch(setExperimentalModeAction(next));
        },
        [dispatch]
    );

    const acquireFlowFormDialogLock = useCallback(
        () => dispatch(acquireFlowFormDialogLockAction()),
        [dispatch]
    );
    const releaseFlowFormDialogLock = useCallback(
        () => dispatch(releaseFlowFormDialogLockAction()),
        [dispatch]
    );

    return {
        sessionId,
        setSessionId,
        activeFlowId,
        setActiveFlowId,
        sessionData,
        setSessionData,
        selectedTab,
        setSelectedTab,
        requestData,
        setRequestData,
        responseData,
        setResponseData,
        sideView,
        setSideView,
        metadata,
        setMetadata,
        activeCallClickedToggle,
        setActiveCallClickedToggle,
        autoScrollEnabled,
        setAutoScrollEnabled,
        experimentalMode,
        setExperimentalMode,
        isFlowFormDialogOpen,
        acquireFlowFormDialogLock,
        releaseFlowFormDialogLock,
    };
};
