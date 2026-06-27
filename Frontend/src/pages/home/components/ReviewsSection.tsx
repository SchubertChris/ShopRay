import { Stars } from '@components/ui';
import { REVIEWS } from './home.data';

export function ReviewsSection() {
  const featuredReview = REVIEWS[0];
  const miniReviews    = REVIEWS.slice(1);

  return (
    <section className="cs-reviews" aria-labelledby="reviews-heading">
      <div className="cs-section-head" data-reveal>
        <div>
          <span className="cs-eyebrow">Was Kunden sagen</span>
          <h2 id="reviews-heading" className="cs-heading">Echte Bewertungen</h2>
        </div>
        <div className="cs-reviews__rating-badge">
          <Stars rating={4.9} size={16} />
          <span>4.9 · 1.000+ Bewertungen</span>
        </div>
      </div>

      <div className="cs-reviews__grid">
        <div className="cs-review-featured" data-reveal data-reveal-dir="left">
          <Stars rating={featuredReview.rating} size={18} />
          <blockquote className="cs-review-featured__quote">
            &ldquo;{featuredReview.text}&rdquo;
          </blockquote>
          <div className="cs-review-featured__footer">
            <div className="cs-review-avatar cs-review-avatar--0">
              {featuredReview.name.charAt(0)}
            </div>
            <div>
              <p className="cs-review-featured__name">{featuredReview.name}</p>
              <p className="cs-review-featured__sub">{featuredReview.product} · {featuredReview.date}</p>
            </div>
          </div>
        </div>

        <div className="cs-reviews__minis" data-reveal-stagger>
          {miniReviews.map((r, i) => (
            <div key={i} className="cs-review-mini">
              <Stars rating={r.rating} size={14} />
              <p className="cs-review-mini__text">&ldquo;{r.text}&rdquo;</p>
              <div className="cs-review-mini__footer">
                <div className={`cs-review-avatar cs-review-avatar--${i + 1}`}>
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="cs-review-mini__name">{r.name}</p>
                  <p className="cs-review-mini__sub">{r.product}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
