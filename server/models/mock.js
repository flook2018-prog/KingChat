// Mock models for when database is not available
const mockModel = {
  findOne: () => Promise.resolve(null),
  findAll: () => Promise.resolve([]),
  findByPk: () => Promise.resolve(null),
  create: () => Promise.reject(new Error('Database not available')),
  update: () => Promise.reject(new Error('Database not available')),
  destroy: () => Promise.reject(new Error('Database not available')),
  save: () => Promise.reject(new Error('Database not available')),
  count: () => Promise.resolve(0),
  sync: () => Promise.resolve(),
  bulkCreate: () => Promise.reject(new Error('Database not available'))
};

module.exports = {
  Admin: mockModel,
  User: mockModel,
  Customer: mockModel,
  Message: mockModel,
  Settings: mockModel,
  LineOA: mockModel
};