export const MessageItem = ({ msg }: any) => {
  return (
    <div className="py-4 px-4 max-w-3xl mx-auto w-full text-foreground leading-relaxed">
      {msg.content}
    </div>
  );
};
