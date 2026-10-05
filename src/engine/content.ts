import type { GameContent, GameCopy, Settings, Topic } from './types';

/** Minimal runtime check for the game content JSON (src/content/game.json). */
export function asContent(raw: unknown): GameContent {
  const c = raw as Partial<GameContent>;
  if (!c || !Array.isArray(c.topics) || !c.topics.length || !c.copy || !c.entry || typeof c.timerSec !== 'number') {
    throw new Error('Invalid game content JSON');
  }
  return c as GameContent;
}

/** The game's topic: the chosen one, or the default. */
export function topicFor(content: GameContent, settings: Pick<Settings, 'topic'>): Topic {
  return content.topics.find((t) => t.id === settings.topic) ?? content.topics[0]!;
}

/** The prompt players see: a custom topic uses the host's words when there are any. */
export function promptFor(content: GameContent, settings: Pick<Settings, 'topic' | 'customPrompt'>): string {
  const topic = topicFor(content, settings);
  return (topic.custom && settings.customPrompt?.trim()) || topic.prompt;
}

/** All of this game's copy, with the topic's words filled in. */
export function copyFor(content: GameContent, settings: Pick<Settings, 'topic'>): GameCopy {
  const { item, items, question } = topicFor(content, settings);
  return { ...content.copy, item, items, question };
}
