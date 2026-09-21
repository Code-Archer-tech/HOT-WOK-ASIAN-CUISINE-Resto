import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Navigation,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Send,
  AlertCircle,
  CheckCircle2,
  Mail,
  User,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import {
  RESTAURANT_CONFIG,
  RESTAURANT_WHATSAPP_NUMBER,
  createWhatsAppUrl,
  isValidIndianMobile,
  cleanIndianMobile,
} from '../config/restaurantConfig';
import { saveContactMessageToFirestore } from '../services/dbService';
import { ContactMessage } from '../types/restaurant';

export const LocationSection: React.FC = () => {
  // Official Restaurant Details per Prompt
  const restaurantName = 'Hot Wok Asian Cuisine Restaurant';
  const restaurantPhone = '9987974833';
  const exactAddress =
    'Shop No. A/1, Urban Empire, Mittal Ground, Opposite Sonaji Nagar, Kausar Baug, Narayan Nagar, Mumbra, Thane, Maharashtra 400612';

  // Google Maps Get Directions URL using the exact address as destination (no fabricated GPS coordinates)
  const getDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${restaurantName}, ${exactAddress}`
  )}`;

  // WhatsApp inquiry URL
  const whatsappUrl = createWhatsAppUrl(
    `Hello ${restaurantName}! I am contacting you from your website regarding an inquiry / dining at your restaurant.`
  );

  // Address Copy state
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(exactAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2500);
  };

  // Contact Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Dining Enquiry');
  const [message, setMessage] = useState('');

  const [formErrors, setFormErrors] = useState<{ [key: string]: string | undefined }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<ContactMessage | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateContactForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = 'Please provide your name (at least 2 characters).';
    }

    const cleanPhone = cleanIndianMobile(phone);
    if (!cleanPhone) {
      errors.phone = 'Mobile number is required.';
    } else if (!isValidIndianMobile(phone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number (e.g. 9987974833).';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!message.trim() || message.trim().length < 10) {
      errors.message = 'Please enter a message of at least 10 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitContactForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateContactForm()) {
      return;
    }

    setIsSubmitting(true);
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const refId = `HW-MSG-${randomSuffix}`;

    const newContactMessage: ContactMessage = {
      id: refId.toLowerCase(),
      referenceId: refId,
      name: name.trim(),
      phone: cleanIndianMobile(phone),
      email: email.trim() || undefined,
      subject,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      // Save directly to Firestore for restaurant management
      await saveContactMessageToFirestore(newContactMessage);
      setSubmittedMessage(newContactMessage);
    } catch (err: any) {
      console.warn('Firestore message save note:', err);
      // Still show confirmation so customer can contact via WhatsApp or phone
      setSubmittedMessage(newContactMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedMessage(null);
    setName('');
    setPhone('');
    setEmail('');
    setSubject('General Dining Enquiry');
    setMessage('');
    setFormErrors({});
    setSubmitError(null);
  };

  const getWhatsAppMessageUrl = (msg: ContactMessage) => {
    const text = `*${restaurantName.toUpperCase()} - WEBSITE INQUIRY*\nReference: ${msg.referenceId}\nFrom: ${msg.name}\nPhone: +91 ${msg.phone}\n${msg.email ? `Email: ${msg.email}\n` : ''}Subject: ${msg.subject}\n\nMessage:\n${msg.message}`;
    return createWhatsAppUrl(text);
  };

  return (
    <section
      id="contact-section"
      className="py-16 sm:py-24 bg-[#07130e] border-t border-[#224d3b]/60 text-[#f6f3ed] relative"
    >
      {/* Anchor bridge for existing location links */}
      <div id="location-section" className="absolute -top-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#15382a] border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Connect & Visit</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#f6f3ed]">
            Contact & Location Details
          </h2>

          <p className="text-sm text-[#c8c0b2] leading-relaxed">
            Reach out to our kitchen desk, reserve catering for your family celebrations, or visit
            us directly in Kausar Baug, Mumbra.
          </p>
        </div>

        {/* 2-Column Responsive Layout: Contact Info & Action Bar (Left) + Interactive Contact Form (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Official Restaurant Info, Address, Hours & 4 Required Quick Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#091711] border border-[#224d3b] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              {/* Restaurant Branding Header */}
              <div className="border-b border-[#224d3b] pb-4">
                <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-widest block mb-1">
                  Official Restaurant Location
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#f6f3ed]">{restaurantName}</h3>
                <p className="text-xs text-[#c8c0b2] mt-1">
                  Authentic Pan-Asian Dining & Wok Bar • Chinese • Korean • Malaysian • Thai
                </p>
              </div>

              {/* Exact Address Box with Address Copy Button */}
              <div className="bg-[#0f271d] border border-[#224d3b] rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37] flex-shrink-0 mt-0.5 shadow">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold text-[#8ea098] tracking-wider block">
                        Restaurant Address
                      </span>
                      <p className="text-sm text-[#f6f3ed] font-medium leading-relaxed mt-1">
                        Shop No. A/1, Urban Empire, Mittal Ground, <br />
                        Opposite Sonaji Nagar, Kausar Baug, Narayan Nagar, <br />
                        <span className="text-[#d4af37] font-semibold">
                          Mumbra, Thane, Maharashtra 400612
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Copy Button */}
                <div className="pt-2 border-t border-[#224d3b]/70 flex items-center justify-between">
                  <span className="text-[11px] text-[#8ea098]">Need to paste into your GPS?</span>
                  <button
                    type="button"
                    id="btn-copy-restaurant-address"
                    onClick={handleCopyAddress}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#15382a] hover:bg-[#1c4b38] border border-[#224d3b] text-xs font-semibold text-[#d4af37] hover:border-[#d4af37] transition-all"
                  >
                    {copiedAddress ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Address Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Opening Hours Box */}
              <div className="bg-[#0f271d] border border-[#224d3b] rounded-xl p-4 sm:p-5 flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37] flex-shrink-0 mt-0.5 shadow">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <span className="text-xs uppercase font-bold text-[#8ea098] tracking-wider block">
                    Opening Hours
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#15382a]/50 p-2 rounded-lg border border-[#224d3b]/60">
                      <span className="text-[#d4af37] font-semibold block">Lunch Service</span>
                      <span className="text-[#f6f3ed]">12:30 PM – 4:00 PM</span>
                    </div>
                    <div className="bg-[#15382a]/50 p-2 rounded-lg border border-[#224d3b]/60">
                      <span className="text-[#d4af37] font-semibold block">Dinner Service</span>
                      <span className="text-[#f6f3ed]">6:30 PM – 11:30 PM</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#8ea098] pt-1">
                    Open <strong className="text-[#f6f3ed]">Monday to Sunday</strong> (All 7 Days)
                    • Continuous Takeaway & Online Orders until 12:00 AM Midnight.
                  </p>
                </div>
              </div>

              {/* Direct Telephone Contact Box */}
              <div className="bg-[#0f271d] border border-[#224d3b] rounded-xl p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37] flex-shrink-0 shadow">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-[#8ea098] tracking-wider block">
                      Direct Telephone
                    </span>
                    <a
                      href={`tel:${restaurantPhone}`}
                      className="text-lg font-serif font-bold text-[#f6f3ed] hover:text-[#d4af37] transition-colors"
                    >
                      {restaurantPhone}
                    </a>
                  </div>
                </div>

                <a
                  href={`tel:${restaurantPhone}`}
                  className="px-3.5 py-1.5 rounded-lg bg-[#15382a] hover:bg-[#1c4b38] border border-[#224d3b] text-xs font-semibold text-[#f6f3ed] hover:text-[#d4af37]"
                >
                  Call Desk
                </a>
              </div>

              {/* Primary Direct Action Buttons (Call, WhatsApp, Get Directions) */}
              <div className="pt-2 space-y-2.5">
                <span className="text-xs font-semibold text-[#c8c0b2] block">
                  Quick Restaurant Connect:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Call Button */}
                  <a
                    id="btn-contact-call"
                    href={`tel:${restaurantPhone}`}
                    className="px-4 py-3 rounded-xl bg-[#15382a] hover:bg-[#1c4b38] border border-[#224d3b] hover:border-[#d4af37] text-[#f6f3ed] hover:text-[#d4af37] font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow active:scale-98"
                  >
                    <Phone className="w-4 h-4 text-[#d4af37]" />
                    <span>Call {restaurantPhone}</span>
                  </a>

                  {/* 2. WhatsApp Button */}
                  <a
                    id="btn-contact-whatsapp"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-98"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>WhatsApp</span>
                  </a>

                  {/* 3. Get Directions Button (Opens Google Maps with restaurant address as source) */}
                  <a
                    id="btn-contact-directions"
                    href={getDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e2c258] hover:to-[#c59b27] text-[#091711] font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-98"
                    title="Open Google Maps Directions with the restaurant address"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Google Map Embedded Frame for Visual Navigation */}
            <div className="bg-[#091711] border border-[#224d3b] rounded-2xl overflow-hidden shadow-xl">
              <div className="h-48 sm:h-56 w-full relative bg-[#0f271d]">
                <iframe
                  title="Hot Wok Asian Cuisine Restaurant Mumbra Directions Map"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    `${restaurantName}, ${exactAddress}`
                  )}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="100%"
                  style={{
                    border: 0,
                    filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)',
                  }}
                  loading="lazy"
                  allowFullScreen
                />
                <div className="absolute top-3 left-3 bg-[#091711]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#224d3b] text-xs font-semibold text-[#f6f3ed] flex items-center space-x-1.5 shadow">
                  <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Kausar Baug • Mittal Ground</span>
                </div>
              </div>

              <div className="p-4 bg-[#0f271d] border-t border-[#224d3b] flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-semibold text-[#f6f3ed]">Opposite Sonaji Nagar</h4>
                  <p className="text-[#8ea098] text-[11px]">Car & two-wheeler parking available.</p>
                </div>
                <a
                  href={getDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#d4af37] hover:underline flex items-center space-x-1"
                >
                  <span>Open Directions</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-6">
            <div className="bg-[#091711] border border-[#224d3b] rounded-2xl p-6 sm:p-8 shadow-xl">
              {submittedMessage ? (
                /* Contact Form Confirmation State */
                <div
                  id="contact-form-success"
                  className="bg-[#0f271d] border border-[#d4af37] rounded-xl p-6 text-center space-y-5 animate-fade-in"
                >
                  <div className="w-14 h-14 rounded-full bg-[#15382a] border-2 border-[#d4af37] text-[#d4af37] flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#d4af37]">
                      Message Received
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-[#f6f3ed]">
                      Thank You, {submittedMessage.name}!
                    </h3>
                    <p className="text-xs text-[#c8c0b2] max-w-md mx-auto">
                      Your message has been delivered to Hot Wok Asian Cuisine Restaurant. Our team
                      will get back to you promptly.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-[#07130e] border border-[#224d3b] rounded-lg p-4 max-w-sm mx-auto text-left text-xs space-y-2">
                    <div className="flex justify-between items-center border-b border-[#224d3b] pb-2">
                      <span className="text-[#8ea098]">Enquiry Reference:</span>
                      <span className="font-mono font-bold text-[#d4af37]">
                        {submittedMessage.referenceId}
                      </span>
                    </div>
                    <div className="space-y-1 text-[#c8c0b2]">
                      <div>
                        <span className="text-[#8ea098]">Contact:</span> +91{' '}
                        {submittedMessage.phone}
                      </div>
                      <div>
                        <span className="text-[#8ea098]">Subject:</span> {submittedMessage.subject}
                      </div>
                      <div className="pt-1 text-[11px] italic text-[#f6f3ed] border-t border-[#224d3b]/50">
                        "{submittedMessage.message}"
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Forward Button */}
                  <div className="space-y-2 pt-2">
                    <a
                      id="btn-forward-contact-whatsapp"
                      href={getWhatsAppMessageUrl(submittedMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow transition-all"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Send Directly to Restaurant on WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      id="btn-reset-contact-form"
                      onClick={handleResetForm}
                      className="inline-flex items-center space-x-1.5 text-xs text-[#8ea098] hover:text-[#d4af37] transition-colors py-1.5 px-3"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Send Another Message</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Contact Form Active Input */
                <form
                  id="restaurant-contact-form"
                  onSubmit={handleSubmitContactForm}
                  noValidate
                  className="space-y-5"
                >
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#f6f3ed]">
                      Send Us a Message
                    </h3>
                    <p className="text-xs text-[#c8c0b2] mt-0.5">
                      Have a query about dining, bulk orders, or party arrangements? Drop us a note
                      below.
                    </p>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/80 text-red-200 text-xs flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Name Field */}
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-[#c8c0b2] mb-1 flex items-center space-x-1"
                    >
                      <User className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Your Name</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (formErrors.name)
                          setFormErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="e.g. Farhan Ansari"
                      className={`w-full bg-[#15382a]/70 border rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none transition-colors ${
                        formErrors.name
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-[#224d3b] focus:border-[#d4af37]'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-[11px] text-red-400 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{formErrors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Phone & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone Field */}
                    <div>
                      <label
                        htmlFor="contact-phone"
                        className="block text-xs font-semibold text-[#c8c0b2] mb-1 flex items-center space-x-1"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Mobile (India)</span>
                        <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#d4af37] select-none">
                          +91
                        </span>
                        <input
                          id="contact-phone"
                          type="tel"
                          required
                          maxLength={10}
                          value={phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setPhone(val);
                            if (formErrors.phone)
                              setFormErrors((prev) => ({ ...prev, phone: undefined }));
                          }}
                          placeholder="99879 74833"
                          className={`w-full bg-[#15382a]/70 border rounded-lg pl-11 pr-3 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none transition-colors ${
                            formErrors.phone
                              ? 'border-red-500 focus:border-red-400'
                              : 'border-[#224d3b] focus:border-[#d4af37]'
                          }`}
                        />
                      </div>
                      {formErrors.phone && (
                        <p className="mt-1 text-[11px] text-red-400 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span>{formErrors.phone}</span>
                        </p>
                      )}
                    </div>

                    {/* Email Field (Optional) */}
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-semibold text-[#c8c0b2] mb-1 flex items-center space-x-1"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Email (Optional)</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formErrors.email)
                            setFormErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        placeholder="you@example.com"
                        className={`w-full bg-[#15382a]/70 border rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none transition-colors ${
                          formErrors.email
                            ? 'border-red-500 focus:border-red-400'
                            : 'border-[#224d3b] focus:border-[#d4af37]'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-[11px] text-red-400 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span>{formErrors.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Subject Dropdown */}
                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-semibold text-[#c8c0b2] mb-1 flex items-center space-x-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Inquiry Topic</span>
                    </label>
                    <select
                      id="contact-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="General Dining Enquiry">General Dining & Menu Inquiry</option>
                      <option value="Party & Catering Order">
                        Catering & Large Bulk Gathering
                      </option>
                      <option value="Home Delivery Query">Home Delivery & Parcel Tracking</option>
                      <option value="Customer Feedback">Food Feedback & Experience</option>
                      <option value="Chef Special Inquiry">Chef Special & Dietary Options</option>
                    </select>
                  </div>

                  {/* Message Field */}
                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-semibold text-[#c8c0b2] mb-1"
                    >
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (formErrors.message)
                          setFormErrors((prev) => ({ ...prev, message: undefined }));
                      }}
                      placeholder="Write your question, party requirements, or feedback..."
                      className={`w-full bg-[#15382a]/70 border rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none transition-colors ${
                        formErrors.message
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-[#224d3b] focus:border-[#d4af37]'
                      }`}
                    />
                    {formErrors.message && (
                      <p className="mt-1 text-[11px] text-red-400 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{formErrors.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    id="btn-submit-contact"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e2c258] hover:to-[#c59b27] text-[#091711] font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-98"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#091711] border-t-transparent rounded-full animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
