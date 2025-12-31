// app/layout.js
import "./globals.css";
// 引入 notion 样式
import 'react-notion-x/src/styles.css'
// import 'prismjs/themes/prism-tomorrow.css'
import 'rc-dropdown/assets/index.css'

export const metadata = {
  title: "My Notion Blog",
  description: "Simple Notion Blog with Class Components",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}