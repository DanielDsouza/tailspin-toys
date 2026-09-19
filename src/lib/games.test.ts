import { eq } from 'drizzle-orm';
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getAllCategories,
    getGameById,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [categoryA] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [categoryB] = await db
        .insert(categories)
        .values({ name: 'Puzzle', description: 'cat2' })
        .returning({ id: categories.id });
    const [publisherA] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });
    const [publisherB] = await db
        .insert(publishers)
        .values({ name: 'Pub Two', description: 'pub2' })
        .returning({ id: publishers.id });

    for (let i = count; i >= 1; i--) {
        const categoryId = i % 2 === 0 ? categoryB.id : categoryA.id;
        const publisherId = i % 3 === 0 ? publisherB.id : publisherA.id;

        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId,
            publisherId,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('filters games by category and publisher together', async () => {
        await seedGames(db, 6);
        const categoriesList = await getAllCategories(db);
        const categoryId = categoriesList.find((category) => category.name === 'Strategy')?.id;
        const publisherId = (await db.select({ id: publishers.id }).from(publishers).where(eq(publishers.name, 'Pub One')))[0]?.id;

        const filtered = await getAllGames(db, { categoryIds: [categoryId!], publisherIds: [publisherId!] });

        expect(filtered.every((game) => game.category?.name === 'Strategy')).toBe(true);
        expect(filtered.every((game) => game.publisher?.name === 'Pub One')).toBe(true);
        expect(filtered.length).toBeGreaterThan(0);
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });
});
