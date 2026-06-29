/** z-index stack: backdrop z-55, dialog z-60 — portaled pickers must sit above. */
export const FORM_FLOW_FLOATING_Z_INDEX = "z-70";

const PORTAL_OVERLAY_SELECTOR =
    '[data-slot="nested-flow-modal"], [data-slot="popover-content"], [data-slot="combobox-content"], [data-slot="select-content"]';

export const isFormFlowPortaledOverlay = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }
    return Boolean(target.closest(PORTAL_OVERLAY_SELECTOR));
};
