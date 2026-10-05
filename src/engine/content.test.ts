import { describe, expect, it } from 'vitest';
import { copyFor, promptFor, topicFor } from './content';
import { createGame } from './game';
import { redactFor } from './redact';
import { TEST_CONTENT } from './testing';
import type { GameContent } from './types';

const CONTENT: GameContent = {
  ...TEST_CONTENT,
  topics: [
    { id: 'story', label: 'Story', prompt: 'Tell a story', item: 'Story', items: 'Stories', question: 'Whose story?' },
    { id: 'movie', label: 'Movie', prompt: 'Name a movie', item: 'Movie', items: 'Movies', question: 'Whose movie?' },
    { id: 'custom', label: 'Custom', prompt: 'Anything', item: 'Answer', items: 'Answers', question: 'Whose answer?', custom: true },
  ],
};

describe('topics', () => {
  it('defaults to the first topic (older saves have none)', () => {
    expect(topicFor(CONTENT, {}).id).toBe('story');
    expect(topicFor(CONTENT, { topic: 'gone' }).id).toBe('story');
  });

  it("fills the topic's words into the copy", () => {
    const copy = copyFor(CONTENT, { topic: 'movie' });
    expect([copy.item, copy.items, copy.question, copy.reveal]).toEqual(['Movie', 'Movies', 'Whose movie?', 'r']);
  });

  it("uses the host's prompt only for a custom topic, falling back when it's blank", () => {
    expect(promptFor(CONTENT, { topic: 'custom', customPrompt: ' Your dream job ' })).toBe('Your dream job');
    expect(promptFor(CONTENT, { topic: 'custom', customPrompt: '  ' })).toBe('Anything');
    expect(promptFor(CONTENT, { topic: 'movie', customPrompt: 'ignored' })).toBe('Name a movie');
  });

  it('sends the topic to phones', () => {
    const s = createGame(CONTENT, { topic: 'custom', customPrompt: 'Your dream job' });
    const view = redactFor(s, 'x', 0);
    expect([view.settings.topic, view.settings.customPrompt]).toEqual(['custom', 'Your dream job']);
  });
});
