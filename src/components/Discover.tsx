export const Discover = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Discover</h1>
      <button onClick={onBack}>Back</button>
    </div>
  );
};
