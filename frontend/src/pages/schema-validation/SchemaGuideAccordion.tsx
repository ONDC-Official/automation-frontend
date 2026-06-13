import { FC } from "react";

import AccordionDataComponent from "@/components/Accordion";
import { SCHEMA_GUIDE_STEPS } from "@pages/schema-validation/constants";

/**
 * Collapsible how-to guide for the schema validation page.
 */
const SchemaGuideAccordion: FC = () => (
    <AccordionDataComponent title="How to use" steps={SCHEMA_GUIDE_STEPS} />
);

export default SchemaGuideAccordion;
