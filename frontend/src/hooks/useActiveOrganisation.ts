import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { selectActiveOrgId, setActiveOrgId } from "@store/slices/authSlice";
import { useAuth } from "@hooks/useAuth";
import type { IUserOrganisation } from "@/types/user";

export interface IActiveOrganisation {
    /** The user's organisations (empty when logged out or for a login without any). */
    organisations: IUserOrganisation[];
    /** The organisation the user is working for, or undefined if not chosen yet. */
    activeOrganisation: IUserOrganisation | undefined;
    /** True when the user belongs to several organisations and hasn't picked one yet. */
    needsChoice: boolean;
    setActiveOrganisation: (organisationId: string) => void;
}

/**
 * Which organisation the logged-in user is working for. With one organisation it is
 * that one; with several, the one they picked (asked again after every login).
 */
export const useActiveOrganisation = (): IActiveOrganisation => {
    const dispatch = useAppDispatch();
    const { user } = useAuth();
    const activeOrgId = useAppSelector(selectActiveOrgId);
    const organisations = useMemo(() => user?.organisations ?? [], [user]);

    const activeOrganisation =
        organisations.length === 1
            ? organisations[0]
            : organisations.find((o) => o.organisationId === activeOrgId);

    const setActiveOrganisation = useCallback(
        (organisationId: string) => dispatch(setActiveOrgId(organisationId)),
        [dispatch]
    );

    return {
        organisations,
        activeOrganisation,
        needsChoice: organisations.length > 1 && !activeOrganisation,
        setActiveOrganisation,
    };
};

/** An organisation's display name: its name, else its ID. */
export const organisationLabel = (org?: IUserOrganisation) =>
    org ? org.organisationName || org.organisationId : "";
