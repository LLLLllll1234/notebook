import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create some sample tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'JavaScript' },
      update: {},
      create: { name: 'JavaScript' }
    }),
    prisma.tag.upsert({
      where: { name: 'React' },
      update: {},
      create: { name: 'React' }
    }),
    prisma.tag.upsert({
      where: { name: '学习笔记' },
      update: {},
      create: { name: '学习笔记' }
    }),
    prisma.tag.upsert({
      where: { name: '前端开发' },
      update: {},
      create: { name: '前端开发' }
    })
  ])

  // Create sample posts
  const samplePosts = [
    {
      title: 'JavaScript 基础知识总结',
      slug: 'javascript-basics-summary',
      content: `# JavaScript 基础知识总结

## 变量和数据类型

JavaScript 有以下几种基本数据类型：

- **String**: 字符串类型
- **Number**: 数字类型 
- **Boolean**: 布尔类型
- **Undefined**: 未定义类型
- **Null**: 空值类型
- **Symbol**: 符号类型 (ES6+)
- **BigInt**: 大整数类型 (ES2020+)

## 函数

### 函数声明
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### 箭头函数
\`\`\`javascript
const greet = (name) => \`Hello, \${name}!\`;
\`\`\`

## 对象和数组

### 对象
\`\`\`javascript
const person = {
  name: 'John',
  age: 30,
  city: 'New York'
};
\`\`\`

### 数组
\`\`\`javascript
const fruits = ['apple', 'banana', 'orange'];
\`\`\`

## ES6+ 特性

- **解构赋值**: 从对象或数组中提取值
- **模板字符串**: 使用反引号创建字符串
- **Promise**: 处理异步操作
- **async/await**: 更简洁的异步代码写法

这些是JavaScript的基础知识，掌握这些概念对于前端开发非常重要。`,
      tags: ['JavaScript', '学习笔记', '前端开发']
    },
    {
      title: 'React Hooks 使用指南',
      slug: 'react-hooks-guide',
      content: `# React Hooks 使用指南

React Hooks 是 React 16.8 引入的新特性，让我们可以在函数组件中使用状态和其他 React 特性。

## useState Hook

最常用的 Hook，用于在函数组件中添加状态：

\`\`\`javascript
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
\`\`\`

## useEffect Hook

用于执行副作用操作，如数据获取、订阅或手动更改 DOM：

\`\`\`javascript
import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`You clicked \${count} times\`;
  });

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
\`\`\`

## 自定义 Hook

你可以创建自己的 Hook 来复用状态逻辑：

\`\`\`javascript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}
\`\`\`

Hooks 让 React 组件更加简洁和可复用！`,
      tags: ['React', 'JavaScript', '前端开发']
    }
  ]

  // Create posts with tags
  for (const postData of samplePosts) {
    const post = await prisma.post.create({
      data: {
        title: postData.title,
        slug: postData.slug,
        content: postData.content,
        tags: {
          create: postData.tags.map(tagName => ({
            tag: {
              connect: { name: tagName }
            }
          }))
        }
      }
    })

    console.log(`Created post: ${post.title}`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })