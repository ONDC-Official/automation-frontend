import { ROUTES, getDeveloperGuideDocPath, getDeveloperGuideUseCasePath } from "@constants/routes";
import { extractNestedMarkdownToc, stripHeadingNumberPrefix } from "@utils/markdownToc";
import type { BuildEntry, DocMeta } from "../types";
import {
    groupBuildsByFamily,
    getDomainDisplayLabel,
    getDomainFamilyLabel,
    getDomainFriendlyName,
} from "../domainGrouping";
import { isDomainEnabled, sortDocsByPreferredSequence } from "../utils";
import { GETTING_STARTED_SECTIONS } from "../landing/getting-started-sections";
import { resolveNavStatus } from "../shared/statusPlaceholders";
import type { NavNode } from "./navTypes";
import { DOCS_WITH_SIDEBAR_SECTIONS } from "./docsWithSidebarSections";

function useCaseNavLink(
    node: Extract<NavNode, { type: "link" }>
): Extract<NavNode, { type: "link" }> {
    if (node.disabled) return node;
    return { ...node, showArrow: true };
}

function buildDocNavWithSections(doc: DocMeta, markdown: string): NavNode {
    const basePath = getDeveloperGuideDocPath(doc.slug);
    const sectionNodes: NavNode[] = extractNestedMarkdownToc(markdown).map(
        ({ section, subsections }) => {
            const label = stripHeadingNumberPrefix(section.text);
            const sectionPath = `${basePath}#${section.id}`;

            if (subsections.length === 0) {
                return {
                    id: `doc-${doc.slug}-${section.id}`,
                    label,
                    type: "link" as const,
                    path: sectionPath,
                    searchText: section.text,
                };
            }

            return {
                id: `doc-${doc.slug}-${section.id}`,
                label,
                type: "group" as const,
                path: sectionPath,
                defaultOpen: true,
                searchText: section.text,
                children: subsections.map((subsection) => ({
                    id: `doc-${doc.slug}-${subsection.id}`,
                    label: stripHeadingNumberPrefix(subsection.text),
                    type: "link" as const,
                    path: `${basePath}#${subsection.id}`,
                    searchText: subsection.text,
                })),
            };
        }
    );

    return {
        id: `doc-${doc.slug}`,
        label: doc.label,
        type: "group",
        path: basePath,
        defaultOpen: true,
        searchText: `${doc.label} ${doc.shortDescription} ${doc.slug}`,
        children: sectionNodes,
    };
}

function buildGettingStartedNav(): NavNode {
    const sectionLinks: NavNode[] = GETTING_STARTED_SECTIONS.map((section) => ({
        id: `getting-started-${section.id}`,
        label: section.label,
        type: "link" as const,
        path: `${ROUTES.DEVELOPER_GUIDE_GETTING_STARTED}#${section.id}`,
        searchText: section.label,
    }));

    const defaultGettingStartedPath =
        sectionLinks.length > 0
            ? (sectionLinks[0] as Extract<NavNode, { type: "link" }>).path
            : `${ROUTES.DEVELOPER_GUIDE_GETTING_STARTED}#${GETTING_STARTED_SECTIONS[0].id}`;

    return {
        id: "getting-started",
        label: "Getting Started",
        type: "group",
        path: defaultGettingStartedPath,
        defaultOpen: true,
        children: sectionLinks,
    };
}

