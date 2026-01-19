import React from "react";
import { Card, Tag } from "antd";

const CustomMenuDiagram: React.FC = () => {
    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">ONDC F&B Structure Diagram</h3>

            <div className="relative">
                {/* Categories Array Box */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-8">
                    <h4 className="font-semibold text-blue-900 mb-3">Categories Array</h4>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Menu Categories */}
                        <div className="bg-white rounded p-3 border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Menu Categories</span>
                                <Tag color="blue">custom_menu</Tag>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex items-center justify-between">
                                    <span>Pizza</span>
                                    <span className="text-xs text-gray-500">id: "5"</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Beverages</span>
                                    <span className="text-xs text-gray-500">id: "6"</span>
                                </div>
                            </div>
                        </div>

                        {/* Custom Groups */}
                        <div className="bg-white rounded p-3 border border-purple-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Custom Groups</span>
                                <Tag color="purple">custom_group</Tag>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex items-center justify-between">
                                    <span>Size</span>
                                    <span className="text-xs text-gray-500">id: "CG1"</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Toppings</span>
                                    <span className="text-xs text-gray-500">id: "CG2"</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Crust</span>
                                    <span className="text-xs text-gray-500">id: "CG3"</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Connection Lines */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-gray-400 h-16 -mt-8"></div>

                {/* Items Array Box */}
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 mb-3">Items Array</h4>

                    <div className="space-y-4">
                        {/* Main Item */}
                        <Card size="small" className="border-orange-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Farmhouse Pizza</span>
                                <div>
                                    <Tag color="orange">item</Tag>
                                    <span className="text-xs text-gray-500 ml-2">id: "I1"</span>
                                </div>
                            </div>
                            <div className="text-sm space-y-1">
                                <div className="bg-yellow-50 p-2 rounded">
                                    <span className="font-medium text-xs">References:</span>
                                    <div className="mt-1 space-y-1">
                                        <div className="text-xs">
                                            <code>custom_group.id = "CG1"</code> → Size
                                        </div>
                                        <div className="text-xs">
                                            <code>custom_group.id = "CG3"</code> → Crust
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Customization Items */}
                        <div className="ml-8 space-y-2">
                            <div className="text-sm font-medium text-gray-700 mb-1">
                                Customization Items:
                            </div>

                            <Card size="small" className="border-purple-200 bg-purple-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Small</span>
                                    <div>
                                        <Tag color="cyan" className="text-xs">
                                            customization
                                        </Tag>
                                        <span className="text-xs text-gray-500 ml-1">id: "C1"</span>
                                    </div>
                                </div>
                                <div className="text-xs mt-1">
                                    <code>parent.id = "CG1"</code> | <code>child.id = "CG3"</code>
                                </div>
                            </Card>

                            <Card size="small" className="border-purple-200 bg-purple-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Medium</span>
                                    <div>
                                        <Tag color="cyan" className="text-xs">
                                            customization
                                        </Tag>
                                        <span className="text-xs text-gray-500 ml-1">id: "C2"</span>
                                    </div>
                                </div>
                                <div className="text-xs mt-1">
                                    <code>parent.id = "CG1"</code> | <code>child.id = "CG3"</code>
                                </div>
                            </Card>

                            <Card size="small" className="border-purple-200 bg-purple-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">New Hand Tossed</span>
                                    <div>
                                        <Tag color="cyan" className="text-xs">
                                            customization
                                        </Tag>
                                        <span className="text-xs text-gray-500 ml-1">id: "C3"</span>
                                    </div>
                                </div>
                                <div className="text-xs mt-1">
                                    <code>parent.id = "CG3"</code>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Key Points */}
                <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50">
                    <h4 className="font-semibold mb-2">Key Points:</h4>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                            <span className="font-medium mr-2">1.</span>
                            <span>
                                Custom groups are <strong>separate entries</strong> in the
                                categories array, not tags on items
                            </span>
                        </li>
                        <li className="flex items-start">
                            <span className="font-medium mr-2">2.</span>
                            <span>
                                Items <strong>reference</strong> custom groups by ID, they don't
                                define them
                            </span>
                        </li>
                        <li className="flex items-start">
                            <span className="font-medium mr-2">3.</span>
                            <span>
                                Customization items have <strong>parent tags</strong> pointing to
                                custom_group IDs
                            </span>
                        </li>
                        <li className="flex items-start">
                            <span className="font-medium mr-2">4.</span>
                            <span>
                                Child tags create <strong>sequential flows</strong> between custom
                                groups
                            </span>
                        </li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default CustomMenuDiagram;
