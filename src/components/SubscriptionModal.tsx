export const SubscriptionModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg">
        <h2>Subscription</h2>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
