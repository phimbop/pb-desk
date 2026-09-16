<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import CommentItem from './CommentItem.svelte';
	import type { CommentWithUser } from '$lib/types/comments';
	import { getUserRole } from '$lib/utils/rank';
	import { appFetch } from '$lib/ipc';

	const ALLOWED_EMOJI = ['👍', '❤️', '😂', '😢', '😡', '😮'] as const;
	type ReactionEmoji = (typeof ALLOWED_EMOJI)[number];

	let {
		comment,
		currentUser,
		movieId,
		depth,
		usernames = [],
		onReplyAdded,
		onReported
	}: {
		comment: CommentWithUser;
		currentUser: { id: string; username: string; avatar_url: string | null } | null;
		movieId: string;
		depth: number;
		usernames?: string[];
		onReplyAdded: (reply: CommentWithUser, parentId: string) => void;
		onReported: (commentId: string) => void;
	} = $props();

	let userRole = $derived(getUserRole(comment.user_watch_hours ?? 0));

	let showReplyForm = $state(false);
	let replyContent = $state('');
	let submittingReply = $state(false);
	let reported = $state(false);
	let reporting = $state(false);
	let error = $state('');

	// Vote state (local optimistic)
	let score = $state(comment.score ?? 0);
	let userVote = $state<1 | -1 | null>(comment.user_vote ?? null);
	let voting = $state(false);

	// Reaction state (local optimistic)
	let reactions = $state<Record<string, number>>({ ...(comment.reactions ?? {}) });
	let userReaction = $state<string | null>(comment.user_reaction ?? null);
	let showEmojiPicker = $state(false);
	let reacting = $state(false);

	let showSuggestions = $state(false);
	let suggestions = $state<string[]>([]);
	let textareaElement = $state<HTMLTextAreaElement | null>(null);

	async function vote(value: 1 | -1) {
		if (!currentUser || voting) return;
		voting = true;

		const newValue: 1 | -1 | 0 = userVote === value ? 0 : value;

		// Optimistic update
		const prevScore = score;
		const prevVote = userVote;
		if (userVote === value) {
			score -= value;
			userVote = null;
		} else {
			if (userVote !== null) score -= userVote;
			score += value;
			userVote = value;
		}

		try {
			const res = await appFetch('/api/comments/vote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ commentId: comment.id, value: newValue })
			});
			if (!res.ok) {
				// Revert on failure
				score = prevScore;
				userVote = prevVote;
			} else {
				const data = await res.json();
				score = data.score;
				userVote = data.userVote;
			}
		} catch {
			score = prevScore;
			userVote = prevVote;
		} finally {
			voting = false;
		}
	}

	async function react(emoji: ReactionEmoji | null) {
		if (!currentUser || reacting) return;
		reacting = true;
		showEmojiPicker = false;

		// Optimistic update
		const prevReactions = { ...reactions };
		const prevUserReaction = userReaction;
		const newEmoji = emoji === prevUserReaction ? null : emoji;

		if (prevUserReaction) {
			const prev = reactions[prevUserReaction] ?? 1;
			if (prev <= 1) {
				const { [prevUserReaction]: _, ...rest } = reactions;
				reactions = rest;
			} else {
				reactions = { ...reactions, [prevUserReaction]: prev - 1 };
			}
		}
		if (newEmoji) {
			reactions = { ...reactions, [newEmoji]: (reactions[newEmoji] ?? 0) + 1 };
			userReaction = newEmoji;
		} else {
			userReaction = null;
		}

		try {
			const res = await appFetch('/api/comments/react', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ commentId: comment.id, emoji: newEmoji })
			});
			if (!res.ok) {
				reactions = prevReactions;
				userReaction = prevUserReaction;
			} else {
				const data = await res.json();
				reactions = data.reactions;
				userReaction = data.userReaction;
			}
		} catch {
			reactions = prevReactions;
			userReaction = prevUserReaction;
		} finally {
			reacting = false;
		}
	}

	function toggleReplyForm() {
		showReplyForm = !showReplyForm;
		if (showReplyForm) {
			replyContent = `@${comment.username} `;
			setTimeout(() => {
				if (textareaElement) {
					textareaElement.focus();
					textareaElement.setSelectionRange(replyContent.length, replyContent.length);
				}
			}, 50);
		} else {
			replyContent = '';
			showSuggestions = false;
			suggestions = [];
		}
	}

	function handleInput(e: Event) {
		const textarea = e.currentTarget as HTMLTextAreaElement;
		const val = textarea.value;
		const selectionStart = textarea.selectionStart;

		const textBeforeCursor = val.substring(0, selectionStart);
		const lastAtIdx = textBeforeCursor.lastIndexOf('@');

		if (lastAtIdx !== -1) {
			const wordAfterAt = textBeforeCursor.substring(lastAtIdx + 1);
			const hasSpace = /\s/.test(wordAfterAt);

			const charBeforeAt = lastAtIdx > 0 ? textBeforeCursor[lastAtIdx - 1] : '';
			const isStartOrSpace = charBeforeAt === '' || /\s/.test(charBeforeAt);

			if (!hasSpace && isStartOrSpace) {
				const query = wordAfterAt.toLowerCase();
				suggestions = usernames.filter(u => u.toLowerCase().startsWith(query));
				showSuggestions = suggestions.length > 0;
				return;
			}
		}

		showSuggestions = false;
		suggestions = [];
	}

	function selectUsername(username: string) {
		if (!textareaElement) return;
		const textarea = textareaElement;
		const val = textarea.value;
		const selectionStart = textarea.selectionStart;
		const textBeforeCursor = val.substring(0, selectionStart);
		const lastAtIdx = textBeforeCursor.lastIndexOf('@');

		if (lastAtIdx !== -1) {
			const before = val.substring(0, lastAtIdx);
			const after = val.substring(selectionStart);
			const replacement = `@${username} `;
			replyContent = before + replacement + after;

			setTimeout(() => {
				textarea.focus();
				const newCursorPos = lastAtIdx + replacement.length;
				textarea.setSelectionRange(newCursorPos, newCursorPos);
			}, 0);
		}
		showSuggestions = false;
		suggestions = [];
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMin = Math.floor(diffMs / 60000);
		const diffHour = Math.floor(diffMs / 3600000);
		const diffDay = Math.floor(diffMs / 86400000);

		if (diffMin < 1) return 'just now';
		if (diffMin < 60) return `${diffMin}m`;
		if (diffHour < 24) return `${diffHour}h`;
		if (diffDay < 30) return `${diffDay}d`;
		return date.toLocaleDateString();
	}

	function tokenizeContent(text: string): Array<{ type: 'text' | 'mention'; value: string }> {
		if (!text) return [];
		const regex = /(@[a-zA-Z0-9_\-]+)/g;
		const parts = text.split(regex);
		return parts.map((part) => {
			if (part.startsWith('@')) {
				return { type: 'mention', value: part };
			}
			return { type: 'text', value: part };
		});
	}

	async function submitReply() {
		if (!replyContent.trim() || submittingReply) return;
		submittingReply = true;
		error = '';

		try {
			const res = await appFetch('/api/comments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					movieId: String(movieId),
					content: replyContent.trim(),
					parentId: comment.id,
					path: window.location.pathname
				})
			});

			if (res.status === 429) {
				error = m.comment_rate_limited();
				return;
			}

			if (!res.ok) {
				const data = await res.json();
				error = data.error || 'Failed to post reply';
				return;
			}

			const newReply = await res.json();
			onReplyAdded(newReply, newReply.parent || comment.id);
			replyContent = '';
			showReplyForm = false;
		} catch {
			error = 'Failed to post reply';
		} finally {
			submittingReply = false;
		}
	}

	async function reportComment() {
		if (reporting || reported) return;
		reporting = true;

		try {
			const res = await appFetch('/api/comments/report', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ commentId: comment.id })
			});

			if (res.status === 409) {
				reported = true;
				return;
			}

			if (!res.ok) {
				const data = await res.json();
				error = data.error || 'Failed to report';
				return;
			}

			reported = true;
			onReported(comment.id);
		} catch {
			error = 'Failed to report';
		} finally {
			reporting = false;
		}
	}
