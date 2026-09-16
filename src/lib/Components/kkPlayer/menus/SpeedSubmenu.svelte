<script lang="ts">
    import MenuRadio from './MenuRadio.svelte';
    import Submenu from './Submenu.svelte';
  </script>
  
  <!-- <Submenu label="Speed">
    <media-icon class="h-5 w-5" type="closed-captions" slot="icon" />
    <media-captions-radio-group class="w-full flex flex-col" slot="content">
      <template>
        <MenuRadio />
      </template>
    </media-captions-radio-group>
  </Submenu> -->

<Submenu label="Tốc độ phát">
    {#snippet icon()}
    <media-icon type="odometer" class="parent-data-[open]:hidden h-5 w-5" ></media-icon>
  {/snippet}
    {#snippet content()}
    <media-speed-radio-group class="flex w-full flex-col" >
          <template>
              <MenuRadio />
          </template>
        </media-speed-radio-group>
  {/snippet}
  </Submenu>
  