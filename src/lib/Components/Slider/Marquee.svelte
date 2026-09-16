<script lang="ts">
  import { cn } from "$lib/utils";
  interface Props {
    pauseOnHover?: boolean;
    vertical?: boolean;
    repeat?: number;
    reverse?: boolean;
    className?: string;
    children?: import("svelte").Snippet;
  }
  let {pauseOnHover = false, vertical = false, repeat = 2, reverse = false, class:className = "",  children} = $props()
  export { className as class };
</script>

<div
  class={cn(
    "group flex overflow-hidden p-2 gap-4 ",
    {
      "flex-row": !vertical,
      "flex-col": vertical,
    },
    className
  )}
>
  {#each { length: repeat } as _, i (i)}
    <div
      class={cn("flex shrink-0 justify-around gap-4", {
        "animate-marquee flex-row": !vertical,
        "animate-marquee-vertical flex-col": vertical, 
        "group-hover:[animation-play-state:paused]": pauseOnHover,
        "[animation-direction:reverse]": reverse,
      })}
    >
      {@render children?.()}
    </div>
  {/each}
</div>
