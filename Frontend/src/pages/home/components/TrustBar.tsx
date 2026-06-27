import { TRUST_ITEMS } from './home.data';

export function TrustBar() {
  return (
    <div className="trust-bar" aria-hidden="true">
      <div className="trust-bar__track">
        {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
          <span key={i} className="trust-bar__item">{item}</span>
        ))}
      </div>
    </div>
  );
}
