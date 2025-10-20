import React from "react";
import { X } from "lucide-react";

const SideModal = ({ isOpen, onClose, title, children }) => {
  return (
    <div
      className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
      onClick={onClose}
    >
      {/* Modal content */}
      <div
        className={`absolute right-0 top-0 h-full w-96 bg-gray-800 text-gray-200 shadow-2xl border-l border-gray-700 transform transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 bg-gray-900">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SideModal;
