import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import {
  RESTAURANT_CONFIG,
  RESTAURANT_WHATSAPP_NUMBER,
  createWhatsAppInquiryUrl,
} from '../config/restaurantConfig';

export const FloatingWhatsAppButton: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const whatsappUrl = createWhatsAppInquiryUrl();

  return (
    <div
      id="floating-whatsapp-container"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-end flex-col group select-none pointer-events-auto"
    >
      {/* Floating Hover Badge on Desktop */}
      <div
        className={`mb-2 hidden sm:flex items-center space-x-2 bg-[#091711]/95 text-[#f6f3ed] border border-[#224d3b] px-3.5 py-1.5 rounded-full shadow-2xl transition-all duration-300 ${
          showTooltip ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-xs font-semibold text-[#f6f3ed]">
          Order on WhatsApp: <span className="text-[#d4af37]">+{RESTAURANT_WHATSAPP_NUMBER}</span>
        </span>
      </div>

      {/* Main Floating Button */}
      <a
        id="btn-floating-whatsapp"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-2xl shadow-emerald-950/80 transition-all duration-300 transform hover:scale-110 active:scale-95 border-2 border-white/20"
        aria-label="Chat or order on WhatsApp with Hot Wok Asian Cuisine"
        title={`Chat or Order on WhatsApp: +${RESTAURANT_WHATSAPP_NUMBER}`}
      >
        {/* Subtle pulsating ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none" />

        {/* WhatsApp Icon */}
        <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 fill-white relative z-10" />

        {/* Mobile quick badge */}
        <span className="sm:hidden absolute -top-1 -left-2 bg-[#091711] text-[#25D366] border border-[#25D366] text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
          Chat
        </span>
      </a>
    </div>
  );
};
