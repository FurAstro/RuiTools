export const kinds = [
  { id: 'qrcode', label: 'QR Code', levels: ['L', 'M', 'Q', 'H'], defaultLevel: 'M', hint: '通用二维码，可输入文本或完整网址。' },
  { id: 'microqrcode', label: 'Micro QR Code', levels: ['L', 'M', 'Q'], defaultLevel: 'L', hint: '适合少量内容，容量较小；内容过长时请改用 QR Code。' },
  { id: 'rectangularmicroqrcode', label: 'rMQR', levels: ['M', 'H'], defaultLevel: 'M', hint: '长方形微型二维码，自动选择合适的行列规格。' },
  { id: 'datamatrix', label: 'Data Matrix', levels: [], defaultLevel: '', hint: '使用 ECC 200 纠错，无需手动选择纠错等级。' },
  { id: 'pdf417', label: 'PDF417', levels: ['0', '1', '2', '3', '4', '5', '6', '7', '8'], defaultLevel: '2', hint: '堆叠式二维条码，纠错等级为 0–8，自动选择行列。' },
  { id: 'hanxin', label: '汉信码（Han Xin Code）', levels: ['L1', 'L2', 'L3', 'L4'], defaultLevel: 'L2', hint: '汉信码，纠错等级为 L1–L4；需要支持该码制的扫码应用。' },
];
