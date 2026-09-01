export function CnpjLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <svg height="108px" width="108px" viewBox="0 0 128 128" style={{ width: "8em", height: "8em" }}>
        <style>{`
          .loader__eye1,
          .loader__eye2,
          .loader__mouth1,
          .loader__mouth2 {
            animation: cnpj-eye1 3s ease-in-out infinite;
          }
          .loader__eye1,
          .loader__eye2 {
            transform-origin: 64px 64px;
          }
          .loader__eye2 {
            animation-name: cnpj-eye2;
          }
          .loader__mouth1 {
            animation-name: cnpj-mouth1;
          }
          .loader__mouth2 {
            animation-name: cnpj-mouth2;
            visibility: hidden;
          }
          @keyframes cnpj-eye1 {
            from { transform: rotate(-260deg) translate(0, -56px); }
            50%, 60% {
              animation-timing-function: cubic-bezier(0.17, 0, 0.58, 1);
              transform: rotate(-40deg) translate(0, -56px) scale(1);
            }
            to { transform: rotate(225deg) translate(0, -56px) scale(0.35); }
          }
          @keyframes cnpj-eye2 {
            from { transform: rotate(-260deg) translate(0, -56px); }
            50% { transform: rotate(40deg) translate(0, -56px) rotate(-40deg) scale(1); }
            52.5% { transform: rotate(40deg) translate(0, -56px) rotate(-40deg) scale(1, 0); }
            55%, 70% {
              animation-timing-function: cubic-bezier(0, 0, 0.28, 1);
              transform: rotate(40deg) translate(0, -56px) rotate(-40deg) scale(1);
            }
            to { transform: rotate(150deg) translate(0, -56px) scale(0.4); }
          }
          @keyframes cnpj-mouth1 {
            from { animation-timing-function: ease-in; stroke-dasharray: 0 351.86; stroke-dashoffset: 0; }
            25% { animation-timing-function: ease-out; stroke-dasharray: 175.93 351.86; stroke-dashoffset: 0; }
            50% {
              animation-timing-function: steps(1, start);
              stroke-dasharray: 175.93 351.86;
              stroke-dashoffset: -175.93;
              visibility: visible;
            }
            75%, to { visibility: hidden; }
          }
          @keyframes cnpj-mouth2 {
            from { animation-timing-function: steps(1, end); visibility: hidden; }
            50% { animation-timing-function: ease-in-out; visibility: visible; stroke-dashoffset: 0; }
            to { stroke-dashoffset: -351.86; }
          }
        `}</style>
        <defs>
          <clipPath id="cnpj-loader-eyes">
            <circle transform="rotate(-40,64,64) translate(0,-56)" r={8} cy={64} cx={64} className="loader__eye1" />
            <circle transform="rotate(40,64,64) translate(0,-56)" r={8} cy={64} cx={64} className="loader__eye2" />
          </clipPath>
          <linearGradient y2={1} x2={0} y1={0} x1={0} id="cnpj-loader-grad">
            <stop stopColor="#000" offset="0%" />
            <stop stopColor="#fff" offset="100%" />
          </linearGradient>
          <mask id="cnpj-loader-mask">
            <rect fill="url(#cnpj-loader-grad)" height={128} width={128} y={0} x={0} />
          </mask>
        </defs>
        <g strokeDasharray="175.93 351.86" strokeWidth={12} strokeLinecap="round">
          <g>
            <rect clipPath="url(#cnpj-loader-eyes)" height={64} width={128} fill="hsl(193,90%,50%)" />
            <g stroke="hsl(193,90%,50%)" fill="none">
              <circle transform="rotate(180,64,64)" r={56} cy={64} cx={64} className="loader__mouth1" />
              <circle transform="rotate(0,64,64)" r={56} cy={64} cx={64} className="loader__mouth2" />
            </g>
          </g>
          <g mask="url(#cnpj-loader-mask)">
            <rect clipPath="url(#cnpj-loader-eyes)" height={64} width={128} fill="hsl(223,90%,50%)" />
            <g stroke="hsl(223,90%,50%)" fill="none">
              <circle transform="rotate(180,64,64)" r={56} cy={64} cx={64} className="loader__mouth1" />
              <circle transform="rotate(0,64,64)" r={56} cy={64} cx={64} className="loader__mouth2" />
            </g>
          </g>
        </g>
      </svg>
      <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Buscando dados do CNPJ...</p>
    </div>
  );
}
