import { useState } from "react";
import type { IProfileCounts } from "@pages/user-profile/types";

const INITIAL_COUNTS: IProfileCounts = {
    configs: 0,
    pastReports: 0,
    history: 0,
};

export const useProfileCounts = () => useState<IProfileCounts>(INITIAL_COUNTS);
