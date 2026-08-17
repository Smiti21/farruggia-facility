interface RevealTextProps {
  children: string;
  className?: string;
}

/**
 * Splits a line into words, each sitting inside its own overflow mask so it can
 * be slid up from behind the line above it.
 *
 * The animation itself lives with the caller (see `useScrubRise` targeting
 * `.reveal-word`) — this component only builds the structure.
 */
export default function RevealText({ children, className = '' }: RevealTextProps) {
  const words = children.split(' ');

  return (
    <span className={className} aria-label={children}>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden="true"
          // The mask clips descenders unless it is padded and pulled back.
          className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"
        >
          <span className="reveal-word inline-block will-change-transform">
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        </span>
      ))}
    </span>
  );
}
