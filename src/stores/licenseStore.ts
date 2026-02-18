import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { LicenseStatus } from '@/domain/license';

interface LicenseState {
  isLicensed: boolean;
  isChecking: boolean;
  isActivating: boolean;
  email: string;
  hardwareId: string;
  message: string;
  error: string | null;

  checkLicense: () => Promise<void>;
  activateLicense: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useLicenseStore = create<LicenseState>()((set) => ({
  isLicensed: false,
  isChecking: true,
  isActivating: false,
  email: '',
  hardwareId: '',
  message: '',
  error: null,

  checkLicense: async () => {
    set({ isChecking: true, error: null });
    try {
      const status = await invoke<LicenseStatus>('check_license');
      set({
        isLicensed: status.is_licensed,
        email: status.email,
        hardwareId: status.hardware_id,
        message: status.message,
        isChecking: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({
        isLicensed: false,
        error: message,
        isChecking: false,
      });
    }
  },

  activateLicense: async (email: string) => {
    set({ isActivating: true, error: null, message: '' });
    try {
      const status = await invoke<LicenseStatus>('activate_license', {
        email,
      });
      set({
        isLicensed: status.is_licensed,
        email: status.email,
        hardwareId: status.hardware_id,
        message: status.message,
        isActivating: false,
        error: status.is_licensed ? null : status.message,
      });
      return status.is_licensed;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({
        error: message,
        isActivating: false,
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await invoke('logout_license');
    } catch {
      // ignore
    }
    set({
      isLicensed: false,
      email: '',
      message: '',
      error: null,
    });
  },
}));
