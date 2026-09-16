<script lang="ts">
</script>

<div class="flex absolute mx-auto top-0 left-0 right-0 w-full h-full max-h-screen backdrop-blur-xs bg-slate-900/10 z-50 items-center justify-center">
    <div class="container"></div>
</div>

<style>
  .container {
    --uib-size: 80px;
    --uib-color: rgb(226 232 240);
    --uib-speed: 1.4s;
    --uib-stroke: 5px;
    --uib-bg-opacity: .1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--uib-stroke);
    width: var(--uib-size);
    border-radius: calc(var(--uib-stroke) / 2);
    overflow: hidden;
    transform: translate3d(0, 0, 0);
  }

  .container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: var(--uib-color);
    opacity: var(--uib-bg-opacity);
    transition: background-color 0.3s ease;
  }

  .container::after {
    content: '';
    height: 100%;
    width: 100%;
    border-radius: calc(var(--uib-stroke) / 2);
    animation: zoom var(--uib-speed) ease-in-out infinite;
    transform: translateX(-100%);
    background-color: var(--uib-color);
    transition: background-color 0.3s ease;
  }

  @keyframes zoom {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
</style>

