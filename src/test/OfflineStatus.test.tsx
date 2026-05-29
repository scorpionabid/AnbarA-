import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OfflineStatus } from '../components/OfflineStatus';

// Mock navigator.onLine
const setOnlineStatus = (status: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    value: status,
  });
};

describe('OfflineStatus Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when online by default', () => {
    setOnlineStatus(true);
    render(<OfflineStatus />);
    expect(screen.queryByText(/Oflayn rejim/i)).not.toBeInTheDocument();
  });

  it('shows offline status when navigator is offline', () => {
    setOnlineStatus(false);
    render(<OfflineStatus />);
    expect(screen.getByText(/Oflayn rejim/i)).toBeInTheDocument();
    expect(screen.getByText(/Məlumatlar yerli yaddaşda saxlanılır/i)).toBeInTheDocument();
  });
});
