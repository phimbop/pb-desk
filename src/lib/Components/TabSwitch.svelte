<script lang="ts">
	import tooltip from "$lib/helper/tooltip";
	import type { Component } from "svelte";

    export interface Item {
        label: string;
        value: number;
        icon?: Component;
    }
    interface Props {
        items: Item[];
        activeTab: number;
    }
    let { items, activeTab = $bindable(0) }: Props = $props();
</script>
<div class="menu flex items-center gap-2 relative px-4">
    <div
        class="menu-bg pointer-events-none w-80 h-16 absolute bottom-0 left-2 transform {activeTab == 0
            ? 'translate-x-0'
            : 'translate-x-40'} transition-transform duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] before:content-[''] before:bg-radial-gradient-to-b before:w-full before:h-full before:absolute before:bottom-0 before:left-0 before:opacity-100 before:transition-opacity before:duration-200 before:ease-[cubic-bezier(0.6,0.6,0,1)] after:content-[''] after:h-[1px] after:w-full after:absolute after:-top-[1px] after:left-0 after:opacity-40 after:bg-linear-to-r after:from-[rgba(5,5,30,0)] after:via-[#E2E8FF] after:to-[rgba(5,5,30,0)] after:transition-opacity after:duration-200 after:ease-[cubic-bezier(0.6,0.6,0,1)]"
    ></div>
    {#each items as item, i}
        <button
            aria-label={item.label}
            class="menu-item-{i} {activeTab == i
                ? 'w-80'
                : 'w-40'} h-16 relative cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)]"
            onclick={((e:any) => {
                e.preventDefault();
                (activeTab = item.value) ;
            })}
            use:tooltip={{ text: item.label, position: 'top' }}
        >
            <div
                class="menu-item-content {activeTab == i
                    ? '-translate-x-1/2'
                    : '-translate-x-[10px]'} flex items-center gap-2 absolute top-[calc(50%-10px)] left-1/2 transform transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)]"
            >
                <div
                    class="flex items-center justify-center w-5 h-5 overflow-hidden transition duration-200 {activeTab ==
                    i
                        ? 'text-slate-200'
                        : 'text-slate-400'}"
                >
                    <item.icon />
                </div>
                <span
                    class="transform transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] text-slate-200 truncate {activeTab ==
                    i
                        ? 'opacity-100 translate-x-0'
                        : '-translate-x-2 opacity-0'}">{item.label}</span
                >
            </div>
        </button>
    {/each}
</div>