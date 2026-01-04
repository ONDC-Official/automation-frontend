import { GoCodespaces, GoWorkflow } from "react-icons/go";
import { MdSchema } from "react-icons/md";
import { FaUserPlus } from "react-icons/fa6";
import { ROUTES } from "@/constants/routes";
import { Feature } from "./types";

export const features: Feature[] = [
  {
    title: "Schema Validation",
    subtitle: "Verify Individual Payloads Instantly",
    description:
      "Ensure your JSONs are ONDC-compliant by validating schemas against model implementations requirements instantly.",
    path: ROUTES.SCHEMA,
    icon: <MdSchema className="text-sky-600 text-4xl" />,
    analytics: {
      category: "HOME",
      action: "Clicked in schema validation",
      label: "SCHEMA_VALIDATION",
    },
  },
  {
    title: "Scenario Testing",
    subtitle: "Simulate End-to-End Transaction Flows",
    description:
      "Run complete workflows across buyer app and seller app interactions ensuring accurate transaction flow implementation and protocol compliance.",
    path: ROUTES.SCENARIO,
    icon: <GoWorkflow className="text-sky-600 text-4xl" />,
    analytics: {
      category: "HOME",
      action: "Clicked in scenario testing",
      label: "SCENARIO_TESTING",
    },
  },
  {
    title: "Protocol Playground",
    subtitle: "Customize and Experiment with Transaction Flows",
    description: "Interactively design and test your mock transaction flows using javascript.",
    path: ROUTES.PLAYGROUND,
    icon: <GoCodespaces className="text-sky-600 text-4xl" />,
  },
  {
    title: "Seller Onboarding",
    subtitle: "Quick & Easy Seller Registration",
    description:
      "Streamline the seller onboarding process with our comprehensive registration flow. Manage store details, serviceability areas, and product catalogs effortlessly.",
    path: ROUTES.SELLER_ONBOARDING,
    icon: <FaUserPlus className="text-sky-600 text-4xl" />,
  },
];
