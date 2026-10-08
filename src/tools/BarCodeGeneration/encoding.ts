import { code128, code39, code93, ean13, ean8, upca, interleaved2of5, itf14, drawingSVG } from '@bwip-js/browser';
import { sizeSVG } from './preview.ts';

export const formats = [
  { id: 'code128', group: '通用编码', label: 'Code 128（自动）', example: 'RuiTools2026', help: '可打印的英文、数字和符号，自动选择字符集。' },
  { id: 'code128a', group: '通用编码', label: 'Code 128 A', example: 'TOOLS2026', help: '大写英文、数字及 ASCII 32–95 符号；控制字符可用 ^000–^031 输入，例如 ABC^029123。' },
  { id: 'code128b', group: '通用编码', label: 'Code 128 B', example: 'RuiTools2026', help: '大小写英文、数字及可打印符号，固定使用 B 字符集。' },
  { id: 'code128c', group: '通用编码', label: 'Code 128 C', example: '001234567890', help: '仅支持偶数位数字，每两位数字编码为一组，保留前导零。' },
  { id: 'code39', group: '通用编码', label: 'Code 39', example: 'TOOLS-2026', help: '大写英文、数字、空格及 - . $ / + %；不输入起止星号。' },
  { id: 'code93', group: '通用编码', label: 'Code 93', example: 'TOOLS-2026', help: '大写英文、数字、空格及 - . $ / + %，自动计算校验字符。' },
  { id: 'ean13', group: '商品零售', label: 'EAN-13', example: '690123456789', help: '12 位数字自动补校验位，或输入完整的 13 位数字进行校验。' },
  { id: 'ean8', group: '商品零售', label: 'EAN-8', example: '9638507', help: '7 位数字自动补校验位，或输入完整的 8 位数字进行校验。' },
  { id: 'upca', group: '商品零售', label: 'UPC-A', example: '03600029145', help: '11 位数字自动补校验位，或输入完整的 12 位数字进行校验。' },
  { id: 'itf', group: '物流包装', label: 'ITF（交叉二五码）', example: '0012345678', help: '仅支持偶数位数字；不自动补零，不附加校验位。' },
  { id: 'itf14', group: '物流包装', label: 'ITF-14', example: '1001234500001', help: '13 位数字自动补校验位，或输入完整的 14 位数字进行校验。' },
];
const encoders = { code128, code39, code93, ean13, ean8, upca, itf: interleaved2of5, itf14 };

export function prepareBarcode(format: string, input: string) {
  if (!formats.some(item => item.id === format)) throw new Error('请选择有效的条形码格式。');
  if (!input.length || input.length > 80) throw new Error('请输入 1–80 个字符的编码内容。');
  let text = input;
  if (format === 'code128a') text = text.replace(/\^(\d{3})/g, (match, code) => Number(code) <= 31 ? String.fromCharCode(Number(code)) : match);
  if (format === 'code128a' && !/^[\x00-\x5f]+$/.test(text)) throw new Error('Code 128 A 不支持小写字母；控制字符请用 ^000–^031 表示。');
  if (['code128', 'code128b'].includes(format) && !/^[\x20-\x7e]+$/.test(text)) throw new Error('请使用可打印的英文、数字和符号，不支持中文。');
  if (['code128c', 'itf'].includes(format) && !/^(\d{2})+$/.test(text)) throw new Error('该格式必须输入偶数位数字。');
  if (['code39', 'code93'].includes(format) && !/^[A-Z0-9 .$/+%\-]+$/.test(text)) throw new Error('请使用大写英文、数字、空格或 - . $ / + %。');
  const length = ({ean13:13, ean8:8, upca:12, itf14:14} as Record<string, number>)[format];
  if (length) {
    if (!/^\d+$/.test(text) || ![length - 1, length].includes(text.length)) throw new Error(`请输入 ${length - 1} 或 ${length} 位数字。`);
    const body = text.slice(0, length - 1);
    const sum = [...body].reverse().reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 3 : 1), 0);
    const check = String((10 - sum % 10) % 10);
    if (text.length === length && text.at(-1) !== check) throw new Error(`校验位错误，最后一位应为 ${check}。`);
    text = body + check;
  }
  if (['code128a', 'code128b', 'code128c'].includes(format)) {
    const set = format.slice(-1);
    // Explicit codewords prevent the automatic encoder from switching character sets.
    // bwip-js adds the modulo-103 checksum and stop code itself.
    const words = [set === 'a' ? 103 : set === 'b' ? 104 : 105];
    if (set === 'c') for (let i = 0; i < text.length; i += 2) words.push(Number(text.slice(i, i + 2)));
    else for (const char of text) { const code = char.charCodeAt(0); words.push(code < 32 ? code + 64 : code - 32); }
    return { encoder: 'code128' as const, text: words.map(word => '^' + String(word).padStart(3, '0')).join(''), raw: true, alttext: input };
  }
  return { encoder: format as keyof typeof encoders, text, raw: false, alttext: text };
}

export function renderBarcode(data: FormData) {
  const prepared = prepareBarcode(String(data.get('format')), String(data.get('text') ?? ''));
  const color = (key: string) => {
    let value = String(data.get(key) ?? '').trim();
    if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) throw new Error('颜色请输入 #RGB 或 #RRGGBB，例如 #000000。');
    if (value.length === 4) value = '#' + [...value.slice(1)].map(char => char + char).join('');
    return value.toUpperCase();
  };
  const foreground = color('foreground');
  const background = color('background');
  if (foreground === background) throw new Error('前景色与背景色不能相同。');
  const options = { bcid: prepared.encoder, text: prepared.text, raw: prepared.raw, alttext: prepared.alttext,
    scale: 1, height: 15, includetext: data.has('showText'), textxalign: 'center' as const,
    paddingwidth: 12, paddingheight: 8, barcolor: foreground.slice(1), textcolor: foreground.slice(1), bordercolor: foreground.slice(1), backgroundcolor: background.slice(1) };
  const svg = encoders[prepared.encoder](options, drawingSVG());
  return sizeSVG(svg, Number(data.get('width')), Number(data.get('height')), background);
}

