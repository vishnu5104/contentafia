"use client";
import Modal from ".";
import { createContext, useContext, useState } from "react";
const ModalContext = createContext(undefined);
export function ModalProvider({ children }) {
    const [modalContent, setModalContent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const show = (content) => {
        setModalContent(content);
        setShowModal(true);
    };
    const hide = () => {
        setShowModal(false);
        setTimeout(() => {
            setModalContent(null);
        }, 300); // Adjust this timeout as per your transition duration
    };
    return (<ModalContext.Provider value={{ show, hide }}>
      {children}
      {showModal && (<Modal showModal={showModal} setShowModal={setShowModal}>
          {modalContent}
        </Modal>)}
    </ModalContext.Provider>);
}
export function useModal() {
    return useContext(ModalContext);
}
