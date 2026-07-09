import React, { useState } from "react";
import {
    FaLayerGroup,
    FaUtensils,
    FaPuzzlePiece,
    FaLink,
    FaArrowRight,
    FaCode,
    FaEye,
    FaSitemap,
} from "react-icons/fa";

import { Badge } from "@components/Shadcn/Badge/badge";
import { Button } from "@components/Shadcn/Button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/Shadcn/Dialog";
import { Alert } from "@components/Shadcn/Alert";
import { TooltipHint } from "@components/Shadcn/Tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Shadcn/Tabs";
import { Card, Tag } from "@pages/seller-onboarding/components/LegacyCardTag";
import {
    CategoryTree,
    type CategoryTreeNodeData,
} from "@pages/seller-onboarding/components/CategoryTree";

interface CustomizationItem {
    id: string;
    name: string;
    price: string;
    description?: string;
    default?: boolean;
    vegNonVeg?: string;
}

interface CustomizationGroup {
    id: string;
    name: string;
    type: "single" | "multiple";
    required: boolean;
    minQuantity: number;
    maxQuantity: number;
    seq: number;
    items: CustomizationItem[];
}

interface MenuItem {
    name: string;
    category: string;
    price: string;
    vegNonVeg: string;
    rank?: number;
    customizationGroups?: CustomizationGroup[];
}

interface CustomMenuComprehensiveViewProps {
    menuItems: MenuItem[];
}

