function convertRotationToMatrix(rotation: number): number[] {
  const rad = (rotation * Math.PI) / 180;
  return [Math.cos(rad), -Math.sin(rad), Math.sin(rad), Math.cos(rad)];
}

// 別の実装方法も含めておきます
function convertRotationToMatrix2(degrees: number): number[] {
  // 度からラジアンに変換
  const radians = (degrees * Math.PI) / 180;

  // 以下の行列を作成:
  // [cos(r), -sin(r), 0]
  // [sin(r), cos(r), 0]
  //
  // 順序:
  // [cos(r), sin(r), -sin(r), cos(r), 0, 0]

  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [cos, sin, -sin, cos, 0, 0];
}

export { convertRotationToMatrix };
