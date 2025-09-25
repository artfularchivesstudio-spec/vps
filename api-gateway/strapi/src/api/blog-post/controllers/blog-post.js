'use strict';

/**
 * blog-post controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::blog-post.blog-post', ({ strapi }) => ({
  async find(ctx) {
    const entities = await strapi.entityService.findMany('api::blog-post.blog-post', {
      ...ctx.query,
      populate: {
        seo: true,
        audioFilesByLanguage: true
      }
    });
    return { data: entities, meta: {} };
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const entity = await strapi.entityService.findOne('api::blog-post.blog-post', id, {
      ...ctx.query,
      populate: {
        seo: true,
        audioFilesByLanguage: true
      }
    });
    return { data: entity, meta: {} };
  },

  async create(ctx) {
    const { data } = ctx.request.body;
    const entity = await strapi.entityService.create('api::blog-post.blog-post', {
      data,
      populate: {
        seo: true,
        audioFilesByLanguage: true
      }
    });
    return { data: entity, meta: {} };
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { data } = ctx.request.body;
    const entity = await strapi.entityService.update('api::blog-post.blog-post', id, {
      data,
    });
    return { data: entity, meta: {} };
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const entity = await strapi.entityService.delete('api::blog-post.blog-post', id);
    return { data: entity, meta: {} };
  },
}));