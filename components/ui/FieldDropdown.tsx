import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, View, type View as ViewType } from 'react-native';

import { cn } from '@/lib/cn';

export type FieldAnchorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type UseFieldDropdownOptions = {
  minWidth?: number;
  onOpen?: () => void;
  onClose?: () => void;
};

export function useFieldDropdown(options: UseFieldDropdownOptions = {}) {
  const { minWidth = 160, onOpen, onClose } = options;
  const anchorRef = useRef<ViewType>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<FieldAnchorRect | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  const openDropdown = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({
        x,
        y,
        width: width || minWidth,
        height: height || 32,
      });
      setOpen(true);
      onOpen?.();
    });
  }, [minWidth, onOpen]);

  return {
    anchorRef,
    open,
    anchor,
    openDropdown,
    close,
  };
}

type FieldDropdownPanelProps = {
  visible: boolean;
  anchor: FieldAnchorRect | null;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: number;
  minWidth?: number;
  className?: string;
};

export function FieldDropdownPanel({
  visible,
  anchor,
  onClose,
  children,
  maxHeight = 320,
  minWidth = 160,
  className,
}: FieldDropdownPanelProps) {
  if (!visible || !anchor) {
    return null;
  }

  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
  const gap = 4;
  const panelWidth = Math.min(Math.max(anchor.width, minWidth), windowWidth - 16);
  const left = Math.max(8, Math.min(anchor.x, windowWidth - panelWidth - 8));
  const spaceBelow = windowHeight - (anchor.y + anchor.height) - gap;
  const spaceAbove = anchor.y - gap;
  const openBelow = spaceBelow >= 160 || spaceBelow >= spaceAbove;
  const availableHeight = Math.min(maxHeight, openBelow ? spaceBelow - 8 : spaceAbove - 8);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" className="absolute inset-0" onPress={onClose} />
      <View
        style={{
          position: 'absolute',
          left,
          width: panelWidth,
          maxHeight: Math.max(availableHeight, 120),
          ...(openBelow
            ? { top: anchor.y + anchor.height + gap }
            : { bottom: windowHeight - anchor.y + gap }),
        }}
        className={cn(
          'overflow-hidden rounded-button border border-border bg-surface shadow-panel dark:border-border-dark dark:bg-surface-dark',
          className,
        )}>
        {children}
      </View>
    </Modal>
  );
}
