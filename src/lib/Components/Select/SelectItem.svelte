<!-- SelectItem.svelte -->
<script lang="ts">
  import { cn } from "$lib/utils";

  interface Props {
    value: string | any;
    class?: string;
    close: () => void;
    onclick?: (e: any) => void;
    children?: import("svelte").Snippet;
  }

  let { value, class: className, close, onclick, children }: Props = $props();
</script>

<div
  role="option"
  tabindex="0"
  class={cn(
    "relative flex w-full items-center py-1.5 pl-3 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-neutral-900 focus:bg-neutral-900 rounded-sm cursor-pointer space-x-2 text-slate-400 focus:text-slate-200 hover:text-slate-200",
    className
  )}
  onclick={(e) => {
    onclick?.(e);
    close();
  }}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onclick?.(e);
      close();
    }
  }}
>
  {@render children?.()}
</div>