const CustomMenuComprehensiveView: React.FC<CustomMenuComprehensiveViewProps> = ({ menuItems }) => {
    const [activeTab, setActiveTab] = useState("1");
    const [showPayloadModal, setShowPayloadModal] = useState<boolean>(false);
    const [selectedPayload, setSelectedPayload] = useState<Record<string, unknown> | null>(null);

    // Group items by category and sort by rank
    const categorizedItems = menuItems.reduce(
        (acc, item) => {
            const category = item.category || "Uncategorized";
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        },
        {} as Record<string, MenuItem[]>
    );

    // Sort items within each category by rank
    Object.keys(categorizedItems).forEach((category) => {
        categorizedItems[category].sort((a, b) => (a.rank || 999) - (b.rank || 999));
    });

    // Collect all custom groups
    const allCustomGroups: CustomizationGroup[] = [];
    const customGroupMap = new Map<string, CustomizationGroup>();

    menuItems.forEach((item) => {
        if (item.customizationGroups) {
            item.customizationGroups.forEach((group) => {
                if (!customGroupMap.has(group.id)) {
                    customGroupMap.set(group.id, group);
                    allCustomGroups.push(group);
                }
            });
        }
    });

    // Generate mock on_search structure
    const generateMockPayload = () => {
        const categories: Record<string, unknown>[] = [];
        const items: Record<string, unknown>[] = [];

        // Add menu categories
        Object.keys(categorizedItems).forEach((categoryName, idx) => {
            categories.push({
                id: `CAT${idx + 1}`,
                descriptor: { name: categoryName },
                tags: [
                    {
                        code: "type",
                        list: [{ code: "type", value: "custom_menu" }],
                    },
                    {
                        code: "display",
                        list: [{ code: "rank", value: (idx + 1).toString() }],
                    },
                ],
            });
        });

        // Add custom groups as categories
        allCustomGroups.forEach((group) => {
            categories.push({
                id: group.id,
                descriptor: { name: group.name },
                tags: [
                    {
                        code: "type",
                        list: [{ code: "type", value: "custom_group" }],
                    },
                    {
                        code: "config",
                        list: [
                            { code: "min", value: group.minQuantity.toString() },
                            { code: "max", value: group.maxQuantity.toString() },
                            {
                                code: "input",
                                value: group.type === "single" ? "select" : "multiselect",
                            },
                        ],
                    },
                ],
            });
        });

        // Add items
        let itemCounter = 0;
        let customizationCounter = 0;

        menuItems.forEach((menuItem) => {
            itemCounter++;
            const itemId = `I${itemCounter}`;

            // Main item
            const item: Record<string, unknown> = {
                id: itemId,
                descriptor: { name: menuItem.name },
                price: { value: menuItem.price },
                category_id: menuItem.category,
                tags: [
                    { code: "type", list: [{ code: "type", value: "item" }] },
                    {
                        code: "veg_nonveg",
                        list: [
                            {
                                code: menuItem.vegNonVeg === "veg" ? "veg" : "non-veg",
                                value: "yes",
                            },
                        ],
                    },
                ],
            };

            // Add custom group references
            if (menuItem.customizationGroups) {
                menuItem.customizationGroups.forEach((group) => {
                    (item.tags as Record<string, unknown>[]).push({
                        code: "custom_group",
                        list: [{ code: "id", value: group.id }],
                    });
                });
            }

            items.push(item);

            // Add customization items
            if (menuItem.customizationGroups) {
                menuItem.customizationGroups.forEach((group, groupIdx) => {
                    group.items.forEach((custItem) => {
                        customizationCounter++;
                        const customization: Record<string, unknown> = {
                            id: `C${customizationCounter}`,
                            descriptor: { name: custItem.name },
                            price: { value: custItem.price },
                            tags: [
                                { code: "type", list: [{ code: "type", value: "customization" }] },
                                {
                                    code: "parent",
                                    list: [
                                        { code: "id", value: group.id },
                                        { code: "default", value: custItem.default ? "yes" : "no" },
                                    ],
                                },
                            ],
                        };

                        // Add child tag if there's a next group
                        if (groupIdx < menuItem.customizationGroups!.length - 1) {
                            (customization.tags as Record<string, unknown>[]).push({
                                code: "child",
                                list: [
                                    {
                                        code: "id",
                                        value: menuItem.customizationGroups![groupIdx + 1].id,
                                    },
                                ],
                            });
                        }

                        items.push(customization);
                    });
                });
            }
        });

        return { categories, items };
    };

    // Build tree structure for visualization
    const buildTreeData = (): CategoryTreeNodeData[] => {
        const treeData: CategoryTreeNodeData[] = [];

        // Categories section
        const categoriesNode: CategoryTreeNodeData = {
            key: "categories",
            title: (
                <span className="font-semibold">
                    <FaLayerGroup className="inline mr-2" />
                    Categories Array
                </span>
            ),
            children: [],
        };

        // Add menu categories
        Object.keys(categorizedItems).forEach((categoryName, idx) => {
            categoriesNode.children!.push({
                key: `cat-${idx}`,
                title: (
                    <div className="flex items-center gap-2">
                        <span>{categoryName}</span>
                        <Tag color="blue">custom_menu</Tag>
                        <Badge className="border-transparent bg-green-500 text-white">
                            {`Rank ${idx + 1}`}
                        </Badge>
                    </div>
                ),
                icon: <FaUtensils className="text-blue-500" />,
            });
        });

        // Add custom groups
        allCustomGroups.forEach((group) => {
            categoriesNode.children!.push({
                key: `cg-${group.id}`,
                title: (
                    <div className="flex items-center gap-2">
                        <span>{group.name}</span>
                        <Tag color="purple">custom_group</Tag>
                        <Tag color="blue">{group.type}</Tag>
                    </div>
                ),
                icon: <FaPuzzlePiece className="text-purple-500" />,
            });
        });

        treeData.push(categoriesNode);

        // Items section
        const itemsNode: CategoryTreeNodeData = {
            key: "items",
            title: (
                <span className="font-semibold">
                    <FaUtensils className="inline mr-2" />
                    Items Array
                </span>
            ),
            children: [],
        };

        // Add menu items and their customizations
        menuItems.forEach((menuItem, menuIdx) => {
            const itemNode: CategoryTreeNodeData = {
                key: `item-${menuIdx}`,
                title: (
                    <div className="flex items-center gap-2">
                        <span>{menuItem.name}</span>
                        <Tag color={menuItem.vegNonVeg === "veg" ? "green" : "red"}>
                            {menuItem.vegNonVeg === "veg" ? "Veg" : "Non-Veg"}
                        </Tag>
                        <span className="text-gray-500">₹{menuItem.price}</span>
                    </div>
                ),
                icon: <FaUtensils className="text-orange-500" />,
                children: [],
            };

            // Add custom group references
            if (menuItem.customizationGroups) {
                menuItem.customizationGroups.forEach((group) => {
                    itemNode.children!.push({
                        key: `item-${menuIdx}-cg-${group.id}`,
                        title: (
                            <div className="flex items-center gap-2">
                                <FaLink className="text-blue-500" />
                                <span className="text-sm">References</span>
                                <Tag color="purple">
                                    {group.id}: {group.name}
                                </Tag>
                            </div>
                        ),
                    });

                    // Add customization items
                    group.items.forEach((custItem, custIdx) => {
                        itemNode.children!.push({
                            key: `item-${menuIdx}-cust-${custIdx}`,
                            title: (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{custItem.name}</span>
                                    <Tag color="cyan">customization</Tag>
                                    <span className="text-gray-500 text-sm">
                                        +₹{custItem.price}
                                    </span>
                                    <TooltipHint content={`Parent: ${group.id}`}>
                                        <Tag color="purple" className="text-xs">
                                            → {group.id}
                                        </Tag>
                                    </TooltipHint>
                                </div>
                            ),
                        });
                    });
                });
            }

            itemsNode.children!.push(itemNode);
        });

        treeData.push(itemsNode);

        return treeData;
    };

    const showPayloadPreview = () => {
        const payload = generateMockPayload();
        setSelectedPayload(payload);
        setShowPayloadModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    <FaSitemap className="inline mr-2" />
                    Comprehensive F&B Structure View
                </h3>
                <p className="text-sm text-gray-600">
                    Complete visualization of categories, custom groups, items, and their
                    relationships
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line" className="mb-4 border-b border-n-30">
                    <TabsTrigger value="1">
                        <FaSitemap className="inline mr-1" />
                        Tree View
                    </TabsTrigger>
                    <TabsTrigger value="2">
                        <FaEye className="inline mr-1" />
                        Flow View
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="1">
                    <div className="space-y-4">
                        <Alert
                            message="ONDC F&B Structure"
                            description="Categories array contains both menu categories (custom_menu) and customization groups (custom_group). Items reference custom groups by ID."
                            variant="info"
                        />

                        <CategoryTree
                            data={buildTreeData()}
                            className="bg-gray-50 p-4 rounded-lg"
                        />

                        <Button icon={<FaCode />} onClick={showPayloadPreview}>
                            View Generated Payload Structure
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="2">
                    <div className="space-y-6">
                        <Alert
                            message="Customer Selection Flow"
                            description="This shows how a customer would navigate through the menu and customizations"
                            variant="success"
                        />

                        {Object.entries(categorizedItems).map(([category, items]) => (
                            <Card key={category} className="shadow-md">
                                <h4 className="text-lg font-semibold mb-4">
                                    {category}
                                    <Tag color="blue" className="ml-2">
                                        Menu Category
                                    </Tag>
                                </h4>

                                {items.map((item, idx) => (
                                    <div key={idx} className="mb-6 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-medium text-md">
                                                {item.name}
                                                <Tag
                                                    color={
                                                        item.vegNonVeg === "veg" ? "green" : "red"
                                                    }
                                                    className="ml-2"
                                                >
                                                    {item.vegNonVeg === "veg" ? "Veg" : "Non-Veg"}
                                                </Tag>
                                                {item.rank && (
                                                    <TooltipHint content="Display sequence in menu">
                                                        <Tag color="purple" className="ml-2">
                                                            Rank: {item.rank}
                                                        </Tag>
                                                    </TooltipHint>
                                                )}
                                            </h5>
                                            <span className="text-lg font-semibold">
                                                ₹{item.price}
                                            </span>
                                        </div>

                                        {item.customizationGroups &&
                                            item.customizationGroups.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Customization Flow:
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center flex-wrap gap-2">
                                                        {item.customizationGroups
                                                            .sort(
                                                                (a, b) =>
                                                                    (a.seq || 999) - (b.seq || 999)
                                                            )
                                                            .map((group, gIdx) => (
                                                                <React.Fragment key={group.id}>
                                                                    <div className="bg-white p-3 rounded-lg border-2 border-purple-300">
                                                                        <div className="text-sm font-medium mb-1">
                                                                            {group.name}
                                                                            <Badge className="ml-2 border-transparent bg-violet-500 text-white">
                                                                                {group.id}
                                                                            </Badge>
                                                                            <TooltipHint content="Display sequence">
                                                                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                                                                    Seq:{" "}
                                                                                    {group.seq ||
                                                                                        gIdx + 1}
                                                                                </span>
                                                                            </TooltipHint>
                                                                        </div>
                                                                        <div className="text-xs text-gray-600 mb-2">
                                                                            {group.type === "single"
                                                                                ? "Choose 1"
                                                                                : `Choose ${group.minQuantity}-${group.maxQuantity}`}
                                                                            {group.required && (
                                                                                <Tag
                                                                                    color="red"
                                                                                    className="ml-1 text-xs"
                                                                                >
                                                                                    Required
                                                                                </Tag>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            {group.items.map(
                                                                                (opt) => (
                                                                                    <div
                                                                                        key={opt.id}
                                                                                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                                                                                    >
                                                                                        {opt.name}
                                                                                        {parseFloat(
                                                                                            opt.price
                                                                                        ) > 0 && (
                                                                                            <span className="text-gray-500">
                                                                                                {" "}
                                                                                                (+₹
                                                                                                {
                                                                                                    opt.price
                                                                                                }
                                                                                                )
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {gIdx <
                                                                        item.customizationGroups!
                                                                            .length -
                                                                            1 && (
                                                                        <FaArrowRight className="text-gray-400" />
                                                                    )}
                                                                </React.Fragment>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                ))}
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Payload Preview Modal */}
            <Dialog open={showPayloadModal} onOpenChange={setShowPayloadModal}>
                <DialogContent className="max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle>Generated ONDC Payload Structure</DialogTitle>
                    </DialogHeader>
                    {selectedPayload && (
                        <div className="max-h-96 overflow-auto">
                            <pre className="bg-gray-100 p-4 rounded text-xs">
                                {JSON.stringify(selectedPayload, null, 2)}
                            </pre>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPayloadModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CustomMenuComprehensiveView;
