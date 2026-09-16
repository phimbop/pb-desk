<!-- App.svelte -->
<script>
    import { onMount } from 'svelte';

    let scrollY = $state(0);

    function handleScroll() {
        scrollY = window.scrollY;
        console.log('ScrollY:', scrollY);
    }

    onMount(() => {
        console.log('Mounting, adding scroll listener');
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Kiểm tra scroll có bị chặn không
        console.log('Body overflow:', document.body.style.overflow);
        console.log('DocumentElement scrollable:', document.documentElement.scrollHeight > window.innerHeight);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    });
</script>
<svelte:head>
    <style>
        html, body {
            overflow-x: hidden;
            scroll-behavior: smooth;
            overflow-y: scroll;
        }
    </style>
</svelte:head>
<main>
    <section class="relative h-screen w-full overflow-hidden">
        <div 
            class="absolute inset-0 w-full h-[130%] bg-cover bg-center"
            style="
                background-image: url('https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0');
                transform: translateY({scrollY * 0.5}px);
                will-change: transform;"
        ></div>

        <div class="relative h-full flex items-center justify-center bg-black/40">
            <div class="text-center text-white px-4">
                <h1 class="text-4xl md:text-6xl font-bold drop-shadow-lg">
                    Parallax Effect
                </h1>
                <p class="mt-4 text-xl drop-shadow-md">
                    Scroll position: {scrollY}px
                </p>
            </div>
        </div>
    </section>

    <section class="min-h-screen bg-gray-100 py-16">
        <div class="container mx-auto px-4">
            <h2 class="text-3xl font-bold text-center mb-8">
                Second Section
            </h2>
            <p class="text-lg text-gray-700 max-w-2xl mx-auto">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
        </div>
    </section>
</main>


<style>
    :global(body) {
        margin: 0;
        padding: 0;
        overflow-x: hidden;
    }
</style>