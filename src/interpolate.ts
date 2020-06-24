export function interpolate(value: string, params: Object): string {
  const names = Object.keys(params);
  const vals = Object.values(params);
  return new Function(...names, `return \`${value}\`;`)(...vals);
}

export function interpolateDate(
  format: string,
  formatter: Intl.DateTimeFormat,
  date: Date
): string {
  const parts = formatter.formatToParts(date);
  var params = {} as any;
  for (const part of parts) {
    params[part.type] = part.value;
  }

  return interpolate(format, params);
}
