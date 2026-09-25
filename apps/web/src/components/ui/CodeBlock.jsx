import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import oneLight from 'react-syntax-highlighter/dist/esm/styles/prism/one-light';
import { useTheme } from '../../hooks/useTheme';

SyntaxHighlighter.registerLanguage('json', json);

const codeTagProps = { style: { fontFamily: 'var(--font-mono)', background: 'transparent' } };
const customStyle = { margin: 0, padding: '0.875rem 1rem', fontSize: '12px', lineHeight: 1.6, background: 'transparent', maxHeight: '28rem', overflow: 'auto' };

export function CodeBlock({ code, language = 'json' }) {
  const { resolvedTheme } = useTheme();
  return (
    <SyntaxHighlighter language={language} style={resolvedTheme === 'dark' ? oneDark : oneLight} wrapLongLines codeTagProps={codeTagProps} customStyle={customStyle}>
      {code}
    </SyntaxHighlighter>
  );
}
