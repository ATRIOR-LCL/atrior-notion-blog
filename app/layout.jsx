import "./globals.css";
import 'react-notion-x/src/styles.css'
import 'rc-dropdown/assets/index.css'

export const metadata = {
  title: "atrior notion blog",
  description: "atrior's website based on Notion & Next.js",
};

const themeScript = `
  (function() {
    try {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      function update(e) {
        if (e.matches) {
          document.documentElement.classList.add('dark-mode');
        } else {
          document.documentElement.classList.remove('dark-mode');
        }
      }
      update(mq);
      mq.addEventListener('change', update);
    } catch (e) {}
  })()
`;

export default function RootLayout({ children }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          rel="stylesheet"
          media="(prefers-color-scheme: light)"
          href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css"
        />
        <link
          rel="stylesheet"
          media="(prefers-color-scheme: dark)"
          href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}