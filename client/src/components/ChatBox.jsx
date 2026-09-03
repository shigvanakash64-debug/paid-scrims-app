const bubbleStyles = {
  admin: 'rounded-[28px] rounded-tr-none bg-[#1F1F1F] text-white',
  user: 'rounded-[28px] rounded-bl-none bg-[#FF6A00] text-black',
  system: 'rounded-3xl bg-[#0B0B0B] text-[#A1A1A1] border border-[#2A2A2A]',
};

export const ChatBox = ({ messages, onSendMessage, status }) => {

  return (
    <section className="space-y-4 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[#A1A1A1]">Live Chat</p>
          <h2 className="text-xl font-semibold">Match communications</h2>
        </div>
        <span className="rounded-full border border-[#2A2A2A] bg-[#0B0B0B] px-3 py-2 text-sm text-[#A1A1A1]">Controlled</span>
      </div>

      <div className="space-y-3 rounded-3xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`${bubbleStyles[message.sender] || bubbleStyles.system} max-w-[85%] px-4 py-3 text-sm leading-6`}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">
                <span>{message.sender === 'admin' ? 'ADMIN' : message.sender === 'user' ? 'YOU' : 'SYSTEM'}</span>
                <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p>{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      {status !== 'cancelled' && (
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); const input = event.currentTarget.elements.message; if (input.value.trim()) { onSendMessage(input.value.trim()); input.value = ''; } }}>
          <input name="message" type="text" maxLength="300" placeholder="Type a message..." className="min-w-0 flex-1 rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6A00]" />
          <button type="submit" className="rounded-2xl bg-[#FF6A00] px-5 py-3 text-sm font-semibold text-black">Send</button>
        </form>
      )}
    </section>
  );
};
