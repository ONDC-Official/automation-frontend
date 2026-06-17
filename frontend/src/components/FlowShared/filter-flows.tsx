import { FilterBadge } from "@/components/Shadcn/Badge";

interface IFlowFiltersPanelProps {
    flowTags: string[];
    selectedTags: string[];
    onSelectedTagsChange: (tags: string[]) => void;
}

export const FlowFiltersPanel = ({
    flowTags,
    selectedTags,
    onSelectedTagsChange,
}: IFlowFiltersPanelProps) => {
    const toggleSelect = (item: string) => {
        onSelectedTagsChange(
            selectedTags.includes(item)
                ? selectedTags.filter((v) => v !== item)
                : [...selectedTags, item]
        );
    };

    return (
        <div className="flex flex-wrap gap-3">
            {flowTags.map((item) => (
                <FilterBadge
                    key={item}
                    label={item}
                    selected={selectedTags.includes(item)}
                    onClick={() => toggleSelect(item)}
                />
            ))}
        </div>
    );
};
