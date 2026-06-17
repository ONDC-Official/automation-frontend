import { CONFIG_DISPLAY_NAME_MAP } from "@pages/user-profile/constants";
import type { IPastReport } from "@pages/user-profile/types";
import { truncateId, toTitleCase } from "@/utils/formatUtils";

export const getPastReportMeta = (report: IPastReport) => ({
    domain: report.domain,
    version: report.version,
    env: report.env,
    npType: report.npType ?? report.np_type,
    subscriberUrl: report.subscriberUrl ?? report.subscriber_url,
    usecaseId: report.usecaseId ?? report.usecase_id,
    configName: report.configName ?? report.config_name,
});

export const getPastReportTitle = (report: IPastReport): string => {
    const { usecaseId, configName } = getPastReportMeta(report);
    if (usecaseId) {
        return CONFIG_DISPLAY_NAME_MAP[usecaseId] ?? toTitleCase(usecaseId);
    }
    if (configName) return configName;
    return truncateId(report.test_id);
};

export const getPastReportPcts = (report: IPastReport) => {
    const mand = report.flow_summary?.MANDATORY;
    const opt = report.flow_summary?.OPTIONAL;
    const rep = report.flow_summary?.REPORTABLE;

    let overallPct = 0;
    if (report.total_tests != null && report.passed_tests != null && report.total_tests > 0) {
        overallPct = Math.round((report.passed_tests / report.total_tests) * 100);
    } else if (rep && rep.total > 0) {
        overallPct = Math.round((rep.completed / rep.total) * 100);
    }

    const mandatoryPct =
        mand && mand.total > 0 ? Math.round((mand.completed / mand.total) * 100) : 0;
    const optionalPct = opt && opt.total > 0 ? Math.round((opt.completed / opt.total) * 100) : 0;

    return { overallPct, mandatoryPct, optionalPct };
};

export const getPastReportFlowComboKey = (report: IPastReport): string | undefined => {
    const { domain, version, usecaseId } = getPastReportMeta(report);
    if (!domain || !version || !usecaseId) return undefined;
    return `${domain}|${version}|${usecaseId}`;
};
