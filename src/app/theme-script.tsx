export function ThemeScript() {
  const themeScript = `
    (function() {
      const theme = localStorage.getItem('theme');
      const root = document.documentElement;
      
      if (theme === '"dark"' || theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === '"light"' || theme === 'light') {
        root.classList.add('light');
      } else {
        // System theme or no theme set
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(prefersDark ? 'dark' : 'light');
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
