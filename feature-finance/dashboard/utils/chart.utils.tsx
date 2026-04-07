export function createChartDot(color: string) {
  // eslint-disable-next-line react/display-name
  return (props: any) => {
    const { cx, cy, payload } = props;
    const r = payload.isSelected ? 8 : 4;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        stroke={payload.isSelected ? '#fff' : undefined}
        strokeWidth={payload.isSelected ? 2 : undefined}
      />
    );
  };
}
