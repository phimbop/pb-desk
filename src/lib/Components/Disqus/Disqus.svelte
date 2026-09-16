
<script lang="ts">
	import { page } from "$app/stores";
	import { websiteUrl } from "$lib";
	import { onMount } from "svelte";

    /**
    *  RECOMMENDED CONFIGURATION VARIABLES: EDIT AND UNCOMMENT THE SECTION BELOW TO INSERT DYNAMIC VALUES FROM YOUR PLATFORM OR CMS.
    *  LEARN WHY DEFINING THESE VARIABLES IS IMPORTANT: https://disqus.com/admin/universalcode/#configuration-variables    */
    
  
    
    onMount(() => {
        (window as any).disqus_config = function (this: any) {
            this.page.url = websiteUrl + $page.url.pathname;  // Replace PAGE_URL with your page's canonical URL variable
            this.page.identifier = ($page.params as any).slug || $page.url.pathname; // Replace PAGE_IDENTIFIER with your page's unique identifier variable
        };
        (function() { // DON'T EDIT BELOW THIS LINE
            var d = document, s = d.createElement('script');
            s.src = 'https://phimbop.disqus.com/embed.js';
            s.setAttribute('data-timestamp', (+new Date()).toString());
            (d.head || d.body).appendChild(s);
        })();
    })
</script>
<div id="disqus_thread"></div>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>