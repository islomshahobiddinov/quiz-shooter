-- ── BATTLE (Tug-of-War Quiz) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS battle_lobbies (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code               TEXT        NOT NULL UNIQUE
                                 DEFAULT lpad(floor(random() * 1000000)::text, 6, '0'),
  quiz_id            TEXT        NOT NULL,
  quiz_title         TEXT        NOT NULL,
  quiz_questions     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  host_id            TEXT,
  status             TEXT        NOT NULL DEFAULT 'waiting',  -- waiting | playing | finished
  team_a_score       INT         NOT NULL DEFAULT 0,
  team_b_score       INT         NOT NULL DEFAULT 0,
  rope_position      INT         NOT NULL DEFAULT 50,          -- 0–100; 50 = centre
  winner             TEXT,                                      -- a | b | draw
  time_limit_seconds INT         NOT NULL DEFAULT 180,
  started_at         TIMESTAMPTZ,
  finished_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS battle_players (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id       UUID        NOT NULL REFERENCES battle_lobbies(id) ON DELETE CASCADE,
  username       TEXT        NOT NULL,
  is_host        BOOLEAN     NOT NULL DEFAULT false,
  team           TEXT        NOT NULL DEFAULT 'a',   -- a | b
  score          INT         NOT NULL DEFAULT 0,
  lives          INT         NOT NULL DEFAULT 3,
  question_index INT         NOT NULL DEFAULT 0,
  finished       BOOLEAN     NOT NULL DEFAULT false,
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row-level security (open – same pattern as other game tables)
ALTER TABLE battle_lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_players ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'battle_lobbies' AND policyname = 'battle_lobbies_all'
  ) THEN
    CREATE POLICY "battle_lobbies_all" ON battle_lobbies
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'battle_players' AND policyname = 'battle_players_all'
  ) THEN
    CREATE POLICY "battle_players_all" ON battle_players
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE battle_lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE battle_players;

-- Atomic team score increment + rope movement (avoids race conditions)
CREATE OR REPLACE FUNCTION battle_team_score(p_lobby_id UUID, p_team TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_team = 'a' THEN
    UPDATE battle_lobbies
       SET team_a_score  = team_a_score + 1,
           rope_position = GREATEST(0, LEAST(100, rope_position - 5))
     WHERE id = p_lobby_id AND status = 'playing';
  ELSE
    UPDATE battle_lobbies
       SET team_b_score  = team_b_score + 1,
           rope_position = GREATEST(0, LEAST(100, rope_position + 5))
     WHERE id = p_lobby_id AND status = 'playing';
  END IF;
END;
$$;
