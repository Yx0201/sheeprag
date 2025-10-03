import ReactMarkdown, { Components } from "react-markdown";


//markdown预处理阶段插件
import remarkGfm from "remark-gfm"; //支持GitHub风格的Markdown（表格、任务列表等）
import remarkMath from "remark-math"; //处理数学公式(和rehype-katex 配合)
import remarkToc from "remark-toc"; // 自动生成目录结构
import remarkFrontmatter from "remark-frontmatter"; //解析YAML等元数据

//HTML后处理阶段插件
import rehypeAutolinkHeadings from "rehype-autolink-headings"; //自动为标题添加链接
import rehypeKatex from "rehype-katex"; //渲染数学公式
// import "katex/dist/katex.min.css"; //公式样式
import rehypeSlug from "rehype-slug"; //为标题添加唯一ID，用于生成目录
import rehypeRaw from "rehype-raw"; //允许在Markdown中嵌入原始HTML

//基础的css样式
import "github-markdown-css/github-markdown.css";

//代码高亮
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";


// 单独定义 code 组件，并为其添加类型
// Components['code'] 是一个非常精确的类型，它描述了 react-markdown 传递给 code 组件的所有 props
// 目前引入的类型都是报错 暂时用any代替
const CodeBlock = ({
  node,
  inline,
  className,
  children,
  ...props
}: any) => {
  const match = /language-(\w+)/.exec(className || "");
  return !inline && match ? (
    <SyntaxHighlighter
      language={match[1]}
      PreTag="div"
      {...props}
    >
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  ) : (
    <code className={className} {...props} style={{ backgroundColor: "transparent" }}>
      {children}
    </code>
  );
};


const MarkdownRender = ({ content }: { content: string }) => {
  return (
    <div className="markdown-body" style={{ backgroundColor: "transparent" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkToc, remarkFrontmatter]}
        rehypePlugins={[
          rehypeAutolinkHeadings,
          rehypeKatex,
          rehypeSlug,
          rehypeRaw,
        ]}
        components={{
          code: CodeBlock,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRender;
