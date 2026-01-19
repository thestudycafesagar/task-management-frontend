import { create } from 'zustand';

/**
 * Modal store for managing modal state
 */
const useModalStore = create((set) => ({
  isOpen: false,
  modalType: null,
  modalData: null,

  /**
   * Open modal
   */
  openModal: (type, data = null) => 
    set({ isOpen: true, modalType: type, modalData: data }),

  /**
   * Close modal
   */
  closeModal: () => 
    set({ isOpen: false, modalType: null, modalData: null }),
}));

export default useModalStore;