export function buildNavTree(
    builds: BuildEntry[],
    docs: DocMeta[],
    isUseCaseEnabled: (dom: BuildEntry, usecaseLabel: string) => boolean,
    docMarkdownBySlug?: Record<string, string>
): NavNode[] {
    const sortedDomains = [...builds].sort((a, b) => {
        const aEnabled = isDomainEnabled(a);
        const bEnabled = isDomainEnabled(b);
        if (aEnabled !== bEnabled) return aEnabled ? -1 : 1;
        return a.key.localeCompare(b.key);
    });
    const sortedDocs = sortDocsByPreferredSequence(docs);

    function buildUseCaseNodes(dom: BuildEntry): NavNode[] {
        return (dom.version ?? [])
            .flatMap((ver) =>
                (ver.usecase ?? []).map((label) => ({
                    verKey: ver.key,
                    label,
                    backendStatus: ver.usecaseStatus?.[label] ?? ver.status,
                }))
            )
            .sort((a, b) => {
                const aEn = isUseCaseEnabled(dom, a.label);
                const bEn = isUseCaseEnabled(dom, b.label);
                if (aEn !== bEn) return aEn ? -1 : 1;
                return a.label.localeCompare(b.label) || a.verKey.localeCompare(b.verKey);
            })
            .map(({ verKey, label, backendStatus }) => {
                const clickable = isUseCaseEnabled(dom, label);
                return useCaseNavLink({
                    id: `usecase-${dom.key}-${verKey}-${label}`,
                    label,
                    suffix: `v${verKey}`,
                    type: "link" as const,
                    path: getDeveloperGuideUseCasePath(dom.key, verKey, label),
                    disabled: !clickable,
                    searchText: `${dom.key} ${label} v${verKey}`,
                    status: resolveNavStatus({
                        domainKey: dom.key,
                        versionKey: verKey,
                        usecaseLabel: label,
                        backendStatus,
                    }),
                });
            });
    }

    function buildDomainGroupNode(dom: BuildEntry): NavNode {
        const enabled = isDomainEnabled(dom);
        const displayLabel = getDomainDisplayLabel(dom.key);
        return {
            id: `domain-${dom.key}`,
            label: displayLabel,
            type: "group" as const,
            defaultOpen: enabled,
            searchText: `${displayLabel} ${getDomainFriendlyName(dom.key)} ${dom.key}`,
            children: buildUseCaseNodes(dom),
        };
    }

    const domainFamilies = groupBuildsByFamily(sortedDomains);
    const domainChildren: NavNode[] = domainFamilies.map((family) => {
        const familyEnabled = family.domains.some(isDomainEnabled);
        const familyTitle = getDomainFamilyLabel(family.familyKey);

        return {
            id: `family-${family.familyKey}`,
            label: familyTitle,
            type: "group" as const,
            defaultOpen: familyEnabled,
            searchText: `${familyTitle} ${family.familyKey} ${family.domains
                .map((d) => `${getDomainDisplayLabel(d.key)} ${d.key}`)
                .join(" ")}`,
            children: family.domains.map(buildDomainGroupNode),
        };
    });

    const tree: NavNode[] = [
        buildGettingStartedNav(),
        {
            id: "general-docs",
            label: "General Documentation",
            type: "group",
            path: ROUTES.DEVELOPER_GUIDE_GENERAL,
            defaultOpen: true,
            searchText: "general documentation auth tools guides reference",
            children: (() => {
                const authToolsNode: NavNode = {
                    id: "auth-tools",
                    label: "Auth Tools",
                    type: "link",
                    path: ROUTES.DEVELOPER_GUIDE_AUTH_TOOLS,
                    searchText: "auth authorization header blake ed25519",
                };
                const docNodes = sortedDocs.map((doc) => {
                    const markdown = docMarkdownBySlug?.[doc.slug];
                    if (DOCS_WITH_SIDEBAR_SECTIONS.has(doc.slug) && markdown) {
                        return buildDocNavWithSections(doc, markdown);
                    }
                    return {
                        id: `doc-${doc.slug}`,
                        label: doc.label,
                        type: "link" as const,
                        path: getDeveloperGuideDocPath(doc.slug),
                        searchText: `${doc.label} ${doc.shortDescription} ${doc.slug}`,
                    };
                });

                return [...docNodes.slice(0, 2), authToolsNode, ...docNodes.slice(2)];
            })(),
        },
    ];

    if (domainChildren.length > 0) {
        tree.push({
            id: "domains",
            label: "API Reference by Domain",
            type: "group",
            path: ROUTES.DEVELOPER_GUIDE_DOMAINS,
            defaultOpen: true,
            searchText: "api reference domain use case flows specifications",
            children: domainChildren,
        });
    }

    return tree;
}
