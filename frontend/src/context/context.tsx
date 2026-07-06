import { createContext, ReactNode, useContext, useMemo, Dispatch, SetStateAction } from "react";
import {
    SessionCache,
    SessionMetadata,
    SessionPayloadData,
    SessionSideView,
} from "@/types/session-types";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { createDispatchSetter } from "@store/utils/createDispatchSetter";
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

interface SessionContextProps {
    sessionId: string;
    setSessionId: Dispatch<SetStateAction<string>>;
    activeFlowId: string | null;
    setActiveFlowId?: Dispatch<SetStateAction<string | null>>;
    sessionData: SessionCache | null | undefined;
    setSessionData?: Dispatch<SetStateAction<SessionCache | null>>;
    selectedTab: SessionTab;
    setSelectedTab?: Dispatch<SetStateAction<SessionTab>>;
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
    // Frontend-only UI prefs (persisted via the Redux session slice, NOT the backend session).
    autoScrollEnabled?: boolean;
    setAutoScrollEnabled?: Dispatch<SetStateAction<boolean>>;
    experimentalMode?: boolean;
    setExperimentalMode?: Dispatch<SetStateAction<boolean>>;
    /** True while any flow input form dialog is open — pauses flow polling to avoid remounting fields. */
    isFlowFormDialogOpen?: boolean;
    acquireFlowFormDialogLock?: () => void;
    releaseFlowFormDialogLock?: () => void;
}

export const SessionContext = createContext<SessionContextProps | undefined>(undefined);

/**
 * Thin shell over the Redux `session` slice. State lives in the store; this provider preserves the
 * existing `useSession()` Context API (including functional setter updates) for all consumers.
 */
export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const dispatch = useAppDispatch();
    const session = useAppSelector((state) => state.session);
    const isFlowFormDialogOpen = useAppSelector(selectIsFlowFormDialogOpen);

    const value = useMemo<SessionContextProps>(() => {
        return {
            sessionId: session.sessionId,
            setSessionId: createDispatchSetter(session.sessionId, (next) =>
                dispatch(setSessionIdAction(next))
            ),
            activeFlowId: session.activeFlowId,
            setActiveFlowId: createDispatchSetter(session.activeFlowId, (next) =>
                dispatch(setActiveFlowIdAction(next))
            ),
            sessionData: session.sessionData,
            setSessionData: createDispatchSetter(session.sessionData, (next) =>
                dispatch(setSessionDataAction(next))
            ),
            selectedTab: session.selectedTab,
            setSelectedTab: createDispatchSetter(session.selectedTab, (next) =>
                dispatch(setSelectedTabAction(next))
            ),
            requestData: session.requestData,
            setRequestData: createDispatchSetter(session.requestData, (next) =>
                dispatch(setRequestDataAction(next))
            ),
            responseData: session.responseData,
            setResponseData: createDispatchSetter(session.responseData, (next) =>
                dispatch(setResponseDataAction(next))
            ),
            sideView: session.sideView,
            setSideView: createDispatchSetter(session.sideView, (next) =>
                dispatch(setSideViewAction(next))
            ),
            metadata: session.metadata,
            setMetadata: createDispatchSetter(session.metadata, (next) =>
                dispatch(setMetadataAction(next))
            ),
            activeCallClickedToggle: session.activeCallClickedToggle,
            setActiveCallClickedToggle: createDispatchSetter(
                session.activeCallClickedToggle,
                (next) => dispatch(setActiveCallClickedToggleAction(next))
            ),
            autoScrollEnabled: session.autoScrollEnabled,
            setAutoScrollEnabled: createDispatchSetter(session.autoScrollEnabled, (next) =>
                dispatch(setAutoScrollEnabledAction(next))
            ),
            experimentalMode: session.experimentalMode,
            setExperimentalMode: createDispatchSetter(session.experimentalMode, (next) =>
                dispatch(setExperimentalModeAction(next))
            ),
            isFlowFormDialogOpen,
            acquireFlowFormDialogLock: () => dispatch(acquireFlowFormDialogLockAction()),
            releaseFlowFormDialogLock: () => dispatch(releaseFlowFormDialogLockAction()),
        };
    }, [session, isFlowFormDialogOpen, dispatch]);

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error("useSession must be used inside SessionProvider");
    return ctx;
};
