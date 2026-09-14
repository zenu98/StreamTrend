type AvatarDotProps = {
  cx?: number;
  cy?: number;
  index?: number;
  dataLength: number;
  imageUrl: string | null;
  channelName: string;
  color: string;
};

export function ProfileEndDot({
  cx,
  cy,
  index,
  dataLength,
  imageUrl,
  channelName,
  color,
}: AvatarDotProps) {
  // 마지막 포인트가 아니면 아무것도 그리지 않음
  if (index !== dataLength - 1 || cx == null || cy == null) return null;

  const clipId = `avatar-clip-${channelName}`;
  const R = 12;

  return (
    <g>
      {imageUrl ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <circle cx={cx} cy={cy} r={R} />
            </clipPath>
          </defs>
          <circle cx={cx} cy={cy} r={R + 2} fill="#141414" />
          <image
            href={imageUrl}
            x={cx - R}
            y={cy - R}
            width={R * 2}
            height={R * 2}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={2}
          />
        </>
      ) : (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill={color}
            stroke="#141414"
            strokeWidth={2}
          />
          <text
            x={cx}
            y={cy + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={600}
            fill="#fff"
          >
            {channelName.slice(0, 1)}
          </text>
        </>
      )}
    </g>
  );
}
