import ms from 'ms';

export function seconds(msValue: ms.StringValue): number {
  const result = ms(msValue);
  return result / 1000;
}
