const eventNames = require('../shared/constants/event-names');
const cacheService = require('../shared/services/cache.service');
const Cache = require('../shared/models/cache.model');
const CacheRepository = require('../shared/repositories/cache.repository');

const createSpaceUpdaedCache = (userId, spaceId) => {
  const cache = new Cache();
  cache.entityName = 'space';
  cache.eventName = eventNames.updated;
  cache.userId = userId;
  cache.data = JSON.stringify({ spaceId });
  return CacheRepository.create(cache);
};

const notifySpaceUpdatedEvent = async (members, spaceId) => {
  members.forEach(async (member) => {
    await createSpaceUpdaedCache(member.userId, spaceId);
    cacheService.emitUpdateCache(member.userId);
  });
};

module.exports = {
  notifySpaceUpdatedEvent,
};
