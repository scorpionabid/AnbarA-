import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Təsdiqlə",
  cancelText = "Ləğv et",
  type = "danger"
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={
                `w-12 h-12 rounded-2xl flex items-center justify-center ${
                  type === "danger" ? "bg-red-50 text-red-600" :
                  type === "warning" ? "bg-amber-50 text-amber-600" :
                  "bg-blue-50 text-blue-600"
                }`
              }>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-2 mb-8">
              <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{message}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-sm bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={
                  `flex-1 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all ${
                    type === "danger" ? "bg-red-600 hover:bg-red-700" :
                    type === "warning" ? "bg-amber-600 hover:bg-amber-700" :
                    "bg-blue-600 hover:bg-blue-700"
                  }`
                }
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
