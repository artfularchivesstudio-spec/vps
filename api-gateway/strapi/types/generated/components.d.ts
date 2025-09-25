import type { Schema, Struct } from '@strapi/strapi';

export interface AudioAudioFilesByLanguage extends Struct.ComponentSchema {
  collectionName: 'components_audio_audio_files_by_languages';
  info: {
    description: 'Audio files organized by language for multilingual content';
    displayName: 'Audio Files by Language';
  };
  attributes: {
    audioFile: Schema.Attribute.Media<'files' | 'videos'>;
    audioUrl: Schema.Attribute.String;
    duration: Schema.Attribute.Integer;
    language: Schema.Attribute.Enumeration<['en', 'es', 'hi']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'en'>;
    status: Schema.Attribute.Enumeration<
      ['processing', 'completed', 'failed']
    > &
      Schema.Attribute.DefaultTo<'processing'>;
    voice: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
  };
}

export interface SeoOpenGraph extends Struct.ComponentSchema {
  collectionName: 'components_seo_open_graphs';
  info: {
    description: 'Open Graph social media metadata';
    displayName: 'Open Graph';
  };
  attributes: {
    description: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    image: Schema.Attribute.Media<'images'>;
    siteName: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    title: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    type: Schema.Attribute.Enumeration<
      ['website', 'article', 'profile', 'video', 'image']
    > &
      Schema.Attribute.DefaultTo<'website'>;
    url: Schema.Attribute.String;
  };
}

export interface SeoSeo extends Struct.ComponentSchema {
  collectionName: 'components_seo_seos';
  info: {
    description: 'Search engine optimization metadata';
    displayName: 'SEO';
  };
  attributes: {
    canonicalURL: Schema.Attribute.String;
    keywords: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    openGraph: Schema.Attribute.Component<'seo.open-graph', false>;
    structuredData: Schema.Attribute.JSON;
    twitter: Schema.Attribute.Component<'seo.twitter', false>;
  };
}

export interface SeoTwitter extends Struct.ComponentSchema {
  collectionName: 'components_seo_twitters';
  info: {
    description: 'Twitter Card metadata';
    displayName: 'Twitter';
  };
  attributes: {
    card: Schema.Attribute.Enumeration<
      ['summary', 'summary_large_image', 'app', 'player']
    > &
      Schema.Attribute.DefaultTo<'summary_large_image'>;
    creator: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    image: Schema.Attribute.Media<'images'>;
    imageAlt: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 420;
      }>;
    site: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    title: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 70;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'audio.audio-files-by-language': AudioAudioFilesByLanguage;
      'seo.open-graph': SeoOpenGraph;
      'seo.seo': SeoSeo;
      'seo.twitter': SeoTwitter;
    }
  }
}
