import { FC } from "react";
import { Card, CardContent } from "@/components/shadcn/card";
import { supportInfoItems } from "@/pages/home/constants";
import SupportInfoItem from "@/pages/home/SupportInfoItem";

const SupportInfoGrid: FC = () => (
    <Card variant="muted">
        <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
                {supportInfoItems.map((item) => (
                    <SupportInfoItem key={item.label} item={item} />
                ))}
            </div>
        </CardContent>
    </Card>
);

export default SupportInfoGrid;
