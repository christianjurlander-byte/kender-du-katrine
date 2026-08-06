/**
 * A minimal in-memory stand-in for the Supabase client, implementing just
 * enough of the query builder chain (.from/.select/.eq/.order/.insert/.update/
 * .maybeSingle, plus being awaitable directly) to exercise our route handlers
 * in tests without hitting a real database.
 */

type Row = Record<string, unknown>;
type Store = Record<string, Row[]>;

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `id-${idCounter}`;
}

class FakeQueryBuilder {
  private filters: Array<[string, unknown]> = [];
  private single = false;
  private countOpts: { count?: string; head?: boolean } | null = null;
  private insertRows: Row[] | null = null;
  private updatePatch: Row | null = null;
  private orderCol: string | null = null;
  private orderAsc = true;

  constructor(
    private store: Store,
    private table: string,
    private uniqueChecks: Record<string, string[]>
  ) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (opts) this.countOpts = opts;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push([col, val]);
    return this;
  }

  ilike(col: string, val: string) {
    this.filters.push([`ilike:${col}`, String(val).toLowerCase()]);
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  insert(rows: Row | Row[]) {
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(patch: Row) {
    this.updatePatch = patch;
    return this;
  }

  maybeSingle() {
    this.single = true;
    return this.execute();
  }

  then<TResult1 = { data: unknown; error: unknown; count?: number }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: unknown; count?: number }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private matches(row: Row) {
    return this.filters.every(([col, val]) => {
      if (col.startsWith("ilike:")) {
        const realCol = col.slice("ilike:".length);
        return String(row[realCol]).toLowerCase() === val;
      }
      return row[col] === val;
    });
  }

  private async execute(): Promise<{ data: unknown; error: unknown; count?: number }> {
    const rows = this.store[this.table] ?? (this.store[this.table] = []);

    if (this.insertRows) {
      const uniqueCols = this.uniqueChecks[this.table] ?? [];
      for (const candidate of this.insertRows) {
        const conflict = rows.find((r) => uniqueCols.every((c) => r[c] === candidate[c]));
        if (conflict) {
          return { data: null, error: { code: "23505", message: "duplicate" } };
        }
      }
      const inserted = this.insertRows.map((r) => ({
        id: nextId(),
        created_at: new Date().toISOString(),
        ...r,
      }));
      rows.push(...inserted);
      return { data: this.single ? inserted[0] ?? null : inserted, error: null };
    }

    let filtered = rows.filter((r) => this.matches(r));

    if (this.updatePatch) {
      filtered.forEach((r) => Object.assign(r, this.updatePatch));
      return { data: filtered, error: null };
    }

    if (this.orderCol) {
      const col = this.orderCol;
      filtered = [...filtered].sort((a, b) => {
        const av = a[col] as string | number;
        const bv = b[col] as string | number;
        return this.orderAsc ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
      });
    }

    if (this.countOpts) {
      return { data: this.countOpts.head ? null : filtered, error: null, count: filtered.length };
    }

    if (this.single) {
      return { data: filtered[0] ?? null, error: null };
    }
    return { data: filtered, error: null };
  }
}

export interface FakeSupabaseClient {
  from(table: string): FakeQueryBuilder;
  __store: Store;
}

/**
 * uniqueChecks lets tests declare simple composite-unique constraints,
 * e.g. { answers: ["question_id", "player_id"] }, so inserts that violate
 * them resolve like Postgres would (error code 23505).
 */
export function createFakeSupabaseClient(
  seed: Store = {},
  uniqueChecks: Record<string, string[]> = {}
): FakeSupabaseClient {
  const store: Store = JSON.parse(JSON.stringify(seed));
  return {
    from: (table: string) => new FakeQueryBuilder(store, table, uniqueChecks),
    __store: store,
  };
}
