import { IoMdClose } from "react-icons/io";

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  children: any;
}

const Modal = ({ isOpen, onClose, children }: IProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50"
      onClick={onClose} // Close modal when clicking outside the content
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside content
      >
        <button className="flex float-end" onClick={onClose}>
          <IoMdClose />
        </button>
        <div className="flex flex-col gap-5">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
