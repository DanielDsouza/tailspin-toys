/**
 * Publisher lookup helpers for build-time catalog pages.
 * These functions query the SQLite database directly at build time and expose
 * the minimal publisher data needed by Astro pages and components.
 */

import { asc } from 'drizzle-orm';
import type { Database } from './db';
import { publishers } from '../../db/schema';
import type { Publisher } from '../types/game';

/**
 * Retrieves every publisher ordered alphabetically by name.
 *
 * @param db - The injected database connection used to query publisher rows.
 * @returns A list of publishers with their id and name values.
 */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    const rows = await db
        .select({ id: publishers.id, name: publishers.name })
        .from(publishers)
        .orderBy(asc(publishers.name));

    return rows.map((row) => ({ id: row.id, name: row.name }));
}
