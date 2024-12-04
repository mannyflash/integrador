import { Html, Head, Main, NextScript } from 'next/document';
import { getTheme } from '../lib/theme';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = ${JSON.stringify(getTheme())};
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  console.error('Error applying theme:', e);
                }
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

