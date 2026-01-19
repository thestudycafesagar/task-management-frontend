import { create } from 'zustand';

/**
 * Global loader store
 */
const useLoaderStore = create((set) => ({
  isGlobalLoading: false,
  loadingMessage: '',

  /**
   * Show global loader
   */
  showLoader: (message = 'Loading...') => 
    set({ isGlobalLoading: true, loadingMessage: message }),

  /**
   * Hide global loader
   */
  hideLoader: () => 
    set({ isGlobalLoading: false, loadingMessage: '' }),
}));

export default useLoaderStore;
