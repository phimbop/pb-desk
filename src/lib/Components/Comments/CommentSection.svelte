<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { onMount } from 'svelte';
	import CommentItem from './CommentItem.svelte';
	import type { CommentWithUser } from '$lib/types/comments';
	import { appFetch } from '$lib/ipc';

	let { movieId, user }: { movieId: string; user: { id: string; username: string; avatar_url: string | null } | null } = $props();

	let comments = $state<CommentWithUser[]>([]);
	let loading = $state(true);
	let submitting = $state(false);
	let content = $state('');
	let page = $state(1);
	let hasMore = $state(false);
	let loadingMore = $state(false);
	let error = $state('');
	let sort = $state<'popular' | 'newest'>('popular');
	let totalCount = $state(0);

	async function fetchComments(pageNum: number = 1, append: boolean = false) {
		try {
			const res = await appFetch(`/api/comments/${movieId}?page=${pageNum}&limit=20&sort=${sort}`);
			if (!res.ok) throw new Error('Failed to fetch');
			const data = await res.json();
			if (append) {
				comments = [...comments, ...data.comments];
			} else {
				comments = data.comments;
			}
			hasMore = data.hasMore;
			totalCount = data.totalCount ?? 0;
		} catch {
			error = 'Failed to load comments';
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	async function setSort(newSort: 'popular' | 'newest') {
		if (sort === newSort) return;
		sort = newSort;
		page = 1;
		loading = true;
		await fetchComments(1, false);
	}

	async function submitComment() {
		if (!content.trim() || submitting) return;
		submitting = true;
		error = '';

		try {
			const res = await appFetch('/api/comments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					movieId: String(movieId),
					content: content.trim(),
					path: window.location.pathname
				})
			});

			if (res.status === 429) {
				error = m.comment_rate_limited();
				return;
			}

			if (!res.ok) {
				const data = await res.json();
				error = data.error || 'Failed to post comment';
				return;
			}

			const newComment = await res.json();
			comments = [newComment, ...comments];
			content = '';
		} catch {
			error = 'Failed to post comment';
		} finally {
			submitting = false;
		}
	}

	function handleReplyAdded(reply: CommentWithUser, parentId: string) {
		comments = comments.map((c) => {
			if (c.id === parentId) {
				return { ...c, replies: [...c.replies, reply] };
			}
			return c;
		});
	}

	function handleCommentReported(commentId: string) {
		// Remove reported comment from view
		comments = comments.map((c) => {
			if (c.id === commentId) {
				return { ...c, hidden: true };
			}
			return {
				...c,
				replies: c.replies.map((r) =>
					r.id === commentId ? { ...r, hidden: true } : r
				)
			};
		});
	}

	async function loadMore() {
		loadingMore = true;
		page += 1;
		await fetchComments(page, true);
	}

	let usernames = $derived.by(() => {
		const set = new Set<string>();
		function addComments(list: CommentWithUser[]) {
			for (const c of list) {
				if (c.username && c.username !== 'Unknown') {
					set.add(c.username);
				}
				if (c.replies) {
					addComments(c.replies);
				}
			}
		}
		addComments(comments);
		return Array.from(set);
	});

	let showSuggestions = $state(false);
	let suggestions = $state<string[]>([]);
	let textareaElement = $state<HTMLTextAreaElement | null>(null);

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
			content = before + replacement + after;
			
			setTimeout(() => {
				textarea.focus();
				const newCursorPos = lastAtIdx + replacement.length;
				textarea.setSelectionRange(newCursorPos, newCursorPos);
			}, 0);
		}
		showSuggestions = false;
		suggestions = [];
	}

	onMount(() => {
		fetchComments();
	});
</script>

<svelte:window onclick={() => { showSuggestions = false; }} />

<section class="mt-4">
	<h3 class="text-lg font-semibold text-slate-200 mb-4">
		{m.comment_title()}
		{#if totalCount > 0}
			<span class="text-sm font-normal text-slate-400 ml-2">({totalCount})</span>
		{/if}
	</h3>

	<!-- Sort toggle -->
	<div class="flex gap-2 mb-4">
		<button
			type="button"
			onclick={() => setSort('popular')}
			class="px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 {sort === 'popular' ? 'bg-neonPink-600/30 text-neonPink-300 border border-neonPink-600/40' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}"
		>
			{m.comment_sort_popular()}
		</button>
		<button
			type="button"
			onclick={() => setSort('newest')}
			class="px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 {sort === 'newest' ? 'bg-neonPink-600/30 text-neonPink-300 border border-neonPink-600/40' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}"
		>
			{m.comment_sort_newest()}
		</button>
	</div>

	{#if user}
		<form onsubmit={(e) => { e.preventDefault(); submitComment(); }} class="mb-6">
			<div class="relative">
				<textarea
					bind:this={textareaElement}
					bind:value={content}
					oninput={handleInput}
					placeholder={m.comment_placeholder()}
					maxlength={2000}
					rows={3}
					class="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-neonPink-600/50 focus:ring-1 focus:ring-neonPink-600/30 transition-all duration-200"
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
			<div class="flex items-center justify-between mt-2">
				<span class="text-xs text-slate-500">
					{content.length}/2000
				</span>
				<button
					type="submit"
					disabled={submitting || !content.trim()}
					class="inline-flex px-5 py-1.5 items-center justify-center rounded-full border border-slate-700 bg-[linear-gradient(110deg,#AD005C,45%,#cc006d,55%,#AD005C)] bg-[length:200%_100%] animate-background-shine text-sm font-medium text-slate-200 focus:outline-hidden active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:animate-none"
				>
					{submitting ? '...' : m.comment_submit()}
				</button>
			</div>
		</form>
	{:else}
		<p class="text-slate-500 mb-6 text-sm">{m.comment_login_required()}</p>
	{/if}

	{#if error}
		<p class="text-red-400 text-sm mb-4">{error}</p>
	{/if}

	{#if loading}
		<div class="flex justify-center py-8">
			<div class="w-6 h-6 border-2 border-white/20 border-t-neonPink-500 rounded-full animate-spin"></div>
		</div>
	{:else if comments.filter(c => !c.hidden).length === 0}
		<p class="text-slate-500 text-sm text-center py-8">{m.comment_empty()}</p>
	{:else}
		<div class="space-y-4">
			{#each comments.filter(c => !c.hidden) as comment (comment.id)}
				<CommentItem
					{comment}
					currentUser={user}
					{movieId}
					depth={0}
					{usernames}
					onReplyAdded={handleReplyAdded}
					onReported={handleCommentReported}
				/>
			{/each}
		</div>

		{#if hasMore}
			<div class="flex justify-center mt-6">
				<button
					onclick={loadMore}
					disabled={loadingMore}
					class="inline-flex px-4 py-2 ease-in-out bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/10 rounded-full cursor-pointer text-sm font-medium text-slate-300 focus:outline-hidden active:scale-95 transition-all duration-150 disabled:opacity-50"
				>
					{loadingMore ? '...' : m.comment_load_more()}
				</button>
			</div>
		{/if}
	{/if}
</section>
