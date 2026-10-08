import { qrcode, microqrcode, rectangularmicroqrcode, datamatrix, pdf417, hanxin, drawingSVG } from '@bwip-js/browser';
import { kinds } from './kinds.ts';
const encoders = { qrcode, microqrcode, rectangularmicroqrcode, datamatrix, pdf417, hanxin };

export function renderQR(data: FormData): string {
  const kind = kinds.find(item => item.id === String(data.get('kind')));
  if (!kind) throw new Error('请选择有效的二维码种类。');
  const text = String(data.get('text') ?? '');
  if (!text.trim()) throw new Error('请输入编码内容。');
  if (text.length > 4000) throw new Error('内容过长，请缩短后重试。');
  const color = (key: string) => {
    let hex = String(data.get(key) ?? '').trim();
    if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) throw new Error('颜色请输入 #RGB 或 #RRGGBB 格式，例如 #000000。');
    if (hex.length === 4) hex = '#' + [...hex.slice(1)].map(char => char + char).join('');
    return hex.toUpperCase();
  };
  const foreground = color('foreground');
  const background = color('background');
  if (foreground === background) throw new Error('前景色与背景色不能相同。');
  const size = Number(data.get('size'));
  const margin = Number(data.get('margin'));
  if (!Number.isInteger(size) || size < 64 || size > 2048) throw new Error('边长请输入 64–2048 之间的整数。');
  if (!Number.isInteger(margin) || margin < 0 || margin * 2 >= size) throw new Error('四周留白请输入非负整数，且必须小于图片边长的一半。');
  const level = String(data.get('level'));
  if (kind.levels.length && !kind.levels.includes(level)) throw new Error('请选择有效的纠错等级。');
  let svg: string;
  try {
    const options = { bcid: kind.id, text, scale: 1, padding: 0, ...(kind.levels.length ? { eclevel: kind.id === 'pdf417' ? Number(level) : level } : {}), fixedeclevel: true,
      barcolor: foreground.slice(1), backgroundcolor: background.slice(1) };
    if (kind.id === 'rectangularmicroqrcode') {
      const versions = [7, 9, 11, 13, 15, 17].flatMap(height =>
        (height === 11 || height === 13 ? [27, 43, 59, 77, 99, 139] : [43, 59, 77, 99, 139])
          .map(width => ({ height, width }))).sort((a, b) => a.height * a.width - b.height * b.width);
      let result: string | undefined;
      for (const { height, width } of versions) {
        try { 
          const rmqrOptions = {...options,version: `R${height}x${width}`};
          result = rectangularmicroqrcode(rmqrOptions, drawingSVG()); break; 
        }
        catch { /* Try the next larger standard symbol. */ }
      }
      if (!result) throw new Error('No fitting rMQR version');
      svg = result;
    } else svg = encoders[kind.id as keyof typeof encoders](options, drawingSVG());
  } catch { throw new Error('当前种类无法容纳这些内容，请缩短内容、调整纠错等级或更换种类。'); }
  const match = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  if (!match) throw new Error('无法读取二维码尺寸。');
  const nativeWidth = Number(match[1]);
  const nativeHeight = Number(match[2]);
  const available = size - margin * 2;
  // Keep rectangular symbols rectangular; size controls the longest image side.
  const ratio = available / Math.max(nativeWidth, nativeHeight);
  if (ratio < 1) throw new Error(`当前内容较密集，请将最长边至少设为 ${Math.max(nativeWidth, nativeHeight) + margin * 2} 像素。`);
  const width = Math.round(nativeWidth * ratio);
  const height = Math.round(nativeHeight * ratio);
  const inner = svg.replace('<svg ', `<svg x="${margin}" y="${margin}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" `);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width + margin * 2} ${height + margin * 2}"><rect width="100%" height="100%" fill="${background}"/>${inner}</svg>`;
}