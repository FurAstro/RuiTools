/** Fit the symbol into an exact pixel canvas without stretching or cropping it. */
export function sizeSVG(svg: string, width: number, height: number, background: string): string {
  if (![width, height].every(value => Number.isInteger(value) && value >= 64 && value <= 2048)) {
    throw new Error('图片尺寸请输入 64–2048 之间的整数。');
  }
  const dimensions = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  if (!dimensions) throw new Error('无法读取图片尺寸。');
  if (width < Number(dimensions[1]) || height < Number(dimensions[2])) {
    throw new Error(`当前内容需要更大的图片，请至少设置为 ${dimensions[1]} × ${dimensions[2]} 像素。`);
  }
  const fitted = svg.replace('<svg ', `<svg width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" `);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${background}"/>${fitted}</svg>`;
}

/** SVG is displayed as an image, never injected as HTML. */
export function setupGenerator(root: HTMLElement, render: (data: FormData) => string, filename: string) {
  const form = root.querySelector('form')!;
  const preview = root.querySelector<HTMLImageElement>('[data-preview]')!;
  const placeholder = root.querySelector<HTMLElement>('[data-placeholder]')!;
  const error = root.querySelector<HTMLElement>('[data-error]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const downloads = [...root.querySelectorAll<HTMLButtonElement>('[data-download]')];
  let result: Blob | undefined;
  let previewURL = '';
  let revision = 0;
  let timer: ReturnType<typeof setTimeout>;
  function invalidate() {
    revision++;
    result = undefined;
    preview.onload = null;
    preview.onerror = null;
    preview.hidden = true;
    preview.removeAttribute('src');
    placeholder.hidden = false;
    status.textContent = '';
    downloads.forEach(button => button.disabled = true);
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = '';
  }
  function generate() {
    clearTimeout(timer);
    invalidate();
    error.textContent = '';
    try {
      if (!form.checkValidity()) throw new Error('请检查输入内容及数值范围。');
      const rawSVG = render(new FormData(form));
      // bwip-js emits only viewBox; explicit dimensions preserve module pixels in PNG.
      const dimensions = /viewBox="0 0 (\d+) (\d+)"/.exec(rawSVG);
      if (!dimensions) throw new Error('无法读取图片尺寸。');
      const svg = rawSVG.replace('<svg ', `<svg width="${dimensions[1]}" height="${dimensions[2]}" `);
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const current = revision;
      preview.onload = () => {
        if (current !== revision) return;
        result = blob;
        preview.hidden = false;
        placeholder.hidden = true;
        status.textContent = `${preview.naturalWidth} × ${preview.naturalHeight} 像素 · 已生成`;
        downloads.forEach(button => button.disabled = false);
      };
      preview.onerror = () => { if (current === revision) error.textContent = '预览加载失败，请重新生成。'; };
      previewURL = URL.createObjectURL(blob);
      preview.src = previewURL;
    } catch (cause) {
      error.textContent = cause instanceof Error ? cause.message : `无法生成：${String(cause)}`;
    }
  }
  form.addEventListener('submit', event => { event.preventDefault(); generate(); });
  form.addEventListener('input', () => {
    clearTimeout(timer);
    invalidate();
    error.textContent = '';
    timer = setTimeout(generate, 250);
  });
  form.addEventListener('reset', () => { clearTimeout(timer); invalidate(); timer = setTimeout(generate, 0); });
  downloads.forEach(button => button.addEventListener('click', async () => {
    if (!result) return;
    const current = revision;
    const extension = button.dataset.download!;
    try {
      let blob = result;
      if (extension === 'png') {
        const canvas = document.createElement('canvas');
        canvas.width = preview.naturalWidth;
        canvas.height = preview.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('当前浏览器无法导出 PNG，请下载 SVG。');
        context.drawImage(preview, 0, 0);
        blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG 导出失败。')), 'image/png'));
      }
      if (current !== revision) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${extension}`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) { error.textContent = cause instanceof Error ? cause.message : '下载失败，请重试。'; }
  }));
  generate();
}

