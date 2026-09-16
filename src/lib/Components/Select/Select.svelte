<!-- Select.svelte -->
<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";
	import IconArrowDown from "../Icon/IconArrowDown.svelte";
	import { quintOut } from "svelte/easing";
	import { scale, fade } from "svelte/transition";

  interface Props {
    value?: string;
    placeholder?: string;
    class?: string;
    children: Snippet<[ { close: () => void } ]>;
  }

  let { value = $bindable(""), placeholder = "Select...", class: className, children }: Props = $props();

  let open = $state(false);
  let trigger: HTMLButtonElement;
  let popover: HTMLDivElement;

  let placement: "bottom" | "top" = $state("bottom");
  const close = () => (open = false);

  function calculatePlacement() {
    if (!popover || !trigger) return;
    
    const triggerRect = trigger.getBoundingClientRect();
    const popoverHeight = popover.scrollHeight; // Sử dụng scrollHeight thay vì offsetHeight
    const viewportHeight = window.innerHeight;
    
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    
    // Ưu tiên hiển thị phía dưới, chỉ chuyển lên trên khi:
    // 1. Không đủ chỗ phía dưới
    // 2. Có đủ chỗ phía trên
    if (popoverHeight > spaceBelow && spaceAbove >= popoverHeight) {
      placement = "top";
    } else {
      placement = "bottom";
    }
  }

  function toggle() {
    open = !open;
    if (!open) return;
    
    // Đợi DOM được render và styled
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        calculatePlacement();
      });
    });
  }

  // Cập nhật placement khi scroll hoặc resize
  $effect(() => {
    if (!open) return;
    
    const handleResize = () => calculatePlacement();
    const handleScroll = () => calculatePlacement();
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  });

  // Đóng khi click bên ngoài
  $effect(() => {
    if (!open) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (trigger?.contains(target) || popover?.contains(target)) return;
      open = false;
    };
    
    // Sử dụng capture phase để đảm bảo xử lý trước các event khác
    document.addEventListener("mousedown", handleClickOutside, { capture: true });
    return () => document.removeEventListener("mousedown", handleClickOutside, { capture: true });
  });
</script>

<div class="relative z-[999999]">
  <button
    bind:this={trigger}
    onclick={toggle}
    class={cn(
      "flex w-full justify-between items-center border-[0.5px] border-white/20 px-4 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 opacity-100 transition duration-150 ease-in-out bg-white/20 backdrop-blur-xs hover:bg-slate-950/40 hover:text-slate-50 rounded-full cursor-pointer",
      className
    )}
  >
    {value || placeholder}
    <IconArrowDown class="h-4 w-4 opacity-50 transition-transform {open ? 'rotate-180' : ''}" />
  </button>

  {#if open}
    <div
    in:scale={{ duration: 150, opacity: 0.95, start: 0.95 }}
			out:fade={{ duration: 150, easing: quintOut }}
      bind:this={popover}
      class={cn(
        "absolute z-[999] h-fit w-full border-none ease-in-out mt-4 items-center cursor-pointer origin-top bg-neutral-800/60 backdrop-blur-xl rounded-2xl overflow-x-hidden text-ellipsis shadow-lg transition-all duration-100",
        placement === "bottom" ? "top-full mt-0.5" : "bottom-full mb-0.5"
      )}
    >
    <div class="overflow-y-auto max-h-60">
      {@render children({ close })}
    </div>
    </div>
  {/if}
</div>