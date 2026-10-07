import type { MarkdownInstance } from 'astro';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { categories } from './categories';

interface Metadata {
    id: string;
    title: string;
    category: string;
    description: string;
    page: string;
    order?: number;
    enabled?: boolean;
}
const documents = import.meta.glob<MarkdownInstance<Metadata>>('./**/*.md', { eager: true });
const pages = import.meta.glob<{ default: AstroComponentFactory }>('./**/*.astro');
const ids = new Set<string>();
export const tools = Object.entries(documents).flatMap(([file, document]) => {
    const data = document.frontmatter;
    const fail = (message: string): never => { throw new Error(`${file}: ${message}`); };
    if (data.enabled !== undefined && typeof data.enabled !== 'boolean') fail('enabled 必须是布尔值');
    if (data.enabled === false) return [];
    
    for (const field of ['id', 'title', 'category', 'description', 'page'] as const) {
        if (typeof data[field] !== 'string' || !data[field].trim()) fail(`缺少有效的 ${field}`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.id)) fail('id 只能使用小写字母、数字和连字符');
    if (ids.has(data.id)) fail(`工具 ID 重复：${data.id}`);
    ids.add(data.id);
    if (!categories.some(category => category.id === data.category)) fail(`分类未登记：${data.category}`);
    if (data.order !== undefined && (typeof data.order !== 'number' || !Number.isFinite(data.order))) fail('order 必须是数字');
    const relative = data.page.replace(/^\.\//, '');
    if (!relative.endsWith('.astro') || relative.split('/').some(part => !part || part === '.' || part === '..') || /[:\\?#]/.test(relative)) fail('page 必须是当前 Markdown 目录内的相对 .astro 文件名，不能使用绝对路径或 ../');
    const key = file.slice(0, file.lastIndexOf('/') + 1) + relative;
    const load = pages[key] ?? (() => import('./NotFound.astro'));
    if (!pages[key]) console.warn(`${file}: 找不到 ${data.page}，使用默认工具页面`);
    return [{ ...data, name: data.title, url: `${import.meta.env.BASE_URL}tool/${data.id}/`, load }];
}).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id));
export { categories };
