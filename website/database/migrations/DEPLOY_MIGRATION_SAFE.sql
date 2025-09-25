-- 🎭 SAFE DEPLOYMENT VERSION - Handles Existing Columns Gracefully
-- 
-- "Like a wise stage manager who checks if the props are already in place,
-- this script gracefully handles the possibility that our multilingual magic
-- may already be partially cast upon the database stage."

-- 🎪 Act I: The Gentle Column Addition (Only if Not Already Present)
-- We check if our magical column already graces the stage before adding it
DO $$
BEGIN
    -- 🔍 The Detective's Inquiry - Does our column already exist?
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'audio_assets_by_language'
        AND table_schema = 'public'
    ) THEN
        -- 🎭 The Grand Addition - Our column makes its debut
        ALTER TABLE public.blog_posts 
        ADD COLUMN audio_assets_by_language JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE '🎪 Column "audio_assets_by_language" has been gracefully added to the stage!';
    ELSE
        RAISE NOTICE '🎭 Column "audio_assets_by_language" was already performing on stage!';
    END IF;
END $$;

-- 📜 The Narrator's Whisper - Explaining Our Magical Column (Safe to run multiple times)
COMMENT ON COLUMN public.blog_posts.audio_assets_by_language IS '🌍 A treasure chest of multilingual voices: {"en": "uuid-of-english-song", "es": "uuid-of-spanish-serenade", "hi": "uuid-of-hindi-hymn"} - where each language finds its perfect audio companion';

-- ⚡ The Lightning-Fast Index - For Swift Retrieval (Safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_blog_posts_audio_assets_by_language 
ON public.blog_posts USING GIN (audio_assets_by_language);

-- 🎭 Act II: The Audio Sommelier Function (Safe to recreate)
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

-- 🎨 Act III: The Linguistic Curator Function (Safe to recreate)
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

-- 🎊 The Graceful Finale - Verify Everything is in Place
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'blog_posts' 
            AND column_name = 'audio_assets_by_language'
        ) THEN '✅ Column exists!'
        ELSE '❌ Column missing!'
    END as column_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_audio_asset_for_language'
        ) THEN '✅ Get function ready!'
        ELSE '❌ Get function missing!'
    END as get_function_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'set_audio_asset_for_language'
        ) THEN '✅ Set function ready!'
        ELSE '❌ Set function missing!'
    END as set_function_status;

-- 🌟 Final celebration message
SELECT '🎭✨ The Safe Multilingual Audio Transformation is COMPLETE! ✨🎭' as celebration;