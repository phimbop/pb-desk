<script lang="ts">
    import { onMount } from 'svelte';
    import LoadingImage from './LoadingImage.svelte';
    import ErrorImage from './ErrorImage.svelte';

    interface ImageProps {
        src: string;
        alt: string;
        isCritical?: boolean;
        class?: string;
        loading?: 'eager' | 'lazy';
        fetchpriority?: 'high' | 'low' | 'auto';
        decoding?: 'async' | 'auto' | 'sync';
        [key: string]: any;
    }
    let {
        src,
        alt,
        isCritical = false,
        class: className = '',
        loading,
        fetchpriority,
        decoding = 'async',
        ...props
    }: ImageProps = $props();

    let isVisible = $state(isCritical);
    let loaded = $state(isCritical);
    let failed = $state(false);
    let showSkeleton = $state(!isCritical);
    let containerRef: HTMLDivElement | undefined = $state();

    $effect(() => {
        // Lấy dependencies động của src để kích hoạt reset khi src thay đổi
        if (src && !isCritical) {
            loaded = false;
            failed = false;
            showSkeleton = true;
        }
    });

    const handleLoad = () => {
        loaded = true;
        // Đợi transition làm mờ hoàn thành trước khi ẩn hoàn toàn skeleton loader
        setTimeout(() => {
            showSkeleton = false;
        }, 700);
    };

    const handleError = () => {
        failed = true;
        showSkeleton = false;
    };

    const setupIntersectionObserver = () => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (let i = 0; i < entries.length; i++) {
                    if (entries[i].isIntersecting) {
                        isVisible = true;
                        observer.unobserve(containerRef!);
                    }
                }
            },
            {
                root: null,
                rootMargin: '100px', // Bắt đầu load trước 100px khi đi vào viewport
                threshold: 0
            }
        );

        if (containerRef) observer.observe(containerRef);

        return () => {
            if (containerRef) observer.unobserve(containerRef);
        };
    };

    onMount(() => {
        if (!isCritical) {
            const cleanup = setupIntersectionObserver();
            return cleanup;
        }
    });
</script>

<div 
    bind:this={containerRef} 
    class="relative overflow-hidden {className}"
>
    <!-- Skeleton loader làm nền bên dưới -->
    {#if showSkeleton && !failed}
        <div class="absolute inset-0 z-0">
            <LoadingImage />
        </div>
    {/if}

    {#if failed}
        <ErrorImage />
    {:else if isVisible}
        <img
            {src}
            {alt}
            onload={handleLoad}
            onerror={handleError}
            loading={loading ?? (isCritical ? 'eager' : 'lazy')}
            fetchpriority={fetchpriority ?? (isCritical ? 'high' : 'auto')}
            {decoding}
            class="{className ? 'w-full h-full object-cover' : ''} {isCritical ? '' : 'transition-all duration-700 ease-in-out ' + (loaded ? 'blur-0 scale-100 opacity-100' : 'blur-xl scale-105 opacity-0')}"
            {...props}
        />
    {/if}
</div>