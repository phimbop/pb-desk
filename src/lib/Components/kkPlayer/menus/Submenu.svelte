<script lang="ts">
  import SubmenuButton from './SubmenuButton.svelte';

  interface Props {
    label: string;
    icon?: import('svelte').Snippet;
    content?: import('svelte').Snippet;
  }

  let { label, icon, content }: Props = $props();

  const icon_render = $derived(icon);
</script>

<media-menu>
  <SubmenuButton {label}>
    {#snippet icon()}
        {@render icon_render?.()}
      {/snippet}
  </SubmenuButton>
  <media-menu-items
    class="hidden w-full flex-col items-start justify-center outline-hidden data-keyboard:mt-[3px] data-open:inline-block"
  >
    {@render content?.()}
  </media-menu-items>
</media-menu>
