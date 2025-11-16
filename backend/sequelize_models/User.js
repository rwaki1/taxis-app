import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  role: { type: DataTypes.ENUM('driver', 'client'), allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  isOnline: { type: DataTypes.BOOLEAN, defaultValue: false },
  location: { type: DataTypes.GEOMETRY('POINT'), allowNull: true },
}, {
  tableName: 'users',
  timestamps: true,
});

export default User;
