import React from 'react';
import { MapPin, Phone, Clock, MessageCircle, Navigation, ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';

export const LocationSection: React.FC = () => {
  const addressText =
    'Shop No. A/1, Urban Empire, Mittal Ground, Opposite Sonaji Nagar, Kausar Baug, Narayan Nagar, Mumbra, Thane, Maharashtra 400612';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'Hot Wok Asian Cuisine ' + addressText
  )}`;
  const whatsappUrl = `https://wa.me/919987974833?text=${encodeURIComponent(
    'Hello Hot Wok Asian Cuisine! I would like to inquire about dining, menu specialties and table bookings.'
  )}`;

  return (
    <section id="location-section" className="py-16 sm:py-24 bg-[#07130e] border-t border-[#224d3b]/60 text-[#f6f3ed]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#15382a] border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Visit Us In Mumbra</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#f6f3ed]">
            Location & Contact Details
          </h2>
          <p className="text-sm text-[#c8c0b2]">
            Experience authentic wok aromatics and luxury seating right in the heart of Kausar Baug.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Information Card */}
          <div className="lg:col-span-6 bg-[#091711] border border-[#224d3b] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl space-y-6">
            <div className="space-y-6">
              {/* Restaurant Name Banner */}
              <div className="border-b border-[#224d3b] pb-4">
                <h3 className="font-serif text-2xl font-bold text-[#f6f3ed]">HOT WOK ASIAN CUISINE</h3>
                <p className="text-xs text-[#d4af37] tracking-wider uppercase font-semibold mt-0.5">
                  Chinese • Korean • Malaysian • Thai Fusion
                </p>
              </div>

              {/* Address details */}
              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37] flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-[#8ea098] tracking-wider block">
                    Exact Address:
                  </span>
                  <p className="text-sm text-[#f6f3ed] font-medium leading-relaxed mt-0.5">
                    Shop No. A/1, Urban Empire, Mittal Ground, <br />
                    Opposite Sonaji Nagar, Kausar Baug, Narayan Nagar, <br />
                    <span className="text-[#d4af37] font-semibold">Mumbra, Thane, Maharashtra 400612</span>
                  </p>
                </div>
              </div>

              {/* Timings */}
              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37] flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-[#8ea098] tracking-wider block">
                    Operating Hours:
                  </span>
                  <p className="text-sm text-[#f6f3ed] font-medium mt-0.5">
                    Monday to Sunday: <span className="text-[#d4af37]">12:00 PM – 12:00 AM Midnight</span>
                  </p>
                  <p className="text-xs text-[#c8c0b2]">Continuous dine-in, takeaway parcel & delivery support</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37] flex-shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-[#8ea098] tracking-wider block">
                    Direct Contact:
                  </span>
                  <a
                    href="tel:9987974833"
                    className="text-base font-serif font-bold text-[#f6f3ed] hover:text-[#d4af37] transition-colors mt-0.5 inline-block"
                  >
                    +91 99879 74833
                  </a>
                  <p className="text-xs text-[#c8c0b2]">Customer support & party catering desk</p>
                </div>
              </div>
            </div>

            {/* 3 Required Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#224d3b]">
              {/* Call Button */}
              <a
                id="btn-location-call"
                href="tel:9987974833"
                className="px-4 py-3 rounded-xl bg-[#15382a] border border-[#224d3b] hover:border-[#d4af37] text-[#f6f3ed] hover:text-[#d4af37] font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow"
              >
                <Phone className="w-4 h-4 text-[#d4af37]" />
                <span>Call Now</span>
              </a>

              {/* WhatsApp Button */}
              <a
                id="btn-location-whatsapp"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp</span>
              </a>

              {/* Google Maps Button */}
              <a
                id="btn-location-maps"
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e2c258] hover:to-[#c59b27] text-[#091711] font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow"
              >
                <Navigation className="w-4 h-4" />
                <span>Google Maps</span>
              </a>
            </div>
          </div>

          {/* Interactive Map & Landmark Card */}
          <div className="lg:col-span-6 bg-[#091711] border border-[#224d3b] rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
            {/* Embedded Google Map Frame */}
            <div className="h-64 sm:h-80 w-full relative bg-[#0f271d]">
              <iframe
                title="Hot Wok Asian Cuisine Mumbra Map"
                src="https://maps.google.com/maps?q=Urban%20Empire%2C%20Mittal%20Ground%2C%20Kausar%20Baug%2C%20Mumbra%2C%20Thane&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                loading="lazy"
                allowFullScreen
              />
              <div className="absolute top-3 left-3 bg-[#091711]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#224d3b] text-xs font-semibold text-[#f6f3ed] flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Kausar Baug Landmark</span>
              </div>
            </div>

            {/* Quick directions hint */}
            <div className="p-6 bg-[#0f271d] border-t border-[#224d3b] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#f6f3ed]">Opposite Sonaji Nagar, Mittal Ground</h4>
                <p className="text-xs text-[#c8c0b2] mt-0.5">Ample parking space available for cars and bikes.</p>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#d4af37] hover:underline flex items-center space-x-1"
              >
                <span>Directions</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
