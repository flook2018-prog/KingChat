const Admin = require('./Admin');
const User = require('./User');
const Customer = require('./Customer');
const Message = require('./Message');
const Settings = require('./Settings');
const LineOA = require('./LineOA');

// Define associations
Customer.hasMany(Message, { foreignKey: 'customerId', as: 'messages' });
Message.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Message, { foreignKey: 'userId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'userId', as: 'sender' });

LineOA.hasMany(Customer, { foreignKey: 'lineOAId', as: 'customers' });
Customer.belongsTo(LineOA, { foreignKey: 'lineOAId', as: 'lineOA' });

LineOA.hasMany(Message, { foreignKey: 'lineOAId', as: 'messages' });
Message.belongsTo(LineOA, { foreignKey: 'lineOAId', as: 'lineOA' });

module.exports = {
  Admin,
  User,
  Customer,
  Message,
  Settings,
  LineOA
};