</script>

<svelte:window onclick={() => { showSuggestions = false; showEmojiPicker = false; }} />

{#if comment.hidden}
	<div class="text-slate-600 text-sm italic py-2 {depth > 0 ? 'ml-8 pl-4 border-l border-white/10' : ''}">
		{m.comment_hidden()}
	</div>
{:else}
	<div class="{depth > 0 ? 'ml-8 pl-4 border-l border-neonPink-800/30' : ''}">
		<div class="flex gap-3">
			<!-- Avatar -->
			<div class="flex-shrink-0">
				{#if comment.avatar_url}
					<img
						src={comment.avatar_url}
						alt={comment.username}
						class="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
					/>
				{:else}
					<div class="w-8 h-8 rounded-full bg-neonPink-900/40 flex items-center justify-center text-neonPink-300 text-sm font-medium ring-1 ring-white/10">
						{comment.username.charAt(0).toUpperCase()}
					</div>
				{/if}
			</div>

			<!-- Content -->
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 flex-wrap">
					<span class="text-sm font-medium text-slate-200">{comment.username}</span>
					{#if userRole}
						<span class="px-2 py-0.5 rounded-full text-[10px] font-bold border {userRole.bgClass} flex items-center gap-1 select-none">
							{#if userRole.id === 'chua_te'}
								👑 {userRole.name}
							{:else if userRole.id === 'nha_phe_binh'}
								🖋️ {userRole.name}
							{:else if userRole.id === 'tin_do'}
								🔥 {userRole.name}
							{:else if userRole.id === 'mot_phim_real'}
								🍿 {userRole.name}
							{:else if userRole.id === 'mot_phim_apprentice'}
								🌱 {userRole.name}
							{:else}
								🎓 {userRole.name}
							{/if}
						</span>
					{/if}
					<span class="text-xs text-slate-500">{formatDate(comment.created_at)}</span>
				</div>

				<p class="text-sm text-slate-300 mt-1 whitespace-pre-wrap break-words">
					{#each tokenizeContent(comment.content) as token}
						{#if token.type === 'mention'}
							<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold bg-neonPink-500/10 text-neonPink-400 border border-neonPink-500/20 hover:bg-neonPink-500/20 hover:border-neonPink-500/30 transition-all duration-150 cursor-pointer">
								{token.value}
							</span>
						{:else}
							{token.value}
						{/if}
					{/each}
				</p>

				<!-- Actions row: votes + reactions + reply + report -->
				<div class="flex items-center gap-3 mt-2 flex-wrap">
					<!-- Vote arrows -->
					<div class="flex items-center gap-1">
						<button
							type="button"
							onclick={() => vote(1)}
							disabled={!currentUser || voting}
							aria-label={m.comment_vote_up()}
							class="p-0.5 rounded transition-colors {userVote === 1 ? 'text-neonPink-400' : 'text-slate-500 hover:text-slate-300'} disabled:cursor-not-allowed disabled:opacity-50"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
						</button>
						<span class="text-xs font-medium min-w-[1.5rem] text-center {score > 0 ? 'text-neonPink-400' : score < 0 ? 'text-red-400' : 'text-slate-500'}">{score}</span>
						<button
							type="button"
							onclick={() => vote(-1)}
							disabled={!currentUser || voting}
							aria-label={m.comment_vote_down()}
							class="p-0.5 rounded transition-colors {userVote === -1 ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'} disabled:cursor-not-allowed disabled:opacity-50"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
						</button>
					</div>

					<!-- Reactions display -->
					{#if Object.keys(reactions).length > 0}
						<div class="flex items-center gap-1 flex-wrap">
							{#each Object.entries(reactions) as [emoji, count]}
								<button
									type="button"
									onclick={(e) => { e.stopPropagation(); if (currentUser) react(emoji as ReactionEmoji); }}
									disabled={!currentUser || reacting}
									class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-all duration-150 {userReaction === emoji ? 'bg-neonPink-500/20 border-neonPink-500/40 text-neonPink-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'} disabled:cursor-not-allowed"
								>
									<span>{emoji}</span>
									<span>{count}</span>
								</button>
							{/each}
						</div>
					{/if}

					<!-- Emoji picker trigger -->
					{#if currentUser}
						<div class="relative">
							<button
								type="button"
								onclick={(e) => { e.stopPropagation(); showEmojiPicker = !showEmojiPicker; }}
								aria-label={m.comment_react()}
								class="text-xs text-slate-500 hover:text-slate-300 transition-colors px-1 py-0.5 rounded"
							>
								{userReaction ? userReaction : '😊+'}
							</button>
							{#if showEmojiPicker}
								<div
									class="absolute z-50 bottom-full mb-1 left-0 flex gap-1 p-2 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-md shadow-2xl"
									onclick={(e) => e.stopPropagation()}
								>
									{#each ALLOWED_EMOJI as emoji}
										<button
											type="button"
											onclick={() => react(emoji as ReactionEmoji)}
											class="text-lg hover:scale-125 transition-transform p-0.5 rounded {userReaction === emoji ? 'bg-neonPink-500/20' : ''}"
										>
											{emoji}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					{#if currentUser}
						<button
							onclick={toggleReplyForm}
							class="text-xs text-slate-500 hover:text-neonPink-400 transition-colors"
						>
							{m.comment_reply()}
						</button>
					{/if}

					{#if currentUser && currentUser.id !== comment.user_id}
						<button
							onclick={reportComment}
							disabled={reported || reporting}
							class="text-xs text-slate-500 hover:text-red-400 transition-colors disabled:cursor-not-allowed"
						>
							{reported ? m.comment_reported() : m.comment_report()}
						</button>
					{/if}
				</div>

				{#if error}
					<p class="text-red-400 text-xs mt-1">{error}</p>
				{/if}

				<!-- Reply form -->
				{#if showReplyForm}
					<form onsubmit={(e) => { e.preventDefault(); submitReply(); }} class="mt-3">
						<div class="relative">
							<textarea
								bind:this={textareaElement}
								bind:value={replyContent}
								oninput={handleInput}
								placeholder={m.comment_reply_placeholder()}
								maxlength={2000}
								rows={2}
								class="w-full rounded-xl bg-white/5 border border-white/10 p-2 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-neonPink-600/50 focus:ring-1 focus:ring-neonPink-600/30 transition-all duration-200"
							></textarea>

							{#if showSuggestions && suggestions.length > 0}
								<div
									class="absolute z-50 left-2 bottom-full mb-1 w-52 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-md shadow-2xl p-1 space-y-0.5 scrollbar-thin"
									onclick={(e) => e.stopPropagation()}
								>
									{#each suggestions as username}
										<button
											type="button"
											onclick={(e) => { e.stopPropagation(); selectUsername(username); }}
											class="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-neonPink-500/20 hover:text-neonPink-300 transition-colors cursor-pointer"
										>
											@{username}
										</button>
									{/each}
								</div>
							{/if}
						</div>
						<div class="flex items-center justify-between mt-1">
							<span class="text-xs text-slate-500">{replyContent.length}/2000</span>
							<div class="flex gap-2">
								<button
									type="button"
									onclick={toggleReplyForm}
									class="px-3 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={submittingReply || !replyContent.trim()}
									class="inline-flex px-4 py-1 items-center justify-center rounded-full border border-slate-700 bg-[linear-gradient(110deg,#AD005C,45%,#cc006d,55%,#AD005C)] bg-[length:200%_100%] text-xs font-medium text-slate-200 focus:outline-hidden active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
								>
									{submittingReply ? '...' : m.comment_submit()}
								</button>
							</div>
						</div>
					</form>
				{/if}
			</div>
		</div>

		<!-- Replies -->
		{#if comment.replies && comment.replies.length > 0}
			<div class="mt-3 space-y-3">
				{#each comment.replies.filter(r => !r.hidden) as reply (reply.id)}
					<CommentItem
						comment={reply}
						{currentUser}
						{movieId}
						depth={depth + 1}
						{usernames}
						{onReplyAdded}
						{onReported}
					/>
				{/each}
			</div>
		{/if}
	</div>
{/if}
