export interface ICircularProgressProps {
  strokeWidth?: number;
  sqSize?: number;
  duration?: number; // in seconds
  onComplete: () => Promise<void>;
  loop: boolean;
  id?: string;
  isActive?: boolean;
}
