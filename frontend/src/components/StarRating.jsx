import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, interactive = false, onChange = () => {}, size = 20 }) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    if (interactive) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={interactive ? "star-rating-interactive" : "rating-badge"} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {interactive ? (
        stars.map((star) => {
          const isFilled = hoverRating ? star <= hoverRating : star <= rating;
          return (
            <button
              key={star}
              type="button"
              className={`star-btn ${isFilled ? 'filled' : ''}`}
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={handleMouseLeave}
            >
              <Star
                size={size}
                fill={isFilled ? "var(--warning)" : "none"}
                stroke={isFilled ? "var(--warning)" : "var(--text-muted)"}
              />
            </button>
          );
        })
      ) : (
        <>
          <Star size={14} fill="var(--warning)" stroke="var(--warning)" />
          <span style={{ fontWeight: '700', marginLeft: '2px' }}>{Number(rating).toFixed(1)}</span>
        </>
      )}
    </div>
  );
}
