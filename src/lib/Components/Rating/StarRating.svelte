<script lang="ts">
	import { m } from '$lib/paraglide/messages';

	interface Props {
		movieId: number | string;
		user: { id: string; username: string } | null;
		initialScore?: number;
		avgScore?: number;
		totalRatings?: number;
	}

	let {
		movieId,
		user,
		initialScore = 0,
		avgScore = 0,
		totalRatings = 0
	}: Props = $props();

	let userScore = $state(0);
	let displayAvg = $state(0);
	let displayTotal = $state(0);
	let hoverScore = $state(0);
	let submitting = $state(false);
	let message = $state('');
	let messageType: 'success' | 'error' | '' = $state('');

	// Sync props to local state when they change
	$effect(() => {
		userScore = initialScore;
	});
	$effect(() => {
		displayAvg = avgScore;
	});
	$effect(() => {
		displayTotal = totalRatings;
	});

	// Convert 1-10 integer score to star position (0.5 increments mapped to 5 stars)
	let displayStars = $derived(hoverScore > 0 ? hoverScore : userScore);
	let avgStars = $derived(displayAvg / 2);

	function getStarScore(starIndex: number, event: MouseEvent): number {
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const isHalf = x < rect.width / 2;
		// starIndex is 1-based, score is 1-10
		return isHalf ? starIndex * 2 - 1 : starIndex * 2;
	}

	function handleMouseMove(starIndex: number, event: MouseEvent) {
		if (!user || submitting) return;
		hoverScore = getStarScore(starIndex, event);
	}

	function handleMouseLeave() {
		hoverScore = 0;
	}

	async function handleClick(starIndex: number, event: MouseEvent) {
		if (!user) {
			message = m.rating_login_required();
			messageType = 'error';
			clearMessage();
			return;
		}
		if (submitting) return;

		const score = getStarScore(starIndex, event);
		submitting = true;
		message = '';

		try {
			const res = await fetch('/api/rating', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ movieId, score })
			});

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`);
			}

			const data = await res.json();
			userScore = data.score;
			displayAvg = data.avgScore;
			displayTotal = data.totalRatings;
			message = m.rating_success();
			messageType = 'success';
		} catch {
			message = m.rating_error();
			messageType = 'error';
		} finally {
			submitting = false;
			clearMessage();
		}
	}

	function clearMessage() {
		setTimeout(() => {
			message = '';
			messageType = '';
		}, 3000);
	}

	function getStarFill(starIndex: number, score: number): 'full' | 'half' | 'empty' {
		const starValue = starIndex * 2;
		if (score >= starValue) return 'full';
		if (score >= starValue - 1) return 'half';
		return 'empty';
	}
</script>

<div class="rating-container">
	<!-- User rating -->
	<div class="rating-section">
		<span class="rating-label">{m.rating_your_rating()}</span>
		<div
			class="stars"
			role="radiogroup"
			tabindex="0"
			aria-label={m.rating_your_rating()}
			onmouseleave={handleMouseLeave}
		>
			{#each [1, 2, 3, 4, 5] as star (star)}
				{@const fill = getStarFill(star, displayStars)}
				<button
					type="button"
					class="star-btn"
					class:disabled={!user}
					aria-label="{star} stars"
					onmousemove={(e) => handleMouseMove(star, e)}
					onclick={(e) => handleClick(star, e)}
					disabled={submitting}
				>
					<svg viewBox="0 0 24 24" class="star-icon" aria-hidden="true">
						{#if fill === 'full'}
							<path
								d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
								fill="currentColor"
								class="star-filled"
							/>
						{:else if fill === 'half'}
							<defs>
								<clipPath id="half-{star}">
									<rect x="0" y="0" width="12" height="24" />
								</clipPath>
							</defs>
							<path
								d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								class="star-empty"
							/>
							<path
								d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
								fill="currentColor"
								clip-path="url(#half-{star})"
								class="star-filled"
							/>
						{:else}
							<path
								d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								class="star-empty"
							/>
						{/if}
					</svg>
				</button>
			{/each}
		</div>
		{#if userScore > 0}
			<span class="score-display">{(userScore / 2).toFixed(1)}/5</span>
		{/if}
	</div>

	<!-- Community average -->
	<div class="rating-section community">
		<span class="rating-label">{m.rating_community()}</span>
		<div class="stars static" aria-label="{m.rating_community()} {(avgStars).toFixed(1)}/5">
			{#each [1, 2, 3, 4, 5] as star (star)}
				{@const fill = getStarFill(star, Math.round(displayAvg))}
				<span class="star-static">
					<svg viewBox="0 0 24 24" class="star-icon small" aria-hidden="true">
						{#if fill === 'full'}
							<path
								d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
								fill="currentColor"
								class="star-community"
							/>
						{:else if fill === 'half'}
							<defs>
								<clipPath id="avg-half-{star}">
									<rect x="0" y="0" width="12" height="24" />
								</clipPath>
							</defs>
							<path
								d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								class="star-community-empty"
							/>
							<path
								d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
								fill="currentColor"
								clip-path="url(#avg-half-{star})"
								class="star-community"
							/>
						{:else}
							<path
								d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								class="star-community-empty"
							/>
						{/if}
					</svg>
				</span>
			{/each}
		</div>
		<span class="score-display">
			{avgStars > 0 ? `${avgStars.toFixed(1)}/5` : '-'}
			<span class="rating-count">({displayTotal} {m.rating_count()})</span>
		</span>
	</div>

	<!-- Message -->
	{#if message}
		<p class="message" class:success={messageType === 'success'} class:error={messageType === 'error'}>
			{message}
		</p>
	{/if}
</div>

<style>
	.rating-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.rating-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.rating-label {
		font-size: 0.8rem;
		color: var(--text-muted, #a0a0a0);
		min-width: 5rem;
	}

	.stars {
		display: flex;
		gap: 0.125rem;
	}

	.star-btn {
		background: none;
		border: none;
		padding: 0.125rem;
		cursor: pointer;
		transition: transform 0.1s ease;
		color: var(--star-color, #fbbf24);
	}

	.star-btn:hover:not(.disabled):not(:disabled) {
		transform: scale(1.15);
	}

	.star-btn.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.star-static {
		color: var(--star-community-color, #f59e0b);
	}

	.star-icon {
		width: 1.5rem;
		height: 1.5rem;
	}

	.star-icon.small {
		width: 1.125rem;
		height: 1.125rem;
	}

	.star-filled {
		color: var(--star-color, #fbbf24);
	}

	.star-empty {
		color: var(--star-empty-color, #4b5563);
	}

	.star-community {
		color: var(--star-community-color, #f59e0b);
	}

	.star-community-empty {
		color: var(--star-empty-color, #4b5563);
	}

	.score-display {
		font-size: 0.8rem;
		color: var(--text-secondary, #d1d5db);
	}

	.rating-count {
		font-size: 0.75rem;
		color: var(--text-muted, #a0a0a0);
	}

	.message {
		font-size: 0.75rem;
		margin: 0;
		padding: 0.25rem 0;
	}

	.message.success {
		color: var(--success-color, #34d399);
	}

	.message.error {
		color: var(--error-color, #f87171);
	}
</style>
