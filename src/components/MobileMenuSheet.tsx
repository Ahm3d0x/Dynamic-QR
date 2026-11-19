import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  headerSlot?: React.ReactNode;
  children: React.ReactNode;
}

export const MobileMenuSheet: React.FC<MobileMenuSheetProps> = ({
  isOpen,
  onClose,
  title,
  headerSlot,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Mobile navigation menu'}
        >
          {/* Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1B251F]/60 backdrop-blur-xs"
          />

          {/* Slide-Up Modern Bottom Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0.96 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-h-[88dvh] bg-[#F8F5EF] border-t border-[#E6E0D6] rounded-t-[28px] shadow-2xl flex flex-col overflow-hidden pb-safe"
          >
            {/* Drag Handle */}
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-11 h-1.5 rounded-full bg-[#D8D0C4]" />
            </div>

            {/* Sheet Header */}
            <div className="px-5 pt-2 pb-3.5 border-b border-[#E6E0D6] flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0 flex-1">
                {headerSlot ? (
                  headerSlot
                ) : (
                  <h2 className="text-base font-bold text-[#292824] truncate">{title}</h2>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close mobile menu"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl bg-white border border-[#E6E0D6] text-[#6E6A63] hover:text-[#292824] active:scale-95 transition-transform cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
