import type { ReactNode } from 'react';

interface ThinkComponentProps {
  children?: ReactNode;
  // react-markdown 会传递其他一些属性，但我们这里主要关心 children
  [key: string]: any;
}

const ThinkComponent: React.FC<ThinkComponentProps> = ({ children }) => {
  return (
    <details
      style={{
        border: '1px solid #d0d7de',
        borderRadius: '6px',
        padding: '10px 16px',
        margin: '16px 0',
        backgroundColor: '#f6f8fa',
      }}
    >
      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
        思考过程...
      </summary>
      <div style={{ marginTop: '10px' }}>{children}</div>
    </details>
  );
};

export default ThinkComponent;