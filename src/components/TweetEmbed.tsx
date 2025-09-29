import type {FC, HTMLAttributes} from 'react';
import React, {useEffect, useRef} from 'react';

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: Element | null) => void;
        createTweet: (
          tweetId: string,
          element: Element,
          options?: {
            align?: 'left' | 'center' | 'right';
            dnt?: boolean;
            theme?: 'light' | 'dark';
            width?: number;
          },
        ) => Promise<Element>;
      };
    };
  }
}

interface TweetProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
}

const TWEET_SCRIPT_SRC = 'https://platform.twitter.com/widgets.js';

const TweetEmbed: FC<TweetProps> = ({id, style, ...rest}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let isCancelled = false;

    const renderTweet = () => {
      if (!window.twttr?.widgets || !containerRef.current || isCancelled) {
        return;
      }

      containerRef.current.innerHTML = '';
      window.twttr.widgets
        .createTweet(id, containerRef.current, {
          align: 'center',
          dnt: true,
        })
        .catch(() => {
          // noop - fallback content remains hidden
        });
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${TWEET_SCRIPT_SRC}"]`,
    );

    if (window.twttr?.widgets) {
      renderTweet();
      return () => {
        isCancelled = true;
      };
    }

    const handleScriptLoad = () => {
      renderTweet();
    };

    if (existingScript) {
      existingScript.addEventListener('load', handleScriptLoad);
      return () => {
        isCancelled = true;
        existingScript.removeEventListener('load', handleScriptLoad);
      };
    }

    const script = document.createElement('script');
    script.src = TWEET_SCRIPT_SRC;
    script.async = true;
    script.addEventListener('load', handleScriptLoad);
    document.body.appendChild(script);

    return () => {
      isCancelled = true;
      script.removeEventListener('load', handleScriptLoad);
    };
  }, [id]);

  return (
    <div
      ref={containerRef}
      style={{
        margin: '1.5rem auto',
        maxWidth: '550px',
        width: '100%',
        ...style,
      }}
      {...rest}>
      <p style={{textAlign: 'center', color: 'var(--ifm-color-secondary-dark)'}}>
        Loading tweet...
      </p>
    </div>
  );
};

export default TweetEmbed;
