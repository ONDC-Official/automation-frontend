import { useState } from "react";

// hooks/usePlaygroundModals.ts
export const usePlaygroundModals = () => {
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupContent, setPopupContent] = useState<JSX.Element | null>(null);

    const openModal = (content: JSX.Element) => {
        setPopupContent(content);
        setPopupOpen(true);
    };

    const closeModal = () => {
        setPopupOpen(false);
    };

    return { popupOpen, popupContent, openModal, closeModal };
};
