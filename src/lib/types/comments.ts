export interface CommentWithUser {
	id: string;
	content: string;
	created_at: string;
	hidden: boolean;
	parent: string | null;
	user_id: string;
	username: string;
	avatar_url: string | null;
	score: number;
	user_vote: 1 | -1 | null;
	reactions: Record<string, number>;
	user_reaction: string | null;
	user_watch_hours?: number;
	replies: CommentWithUser[];
}

export const ALLOWED_EMOJI = ['👍', '❤️', '😂', '😢', '😡', '😮'] as const;
export type ReactionEmoji = (typeof ALLOWED_EMOJI)[number];
