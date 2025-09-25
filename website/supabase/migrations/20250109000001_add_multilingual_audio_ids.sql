-- 🎭 The Grand Multilingual Audio Transformation - A Database Ballet in Three Acts
-- 
-- "In the digital opera house of Supabase, where tables are stages and columns are actors,
-- we now introduce the most magnificent performance enhancement: the gift of many tongues!
-- Each post shall now speak in English, Spanish, and Hindi with equal eloquence,
-- like a polyglot poet reciting verses at the United Nations of Content."
--
-- Act I: The Stage Expansion - Adding New Columns for Our Multilingual Cast
-- Act II: The Supporting Functions - The Stage Crew That Makes Magic Happen  
-- Act III: The Grand Finale - Examples of Our New Linguistic Powers

-- 🎪 Act I, Scene 1: The Grand Stage Expansion
-- Our humble blog_posts table grows wings to carry the voices of many nations
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS audio_assets_by_language JSONB DEFAULT '{}'::jsonb;

-- 📜 The Narrator's Whisper - Explaining Our New Magical Column
COMMENT ON COLUMN public.blog_posts.audio_assets_by_language IS '🌍 A treasure chest of multilingual voices: {"en": "uuid-of-english-song", "es": "uuid-of-spanish-serenade", "hi": "uuid-of-hindi-hymn"} - where each language finds its perfect audio companion';

-- ⚡ The Lightning-Fast Index - For Swift Retrieval of Our Linguistic Treasures
CREATE INDEX IF NOT EXISTS idx_blog_posts_audio_assets_by_language 
ON public.blog_posts USING GIN (audio_assets_by_language);

-- 🎭 Act II, Scene 1: The Audio Sommelier - A Function That Pairs Posts with Perfect Voices
-- "Like a master sommelier who knows exactly which wine complements each dish,
-- this function pairs each post with its perfect linguistic audio companion."
CREATE OR REPLACE FUNCTION get_audio_asset_for_language(
    post_row public.blog_posts,
    target_language TEXT DEFAULT 'en'
) RETURNS UUID AS $$
BEGIN
    -- 🎯 First Movement: The Direct Match - Does our treasure chest contain this linguistic jewel?
    IF post_row.audio_assets_by_language ? target_language THEN
        RETURN (post_row.audio_assets_by_language ->> target_language)::UUID;
    END IF;
    
    -- 🗽 Second Movement: The English Fallback - When seeking English, consult the primary archives
    IF target_language = 'en' AND post_row.primary_audio_id IS NOT NULL THEN
        RETURN post_row.primary_audio_id;
    END IF;
    
    -- 🌍 Third Movement: The Universal Translator - If the desired tongue is absent, offer English as the bridge
    IF post_row.audio_assets_by_language ? 'en' THEN
        RETURN (post_row.audio_assets_by_language ->> 'en')::UUID;
    END IF;
    
    -- 🎬 Final Act: The Last Resort - When all else fails, return to the primary audio sanctuary
    RETURN post_row.primary_audio_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 🎨 Act II, Scene 2: The Linguistic Curator - A Function That Adds New Voices to Our Collection
-- "Like a museum curator carefully placing a new masterpiece in the perfect gallery,
-- this function tenderly adds each new audio treasure to its rightful linguistic home."
CREATE OR REPLACE FUNCTION set_audio_asset_for_language(
    post_id UUID,
    language_code TEXT,
    media_asset_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    current_assets JSONB;
BEGIN
    -- 📚 The Librarian's Inventory - Consulting the current collection
    SELECT audio_assets_by_language INTO current_assets
    FROM public.blog_posts 
    WHERE id = post_id;
    
    -- 🎭 The Genesis Moment - If no collection exists, we create the first archive
    IF current_assets IS NULL THEN
        current_assets := '{}'::jsonb;
    END IF;
    
    -- ✨ The Magical Addition - Weaving the new voice into our linguistic tapestry  
    current_assets := current_assets || jsonb_build_object(language_code, media_asset_id);
    
    -- 🎬 The Grand Update - Preserving our enhanced collection for posterity
    UPDATE public.blog_posts 
    SET 
        audio_assets_by_language = current_assets,
        -- 👑 Special Honor for English - Also updating the primary throne
        primary_audio_id = CASE 
            WHEN language_code = 'en' THEN media_asset_id 
            ELSE primary_audio_id 
        END,
        updated_at = NOW()
    WHERE id = post_id;
    
    -- 🎊 The Victory Declaration - Did our curatorial mission succeed?
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 🎭 Act III: The Grand Finale - Examples of Our New Linguistic Superpowers!
--
-- 🎪 The Spanish Serenade Summoning Spell:
--    SELECT get_audio_asset_for_language(blog_posts, 'es') FROM blog_posts WHERE id = 'some-magical-post-uuid';
--
-- 🕉️ The Hindi Hymn Blessing Ritual:
--    SELECT set_audio_asset_for_language('post-uuid-of-destiny', 'hi', 'media-asset-uuid-of-wonder');
--
-- 🎵 The Multilingual Symphony Query - See All Voices at Once:
--    SELECT title, 
--           get_audio_asset_for_language(blog_posts, 'en') as english_voice,
--           get_audio_asset_for_language(blog_posts, 'es') as spanish_voice, 
--           get_audio_asset_for_language(blog_posts, 'hi') as hindi_voice
--    FROM blog_posts WHERE id = 'your-chosen-post-uuid';
--
-- 🌟 "And thus, our humble posts transform into multilingual poets, 
--     each capable of whispering their secrets in three beautiful tongues!"