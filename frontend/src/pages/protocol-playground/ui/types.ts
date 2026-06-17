import type { SavedConfigMetadata } from "@pages/protocol-playground/utils/config-storage";

export interface ISavedConfigsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigSelected: (domain: string, version: string, flowId: string) => void;
}

export interface IFlowConverterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface ISchemaGeneratorModalProps {
    isOpen: boolean;
    defaultDomain?: string;
    onClose: () => void;
}

export interface FlowNode {
    config: SavedConfigMetadata;
}

export interface VersionNode {
    version: string;
    flows: FlowNode[];
}

export interface DomainNode {
    domain: string;
    versions: VersionNode[];
    totalConfigs: number;
}

export interface IFlowRowProps {
    config: SavedConfigMetadata;
    onLoad: (config: SavedConfigMetadata) => void;
    onDelete: (config: SavedConfigMetadata) => void;
}

export interface IVersionFolderProps {
    node: VersionNode;
    domainKey: string;
    openVersions: Set<string>;
    onToggle: (key: string) => void;
    onLoad: (config: SavedConfigMetadata) => void;
    onDelete: (config: SavedConfigMetadata) => void;
}

export interface IDomainFolderProps {
    node: DomainNode;
    openDomains: Set<string>;
    openVersions: Set<string>;
    onToggleDomain: (domain: string) => void;
    onToggleVersion: (key: string) => void;
    onLoad: (config: SavedConfigMetadata) => void;
    onDelete: (config: SavedConfigMetadata) => void;
}
