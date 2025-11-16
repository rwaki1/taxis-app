import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const Ride = sequelize.define('Ride', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  clientId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  driverId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  pickup: { type: DataTypes.GEOMETRY('POINT'), allowNull: false },
  dropoff: { type: DataTypes.GEOMETRY('POINT'), allowNull: false },
  status: { type: DataTypes.ENUM('requested','accepted','in_progress','completed','cancelled'), defaultValue: 'requested' },
  fare: { type: DataTypes.DECIMAL(10,2), allowNull: true },
}, {
  tableName: 'rides',
  timestamps: true,
});

export default Ride;
