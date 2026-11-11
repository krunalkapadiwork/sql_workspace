import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './user.model';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface InvitationAttributes {
  id: string;
  userId: string;
  invitedBy: string;
  tokenHash: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date | null;
  revokedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type InvitationCreationAttributes = Optional<
  InvitationAttributes,
  'id' | 'status' | 'acceptedAt' | 'revokedAt' | 'createdAt' | 'updatedAt'
>;

export class Invitation
  extends Model<InvitationAttributes, InvitationCreationAttributes>
  implements InvitationAttributes
{
  declare id: string;
  declare userId: string;
  declare invitedBy: string;
  declare tokenHash: string;
  declare status: InvitationStatus;
  declare expiresAt: Date;
  declare acceptedAt: Date | null;
  declare revokedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare readonly user?: User;
  declare readonly inviter?: User;
}

Invitation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'invited_by',
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'token_hash',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'accepted_at',
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at',
    },
  },
  {
    sequelize,
    tableName: 'invitations',
    timestamps: true,
    underscored: true,
  },
);

