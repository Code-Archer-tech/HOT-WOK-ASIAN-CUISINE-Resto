import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus, CheckCircle2, Flame, UtensilsCrossed, Sparkles, HeartHandshake } from 'lucide-react';
import { Review } from '../types/restaurant';
import { subscribeReviews, submitReview } from '../services/dbService';

export const ReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [dishRecommended, setDishRecommended] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const unsub = subscribeReviews((data) => {
      setReviews(data);
    }, false);
    return () => unsub();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    setIsSubmitting(true);
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      name: name.trim(),
      rating,
      comment: comment.trim(),
      dishRecommended: dishRecommended.trim() || undefined,
      approved: true, // auto approve or admin moderation
      createdAt: new Date().toISOString(),
    };

    try {
      await submitReview(newRev);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowReviewModal(false);
        setName('');
        setComment('');
        setDishRecommended('');
      }, 2000);
    } catch (err) {
      console.error('Error submitting review', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="reviews-section" className="py-16 sm:py-24 bg-[#091711] text-[#f6f3ed] border-t border-[#224d3b]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Restaurant Highlights Section */}
        <div className="mb-20">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#15382a] border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Hot Wok Distinction</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#f6f3ed]">
              Restaurant Highlights
            </h2>
            <p className="text-sm text-[#c8c0b2]">
              Crafted with culinary reverence, uncompromised halal freshness, and authentic pan-Asian tradition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Highlight 1 */}
            <div className="bg-[#0f271d] border border-[#224d3b] rounded-2xl p-6 space-y-3 hover:border-[#d4af37]/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#f6f3ed]">Searing Wok Hei</h3>
              <p className="text-xs text-[#c8c0b2] leading-relaxed">
                Cooked over blazing high-output burners in traditional carbon iron woks, creating that smoky signature wok breath.
              </p>
            </div>

            {/* Highlight 2 */}
            <div className="bg-[#0f271d] border border-[#224d3b] rounded-2xl p-6 space-y-3 hover:border-[#d4af37]/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#f6f3ed]">4 Culinary Capitals</h3>
              <p className="text-xs text-[#c8c0b2] leading-relaxed">
                Recipes honoring Sichuan Chinese techniques, Seoul street glazes, Bangkok lemongrass broths, and Malaysian sambals.
              </p>
            </div>

            {/* Highlight 3 */}
            <div className="bg-[#0f271d] border border-[#224d3b] rounded-2xl p-6 space-y-3 hover:border-[#d4af37]/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#f6f3ed]">Mumbra Kepsa Legend</h3>
              <p className="text-xs text-[#c8c0b2] leading-relaxed">
                Grand celebration platters served with saffron-scented Asian rice, tandoori tikka, rich spiced gravy, and egg garnishes.
              </p>
            </div>

            {/* Highlight 4 */}
            <div className="bg-[#0f271d] border border-[#224d3b] rounded-2xl p-6 space-y-3 hover:border-[#d4af37]/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#f6f3ed]">Family Dining Comfort</h3>
              <p className="text-xs text-[#c8c0b2] leading-relaxed">
                Spacious, air-conditioned seating at Urban Empire, Mittal Ground, with polite hospitality and prompt parcel takeaway.
              </p>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#d4af37] uppercase tracking-wider mb-1">
                <Star className="w-3.5 h-3.5 fill-[#d4af37]" />
                <span>Guest Experiences</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#f6f3ed]">
                Loved by Foodies in Mumbra & Thane
              </h3>
            </div>

            <button
              id="btn-open-add-review"
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2.5 rounded-lg bg-[#15382a] border border-[#d4af37] text-xs font-semibold text-[#d4af37] hover:bg-[#d4af37] hover:text-[#091711] transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Share Your Dining Review</span>
            </button>
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#0f271d] border border-[#224d3b] rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-1 text-[#d4af37]">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#d4af37]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#e8e4dc] leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="pt-3 border-t border-[#224d3b]/60 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-semibold text-[#f6f3ed]">{rev.name}</h4>
                    {rev.dishRecommended && (
                      <span className="text-[11px] text-[#d4af37] block mt-0.5">
                        Favorite: {rev.dishRecommended}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#8ea098]">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leave a review modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-[#091711] border border-[#224d3b] rounded-2xl max-w-md w-full p-6 text-[#f6f3ed] shadow-2xl space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#f6f3ed]">Write a Review</h3>

            {submitted ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-sm">Thank You for Your Feedback!</h4>
                <p className="text-xs text-[#c8c0b2]">Your review has been saved.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#c8c0b2] mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Farhan Shaikh"
                    className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg px-3 py-2 text-xs text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c8c0b2] mb-1">Star Rating</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="p-1 focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            s <= rating ? 'text-[#d4af37] fill-[#d4af37]' : 'text-[#224d3b]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c8c0b2] mb-1">Recommended Dish (Optional)</label>
                  <input
                    type="text"
                    value={dishRecommended}
                    onChange={(e) => setDishRecommended(e.target.value)}
                    placeholder="e.g. Hot Wok Special Chicken Kepsa"
                    className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg px-3 py-2 text-xs text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c8c0b2] mb-1">Your Review</label>
                  <textarea
                    required
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the flavour, portion size, ambiance, and service..."
                    className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg px-3 py-2 text-xs text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 rounded-lg border border-[#224d3b] text-xs text-[#c8c0b2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b89327] text-[#091711] font-bold text-xs"
                  >
                    {isSubmitting ? 'Posting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
