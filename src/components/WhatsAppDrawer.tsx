import React, { useState } from 'react';
import { playSoftClick, playWaterDrop } from '../utils/audio';

interface WhatsAppDrawerProps {
  initialMessage?: string;
}

export const WhatsAppDrawer: React.FC<WhatsAppDrawerProps> = ({ initialMessage = '' }) => {
  const [phone, setPhone] = useState(() => localStorage.getItem('verdant_wa_number') || '12095550192');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [chatInput, setChatInput] = useState(initialMessage);
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'grower'; text: string; time: string }>>([
    {
      sender: 'grower',
      text: 'Hello! Welcome to notme 209 farm office. Which cultivar were you curious about this week?',
      time: 'Just now',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSavePhone = () => {
    localStorage.setItem('verdant_wa_number', phone.trim());
    setIsEditingPhone(false);
  };

  const handleSendToWhatsAppApp = (customMsg?: string) => {
    const textToSend = customMsg || chatInput || 'Hello! I had a question about your CBD flower.';
    const encoded = encodeURIComponent(textToSend);
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendLiveSimulatedChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = [...chatLog, { sender: 'user' as const, text: userMsg, time: timeStr }];
    setChatLog(updated);
    setChatInput('');
    setIsTyping(true);
    playSoftClick();

    try {
      const res = await fetch('/api/gemini/cultivator-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated,
          userMessage: userMsg,
        }),
      });
      const data = await res.json();
      if (data.success && data.text) {
        setChatLog((prev) => [
          ...prev,
          {
            sender: 'grower',
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        playWaterDrop();
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    'Which strain is best for winding down in the evening?',
    'What living soil nutrients do you use in the 209?',
    'How do you achieve <0.3% THC with 18%+ CBD?',
    'Can I order a sample jar of Sunset Sherbert?',
  ];

  return (
    <section id="contact" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="bg-[#151b13] border border-[#e5dfd3]/10 rounded-2xl p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center text-left shadow-2xl">
        {/* Left column: Direct copy & WhatsApp CTA */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="text-[10px] font-mono text-[#c4a484] tracking-[0.3em] uppercase">
            FARM DIRECT COMMUNICATION
          </div>
          <h2 className="font-serif italic text-3xl sm:text-4xl text-[#e5dfd3] leading-tight">
            Questions about a strain, or want to order?
          </h2>
          <p className="text-sm sm:text-base text-[#8b9584] leading-relaxed font-light">
            Send a message on WhatsApp and you’ll hear back directly from our cultivation office — no automated call trees, no guesswork, just honest conversation about soil, harvest dates, and curing.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="waCta"
              type="button"
              onClick={() => handleSendToWhatsAppApp()}
              className="px-6 py-3 rounded-full bg-[#25d366] text-[#0b140e] font-mono text-xs font-semibold hover:bg-[#20ba59] transition-all flex items-center gap-2 shadow-lg tracking-wider"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
              </svg>
              <span>Launch WhatsApp</span>
            </button>

            {/* Config number toggle */}
            <button
              id="config-wa-number-btn"
              type="button"
              onClick={() => setIsEditingPhone(!isEditingPhone)}
              className="text-xs font-mono text-[#8b9584] hover:text-[#e5dfd3] underline px-2 py-1"
            >
              {phone ? `Connected: +${phone}` : 'Set Custom Number'}
            </button>
          </div>

          {/* Inline Phone Configuration Form */}
          {isEditingPhone && (
            <div className="bg-[#0f120d] p-3 rounded-lg border border-[#e5dfd3]/10 flex items-center gap-2 mt-1">
              <input
                id="wa-phone-input"
                type="text"
                placeholder="Country code + number (e.g. 12095550192)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent text-xs font-mono text-[#e5dfd3] px-2 py-1 flex-1 focus:outline-none"
              />
              <button
                id="save-wa-phone-btn"
                type="button"
                onClick={handleSavePhone}
                className="px-3.5 py-1 bg-[#c4a484] text-[#0f120d] text-xs font-mono font-semibold rounded"
              >
                Save
              </button>
            </div>
          )}

          {/* Quick Prompt Pills */}
          <div className="flex flex-col gap-2 pt-3">
            <span className="text-[10px] font-mono text-[#8b9584] uppercase tracking-[0.2em]">
              FREQUENT INQUIRIES
            </span>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  id={`quick-wa-prompt-${idx}`}
                  type="button"
                  onClick={() => {
                    setChatInput(qp);
                    playSoftClick();
                  }}
                  className="text-xs text-[#e5dfd3]/80 hover:text-[#e5dfd3] bg-[#0f120d]/80 hover:bg-[#0f120d] px-3 py-1.5 rounded-full border border-[#e5dfd3]/10 transition-all text-left"
                >
                  "{qp}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Interactive WhatsApp Terminal with Gemini Live Dialogue */}
        <div className="lg:col-span-6">
          <div className="bg-[#0f120d] border border-[#e5dfd3]/10 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e5dfd3]/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#170c24] border border-purple-500/50 flex items-center justify-center font-mono text-[#c084fc] text-xs font-bold shadow-md">
                    209
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#25d366] ring-2 ring-[#0f120d]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#e5dfd3]">notme 209 Botanical Cultivator</div>
                  <div className="text-[11px] text-[#c084fc] font-mono">Living-Soil Cultivation Office</div>
                </div>
              </div>

              <span className="text-[10px] font-mono bg-[#151b13] text-[#8b9584] px-2 py-0.5 rounded border border-[#e5dfd3]/10">
                AI + DIRECT ROUTING
              </span>
            </div>

            {/* Message Bubble Container */}
            <div className="flex flex-col gap-3 min-h-[220px] max-h-[300px] overflow-y-auto pr-1">
              {chatLog.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[85%] ${
                    m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div
                    className={`p-3 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-[#2b3a24] text-[#e5dfd3] rounded-2xl rounded-tr-xs'
                        : 'bg-[#151b13] text-[#e5dfd3] rounded-2xl rounded-tl-xs border border-[#e5dfd3]/10'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] font-mono text-[#8b9584]/60 mt-1 px-1">{m.time}</span>
                </div>
              ))}

              {isTyping && (
                <div className="self-start bg-[#151b13] px-3.5 py-2 rounded-2xl rounded-tl-xs text-xs text-[#8b9584] font-mono flex items-center gap-1.5 animate-pulse">
                  <span>Cultivator is writing…</span>
                </div>
              )}
            </div>

            {/* Interactive Input form */}
            <form onSubmit={handleSendLiveSimulatedChat} className="flex gap-2 pt-2 border-t border-[#e5dfd3]/10">
              <input
                id="waMsg"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about living soil, terpene profiles, or jars…"
                className="flex-1 bg-[#151b13] border border-[#e5dfd3]/10 text-xs text-[#e5dfd3] px-4 py-2.5 rounded-full focus:outline-none focus:border-[#c4a484]"
              />
              <button
                id="waSendBtn"
                type="submit"
                aria-label="Send live question to grower"
                className="w-10 h-10 rounded-full bg-[#25d366] text-[#0b140e] flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0 cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                </svg>
              </button>
            </form>

            <div className="text-[11px] text-[#8b9584] flex items-center justify-between px-1">
              <span>Enter sends instant AI response</span>
              <button
                type="button"
                onClick={() => handleSendToWhatsAppApp(chatInput)}
                className="text-[#25d366] hover:underline"
              >
                Open real WhatsApp ↗
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
