import React from "react";
import { useForm } from "react-hook-form";
import { X, MapPin, Warehouse } from "lucide-react";

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  type: "branches" | "warehouses";
}

export function AddStoreModal({ isOpen, onClose, onConfirm, type }: AddStoreModalProps) {
  const { register, handleSubmit, reset } = useForm();

  if (!isOpen) return null;

  const onSubmit = (data: any) => {
    onConfirm({ ...data, type: type === "branches" ? "branch" : "warehouse" });
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            {type === "branches" ? <MapPin className="w-5 h-5" /> : <Warehouse className="w-5 h-5" />}
            {type === "branches" ? "Yeni Filial" : "Yeni Anbar"}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase">Ad</label>
            <input {...register("name", { required: true })} className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl" />
          </div>
          {type === "branches" && (
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase">Ünvan</label>
              <input {...register("location", { required: true })} className="w-full mt-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl" />
            </div>
          )}
          <button type="submit" className="w-full bg-zinc-900 text-white py-2 rounded-xl mt-4 font-bold">
            Əlavə Et
          </button>
        </form>
      </div>
    </div>
  );
}
