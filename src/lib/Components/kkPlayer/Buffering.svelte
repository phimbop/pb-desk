<div
  class="pointer-events-none absolute inset-0 z-40 flex h-full w-full items-center justify-center"
>
<svg 
    class="container" 
    x="0px" 
    y="0px" 
    viewBox="0 0 37 37" 
    height="37" 
    width="37" 
    preserveAspectRatio="xMidYMid meet"
  >
  <path 
    class="track" 
    fill="none" 
    stroke-width="5" 
    pathLength="100" d="M0.37 18.5 C0.37 5.772 5.772 0.37 18.5 0.37 S36.63 5.772 36.63 18.5 S31.228 36.63 18.5 36.63 S0.37 31.228 0.37 18.5">
  </path>
  <path 
    class="car" 
    fill="none" 
    stroke-width="5" 
    pathLength="100" 
    d="M0.37 18.5 C0.37 5.772 5.772 0.37 18.5 0.37 S36.63 5.772 36.63 18.5 S31.228 36.63 18.5 36.63 S0.37 31.228 0.37 18.5">
  </path>
</svg>
</div>
<style>
    .container {
      --uib-size: 37px;
      --uib-color: white;
      --uib-speed: .9s;
      --uib-bg-opacity: .4;
      height: var(--uib-size);
      width: var(--uib-size);
      transform-origin: center;
      overflow: visible;
    }
  
    .car {
      fill: none;
      stroke: var(--uib-color);
      stroke-dasharray: 15, 85;
      stroke-dashoffset: 0;
      stroke-linecap: round;
      animation: travel var(--uib-speed) linear infinite;
      will-change: stroke-dasharray, stroke-dashoffset;
      transition: stroke 0.5s ease;
    }
  
    .track {
      stroke: var(--uib-color);
      opacity: var(--uib-bg-opacity);
      transition: stroke 0.5s ease;
    }
  
    @keyframes travel {
      0% {
        stroke-dashoffset: 0;
      }
  
      100% {
        stroke-dashoffset: -100;
      }
    }
  </style>