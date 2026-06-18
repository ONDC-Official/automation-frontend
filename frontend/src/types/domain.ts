/** Domain version entry from form-field configuration */
export interface IDomainVersion {
    key: string;
}

/** Domain entry with supported versions */
export interface IDomain {
    key: string;
    version: IDomainVersion[];
}

/** Active domain configuration keyed by category */
export type ActiveDomainConfig = Record<string, IDomain[]>;
