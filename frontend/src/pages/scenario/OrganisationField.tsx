import { useEffect, useMemo } from "react";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import { ComboBox } from "@components/Shadcn/ComboBox";
import type { IComboBoxOption } from "@components/Shadcn/ComboBox/combo-box-options";
import { useAuth } from "@hooks/useAuth";
import { organisationLabel, useActiveOrganisation } from "@hooks/useActiveOrganisation";

export const ORGANISATION_LABEL = "Select Organisation";

/** The NP Portal organisations the logged-in user belongs to, as dropdown options. */
export const useOrganisationOptions = (): IComboBoxOption[] => {
    const { user } = useAuth();
    return useMemo(
        () =>
            (user?.organisations ?? []).map((org) => ({
                value: org.organisationId,
                label: org.organisationName
                    ? `${org.organisationName} (${org.organisationId})`
                    : org.organisationId,
            })),
        [user]
    );
};

interface IOrganisationFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    /** Optional help text shown from an "i" next to the label. */
    tooltip?: string;
}

/**
 * Lets an ONDC user pick which of their organisations a session or config is
 * for. Hidden when the user has no organisations (logged out or GitHub login);
 * with exactly one, it is picked straight away.
 */
export const OrganisationField = <T extends FieldValues>({
    control,
    name,
    tooltip,
}: IOrganisationFieldProps<T>) => {
    const options = useOrganisationOptions();
    const {
        field: { value, onChange },
    } = useController({ control, name });

    const onlyOption = options.length === 1 ? options[0].value : "";
    useEffect(() => {
        if (onlyOption && !value) {
            onChange(onlyOption);
        }
    }, [onlyOption, value, onChange]);

    if (options.length === 0) {
        return null;
    }

    return (
        <ComboBox
            control={control}
            name={name}
            label={ORGANISATION_LABEL}
            options={options}
            placeholder="Select your organisation"
            required
            tooltip={tooltip}
        />
    );
};

/**
 * The organisation a new session is for, shown as text (not a field): the one the
 * user is working for, picked after login or switched from the top bar. Sets the
 * form's value to it. Shows nothing when logged out or without organisations.
 */
export const CurrentOrganisation = <T extends FieldValues>({
    control,
    name,
}: {
    control: Control<T>;
    name: Path<T>;
}) => {
    const { activeOrganisation } = useActiveOrganisation();
    const orgId = activeOrganisation?.organisationId ?? "";
    const {
        field: { value, onChange },
    } = useController({ control, name });

    useEffect(() => {
        if (orgId && value !== orgId) {
            onChange(orgId);
        }
    }, [orgId, value, onChange]);

    if (!activeOrganisation) {
        return null;
    }
    return (
        <p className="text-body-2 text-text-secondary" data-testid="current-organisation">
            Organisation:{" "}
            <span className="font-semibold text-text-primary">
                {organisationLabel(activeOrganisation)}
            </span>
        </p>
    );
};

/** An organisation's name only (no ID), for showing. Falls back to the ID. */
export const useOrganisationName = () => {
    const { user } = useAuth();
    return (orgId?: string) =>
        (user?.organisations ?? []).find((o) => o.organisationId === orgId)?.organisationName ||
        orgId ||
        "";
};
