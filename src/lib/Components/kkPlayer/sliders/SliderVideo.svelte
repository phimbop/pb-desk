<script lang="ts">
import { defineCustomElement, MediaSliderVideoElement } from "vidstack/elements";
defineCustomElement(MediaSliderVideoElement);
  interface Props {
    src?: string;
  }

  let { src = "" }: Props = $props();
</script>
<media-time-slider>
  <media-slider-preview>
    <media-slider-video src="{src}"></media-slider-video>
  </media-slider-preview>
</media-time-slider>