import { useState, type JSX } from "react";

interface IModalOptions {
    className?: string;
}

export const usePlaygroundModals = () => {
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupContent, setPopupContent] = useState<JSX.Element | null>(null);
    const [modalClassName, setModalClassName] = useState<string | undefined>();

    const openModal = (content: JSX.Element, options?: IModalOptions) => {
        setPopupContent(content);
        setModalClassName(options?.className);
        setPopupOpen(true);
    };

    const closeModal = () => {
        setPopupOpen(false);
        setModalClassName(undefined);
    };

    return { popupOpen, popupContent, modalClassName, openModal, closeModal };
};
